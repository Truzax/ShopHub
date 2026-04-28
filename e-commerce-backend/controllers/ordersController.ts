import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';

export const createOrder = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const { products } = req.body;
        
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Validate products array
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'Order must contain at least one product' });
        }

        // Calculate total on the server
        let calculatedTotal = 0;
        const processedProducts = [];
        
        for (const item of products) {
            if (!item.product || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({ message: 'Invalid product item format' });
            }

            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Product with ID ${item.product} not found` });
            }

            calculatedTotal += product.price * item.quantity;
            processedProducts.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price
            });
        }

        const newOrder = await Order.create({
            user: req.user._id,
            products: processedProducts,
            total: calculatedTotal,
            status: 'pending'
        });

        res.status(201).json(newOrder);
    } catch (error) {
        next(error);
    }
};

export const getOrders = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const skip = (page - 1) * limit;

        const query = req.user.role === 'admin' ? {} : { user: req.user._id };
        
        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('products.product', 'name price category')
            .skip(skip)
            .limit(limit);
        
        const total = await Order.countDocuments(query);
            
        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

export const getOrderById = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
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

        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.status(200).json(order);
    } catch (error) {
        next(error);
    }
};

export const updateOrderStatus = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const { status } = req.body;
        
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const shouldDeductStock =
            !order.stockUpdated &&
            order.status === 'pending' &&
            status !== 'pending' &&
            status !== 'cancelled';

        if (shouldDeductStock) {
            for (const item of order.products) {
                const product = await Product.findById(item.product);

                if (!product) {
                    return res.status(404).json({ message: `Product with ID ${item.product} not found` });
                }

                if (product.stock < item.quantity) {
                    return res.status(400).json({
                        message: `Insufficient stock for product ${product.name}`
                    });
                }

                product.stock -= item.quantity;
                await product.save();
            }

            order.stockUpdated = true;
        }

        order.status = status;
        await order.save();

        res.status(200).json(order);
    } catch (error) {
        next(error);
    }
};
