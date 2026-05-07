import { Request, Response, NextFunction } from 'express';
import Cart from '../models/Cart';

interface AuthenticatedRequest extends Request {
    user?: any;
}

export const getCart = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        let cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }

        res.status(200).json({
            success: true,
            data: cart,
        });
    } catch (error) {
        next(error);
    }
};

export const updateCart = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        const { items } = req.body;

        let cart = await Cart.findOne({ user: userId });

        if (cart) {
            cart.items = items;
            await cart.save();
        } else {
            cart = await Cart.create({ user: userId, items });
        }

        // Return populated cart
        const updatedCart = await Cart.findById(cart._id).populate('items.product');

        res.status(200).json({
            success: true,
            data: updatedCart,
        });
    } catch (error) {
        next(error);
    }
};

export const clearCart = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        await Cart.findOneAndUpdate({ user: userId }, { items: [] });

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
        });
    } catch (error) {
        next(error);
    }
};
