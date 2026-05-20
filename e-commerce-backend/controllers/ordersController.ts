import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { catchAsync } from '../middleware/catchAsync';

export const createOrder = catchAsync(async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const newOrder = await OrderService.createOrder(req.user, req.body.products);
        res.status(201).json(newOrder);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
});

export const getOrders = catchAsync(async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const result = await OrderService.getOrders(req.user, req.query);
        res.status(200).json(result);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
});

export const getOrderById = catchAsync(async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const order = await OrderService.getOrderById(req.user, req.params.id);
        res.status(200).json(order);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
});

export const updateOrderStatus = catchAsync(async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const order = await OrderService.updateOrderStatus(req.params.id, req.body.status);
        res.status(200).json(order);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
});
