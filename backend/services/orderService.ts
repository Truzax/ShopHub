import Order from '../models/Order';
import Product from '../models/Product';

export class OrderService {
  static async createOrder(user: any, products: any[]) {
    if (!user) throw { status: 401, message: 'User not authenticated' };
    if (!Array.isArray(products) || products.length === 0) {
      throw { status: 400, message: 'Order must contain at least one product' };
    }

    let calculatedTotal = 0;
    const processedProducts = [];

    for (const item of products) {
      if (!item.product || !item.quantity || item.quantity <= 0) {
        throw { status: 400, message: 'Invalid product item format' };
      }

      const product = await Product.findById(item.product);
      if (!product) {
        throw { status: 404, message: `Product with ID ${item.product} not found` };
      }

      calculatedTotal += product.price * item.quantity;
      processedProducts.push({
        product: product._id,
        name: product.name,
        category: product.category,
        quantity: item.quantity,
        price: product.price
      });
    }

    const newOrder = await Order.create({
      user: user._id,
      products: processedProducts,
      total: calculatedTotal,
      status: 'pending'
    });

    return newOrder;
  }

  static async getOrders(user: any, queryParams: any) {
    if (!user) throw { status: 401, message: 'User not authenticated' };

    const limit = parseInt(queryParams.limit as string, 10) || 10;
    const page = parseInt(queryParams.page as string, 10) || 1;
    const lastId = queryParams.lastId as string;

    const query: any = user.role === 'admin' ? {} : { user: user._id };
    if (lastId) {
      query._id = { $lt: lastId };
    }

    const orders = await Order.find(query)
      .sort({ _id: -1 })
      .populate('user', 'name email')
      .populate('products.product', 'name price category')
      .limit(limit + 1);

    const hasNext = orders.length > limit;
    if (hasNext) orders.pop();

    const response = {
      success: true,
      count: orders.length,
      nextCursor: hasNext ? orders[orders.length - 1]?._id : null,
      page,
      pages: hasNext ? page + 1 : page,
      total: orders.length,
      data: orders
    };

    return response;
  }

  static async getOrderById(user: any, orderId: string) {
    if (!user) throw { status: 401, message: 'User not authenticated' };

    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate('products.product', 'name price category');

    if (!order) throw { status: 404, message: 'Order not found' };

    if (order.user._id.toString() !== user._id.toString() && user.role !== 'admin') {
      throw { status: 403, message: 'Not authorized to view this order' };
    }

    return order;
  }

  static async updateOrderStatus(orderId: string, status: string) {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw { status: 400, message: 'Invalid status' };
    }

    const order = await Order.findById(orderId);
    if (!order) throw { status: 404, message: 'Order not found' };

    const shouldDeductStock =
      !order.stockUpdated &&
      order.status === 'pending' &&
      status !== 'pending' &&
      status !== 'cancelled';

    if (shouldDeductStock) {
      for (const item of order.products) {
        const product = await Product.findById(item.product);

        if (!product) {
          throw { status: 404, message: `Product with ID ${item.product} not found` };
        }

        if (product.stock < item.quantity) {
          throw { status: 400, message: `Insufficient stock for product ${product.name}` };
        }

        product.stock -= item.quantity;
        await product.save();
      }
      order.stockUpdated = true;
    }

    order.status = status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    await order.save();

    return order;
  }
}
