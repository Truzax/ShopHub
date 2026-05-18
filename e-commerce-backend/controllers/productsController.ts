import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import { catchAsync } from '../middleware/catchAsync';

export const getProducts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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
});

export const getCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const categories = await Product.distinct('category');
        res.status(200).json({
            success: true,
            data: categories
        });
});

export const getProductById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
});

export const createProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const newProduct = await Product.create(req.body);
        res.status(201).json(newProduct);
});

export const createBulkProducts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        if (!Array.isArray(req.body)) {
            return res.status(400).json({ message: 'Request body must be an array of products' });
        }
        const newProducts = await Product.insertMany(req.body);
        res.status(201).json({ success: true, count: newProducts.length, data: newProducts });
});

export const updateProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(updatedProduct);
});

export const deleteProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
});
