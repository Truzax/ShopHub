import { Request, Response } from 'express';
import Order from '../models/Order';

export const createOrder = async (req: Request & { user?: any }, res: Response) => {
    try {
        const { products, total } = req.body;
        
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const newOrder = await Order.create({
            user: req.user._id,
            products,
            total,
            status: 'pending'
        });

        res.status(201).json(newOrder);
    } catch (error) {
        res.status(400).json({ message: 'Error creating order', error });
    }
};

export const getOrders = async (req: Request & { user?: any }, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // If admin, they can see all orders. If user, only their own.
        const query = req.user.role === 'admin' ? {} : { user: req.user._id };
        
        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('products.product', 'name price category');
            
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};

export const getOrderById = async (req: Request & { user?: any }, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('products.product', 'name price category');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if order belongs to user or user is admin
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order details', error });
    }
};

export const updateOrderStatus = async (req: Request & { user?: any }, res: Response) => {
    try {
        const { status } = req.body;
        
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error updating order', error });
    }
};
