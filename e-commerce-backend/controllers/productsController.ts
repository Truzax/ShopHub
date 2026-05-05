import { Request, Response } from 'express';
import Product from '../models/Product';

export const getProducts = async (req: Request, res: Response) => {
    try {
        if (req.query.ids) {
            const ids = (req.query.ids as string).split(',');
            const products = await Product.find({ _id: { $in: ids } });
            return res.status(200).json({
                success: true,
                count: products.length,
                data: products
            });
        }

        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const skip = (page - 1) * limit;

        const products = await Product.find({})
            .skip(skip)
            .limit(limit);
            
        const total = await Product.countDocuments({});

        res.status(200).json({
            success: true,
            count: products.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: products
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await Product.distinct('category');
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const newProduct = await Product.create(req.body);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: 'Error creating product', error });
    }
};

export const createBulkProducts = async (req: Request, res: Response) => {
    try {
        if (!Array.isArray(req.body)) {
            return res.status(400).json({ message: 'Request body must be an array of products' });
        }
        const newProducts = await Product.insertMany(req.body);
        res.status(201).json({ success: true, count: newProducts.length, data: newProducts });
    } catch (error) {
        res.status(400).json({ message: 'Error creating products in bulk', error });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: 'Error updating product', error });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
};
