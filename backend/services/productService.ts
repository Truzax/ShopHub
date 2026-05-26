import Product from '../models/Product';

export class ProductService {
  static async getProducts(query: any) {
    if (query.ids) {
      const ids = (query.ids as string).split(',');
      const products = await Product.find({ _id: { $in: ids } });
      return { success: true, count: products.length, data: products };
    }

    const page = parseInt(query.page as string, 10) || 1;
    const limit = parseInt(query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({}).skip(skip).limit(limit);
    const total = await Product.countDocuments({});

    return {
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: products
    };
  }

  static async getCategories() {
    const categories = await Product.distinct('category');
    return { success: true, data: categories };
  }

  static async getProductById(id: string) {
    const product = await Product.findById(id);
    if (!product) throw { status: 404, message: 'Product not found' };
    return product;
  }

  static async createProduct(data: any) {
    return await Product.create(data);
  }

  static async createBulkProducts(data: any) {
    if (!Array.isArray(data)) {
      throw { status: 400, message: 'Request body must be an array of products' };
    }
    const newProducts = await Product.insertMany(data);
    return { success: true, count: newProducts.length, data: newProducts };
  }

  static async updateProduct(id: string, data: any) {
    const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updatedProduct) throw { status: 404, message: 'Product not found' };
    return updatedProduct;
  }

  static async deleteProduct(id: string) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw { status: 404, message: 'Product not found' };
    return { message: 'Product deleted successfully' };
  }
}
