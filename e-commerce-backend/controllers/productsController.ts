import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { catchAsync } from '../middleware/catchAsync';

export const getProducts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ProductService.getProducts(req.query);
        res.status(200).json(result);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
});

export const getCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ProductService.getCategories();
        res.status(200).json(result);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
});

export const getProductById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await ProductService.getProductById(req.params.id);
        res.status(200).json(product);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
});

export const createProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newProduct = await ProductService.createProduct(req.body);
        res.status(201).json(newProduct);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
});

export const createBulkProducts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ProductService.createBulkProducts(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
});

export const updateProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updatedProduct = await ProductService.updateProduct(req.params.id, req.body);
        res.status(200).json(updatedProduct);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
});

export const deleteProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ProductService.deleteProduct(req.params.id);
        res.status(200).json(result);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
});
