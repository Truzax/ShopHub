import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cartService';
import { catchAsync } from '../middleware/catchAsync';

interface AuthenticatedRequest extends Request {
    user?: any;
}

export const getCart = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const cart = await CartService.getCart(req.user._id);
        res.status(200).json({ success: true, data: cart });
    } catch (error: any) {
        next(error);
    }
});

export const updateCart = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const updatedCart = await CartService.updateCart(req.user._id, req.body.items);
        res.status(200).json({ success: true, data: updatedCart });
    } catch (error: any) {
        next(error);
    }
});

export const clearCart = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const result = await CartService.clearCart(req.user._id);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        next(error);
    }
});
