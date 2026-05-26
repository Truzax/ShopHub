import Cart from '../models/Cart';

export class CartService {
  static async getCart(userId: string) {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    return cart;
  }

  static async updateCart(userId: string, items: any[]) {
    let cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = items;
      await cart.save();
    } else {
      cart = await Cart.create({ user: userId, items });
    }
    return await Cart.findById(cart._id).populate('items.product');
  }

  static async clearCart(userId: string) {
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });
    return { message: 'Cart cleared successfully' };
  }
}
