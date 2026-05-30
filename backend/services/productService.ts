import Product from '../models/Product';
import mongoose from 'mongoose';
import redis from '../config/redis';

export class ProductService {
  static async getProducts(query: any) {
    if (query.ids) {
      const ids = (query.ids as string).split(',');
      const products = await Product.find({ _id: mongoose.trusted({ $in: ids }) });
      return { success: true, count: products.length, data: products };
    }

    // Cache key for default product listing without lastId
    const cacheKey = `products:limit:${query.limit || 10}`;
    const lastId = query.lastId as string;
    
    if (!lastId && !query.ids) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.error('Redis get error:', e);
      }
    }

    const limit = parseInt(query.limit as string, 10) || 10;
    const page = parseInt(query.page as string, 10) || 1;
    
    const filter: any = {};
    if (lastId) {
      filter._id = { $gt: lastId };
    }

    const products = await Product.find(filter).sort({ _id: 1 }).limit(limit + 1);
    const hasNext = products.length > limit;
    if (hasNext) products.pop();
    
    const response = {
      success: true,
      count: products.length,
      nextCursor: hasNext ? products[products.length - 1]?._id : null,
      page,
      pages: hasNext ? page + 1 : page,
      total: products.length,
      data: products
    };

    if (!lastId && !query.ids) {
      try {
        await redis.setex(cacheKey, 3600, JSON.stringify(response));
      } catch (e) {
        console.error('Redis set error:', e);
      }
    }

    return response;
  }

  static async getCategories() {
    const cacheKey = 'categories';
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error('Redis get error:', e);
    }

    const categories = await Product.distinct('category');
    const response = { success: true, data: categories };
    
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(response));
    } catch (e) {
      console.error('Redis set error:', e);
    }
    return response;
  }

  static async getProductById(id: string) {
    const product = await Product.findById(id);
    if (!product) throw { status: 404, message: 'Product not found' };
    return product;
  }

  static async invalidateCache() {
    try {
      await redis.del('categories');
      const keys = await redis.keys('products:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (e) {
      console.error('Redis invalidate error:', e);
    }
  }

  static async createProduct(data: any) {
    const product = await Product.create(data);
    await this.invalidateCache();
    return product;
  }

  static async createBulkProducts(data: any) {
    if (!Array.isArray(data)) {
      throw { status: 400, message: 'Request body must be an array of products' };
    }
    const newProducts = await Product.insertMany(data);
    await this.invalidateCache();
    return { success: true, count: newProducts.length, data: newProducts };
  }

  static async updateProduct(id: string, data: any) {
    const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updatedProduct) throw { status: 404, message: 'Product not found' };
    await this.invalidateCache();
    return updatedProduct;
  }

  static async deleteProduct(id: string) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw { status: 404, message: 'Product not found' };
    await this.invalidateCache();
    return { message: 'Product deleted successfully' };
  }
}
