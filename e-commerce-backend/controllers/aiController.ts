import { Request, Response } from 'express';
import { AiService } from '../services/aiService';
import Order from '../models/Order';
import Product from '../models/Product';
import AiConversation from '../models/AiConversation';
import AiCache from '../models/AiCache';

export const getSalesSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, category } = req.query;

        let dateFilter: any = {};
        if (startDate && endDate) {
            dateFilter = {
                date: {
                    $gte: new Date(startDate as string),
                    $lte: new Date(endDate as string)
                }
            };
        }

        // Fetch recent orders, ignoring pending/cancelled to be accurate for revenue
        const orders = await Order.find({
            ...dateFilter,
            status: { $in: ['processing', 'shipped', 'delivered'] }
        }).populate('products.product', 'name category price').limit(500).lean();

        let ordersData = orders;
        if (category) {
            // Further filter orders if category is specified
            ordersData = orders.filter(order => 
                order.products.some((p: any) => p.product?.category === category)
            );
        }

        // Caching Logic
        const categoryKey = category ? `_${category}` : '_all';
        const cacheKey = `v2_sales_summary_${startDate || 'all'}_${endDate || 'all'}${categoryKey}`;
        
        // Find latest order update to validate cache
        const latestOrder = await Order.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean();
        const latestOrderDate = latestOrder ? (latestOrder as any).updatedAt : new Date(0);

        const cached = await AiCache.findOne({ key: cacheKey });
        if (cached && cached.lastDataUpdate >= latestOrderDate) {
            res.status(200).json({ success: true, summary: cached.data });
            return;
        }

        // Simplify data sent to AI to save tokens
        const simplifiedOrders = ordersData.map(o => ({
            total: o.total,
            date: o.date,
            items: o.products.map((p: any) => ({
                name: p.product?.name,
                category: p.product?.category,
                qty: p.quantity,
                price: p.price
            }))
        }));

        const summary = await AiService.generateSalesSummary(simplifiedOrders);

        // Save to cache
        await AiCache.findOneAndUpdate(
            { key: cacheKey },
            { data: summary, lastDataUpdate: latestOrderDate },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, summary });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const getPerformanceInsights = async (req: Request, res: Response): Promise<void> => {
    try {
        // Fetch top products and recent orders for insights
        const products = await Product.find().select('name category price stock').lean();
        const recentOrders = await Order.find({ status: { $ne: 'cancelled' } })
            .sort({ date: -1 })
            .limit(100)
            .populate('products.product', 'name category')
            .lean();

        const cacheKey = 'performance_insights';
        
        // Find latest updates to validate cache
        const latestOrder = await Order.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean();
        const latestProduct = await Product.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean();
        
        const latestOrderDate = latestOrder ? (latestOrder as any).updatedAt : new Date(0);
        const latestProductDate = latestProduct ? (latestProduct as any).updatedAt : new Date(0);
        const currentLatestUpdate = latestOrderDate > latestProductDate ? latestOrderDate : latestProductDate;

        const cached = await AiCache.findOne({ key: cacheKey });
        if (cached && cached.lastDataUpdate >= currentLatestUpdate) {
            res.status(200).json({ success: true, insights: cached.data });
            return;
        }

        const simplifiedProducts = products.map(p => ({
            id: p._id,
            name: p.name,
            category: p.category,
            stock: p.stock
        }));

        const simplifiedOrders = recentOrders.map(o => ({
            date: o.date,
            items: o.products.map((p: any) => ({
                name: p.product?.name,
                qty: p.quantity
            }))
        }));

        const insights = await AiService.generatePerformanceInsights(simplifiedProducts, simplifiedOrders);

        // Save to cache
        await AiCache.findOneAndUpdate(
            { key: cacheKey },
            { data: insights, lastDataUpdate: currentLatestUpdate },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, insights });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const generateProductDescription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, category, features, tone, keywords } = req.body;
        
        if (!name || !category) {
            res.status(400).json({ success: false, message: 'Name and Category are required' });
            return;
        }

        const inputs = {
            name,
            category,
            features: features || 'General features',
            tone: tone || 'professional',
            keywords: keywords || ''
        };

        const generatedData = await AiService.generateProductDescription(inputs);
        res.status(200).json({ success: true, generatedData });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const handleChat = async (req: Request, res: Response): Promise<void> => {
    try {
        const { message } = req.body;
        const user = (req as any).user;
        const userId = user.id;
        const role = user.role; // 'admin' or 'customer'

        if (!message) {
            res.status(400).json({ success: false, message: 'Message is required' });
            return;
        }

        // Find or create conversation for the logged-in user
        let conversation = await AiConversation.findOne({ userId });

        if (!conversation) {
            conversation = new AiConversation({
                userId: userId,
                messages: []
            });
        }

        // Add user message to history
        conversation.messages.push({ role: 'user', content: message });

        let contextData: any = {};

        if (role === 'admin') {
            // Admin Context: Business performance, stock, orders
            const lowStockProducts = await Product.find({ stock: { $lt: 10 } }).select('name stock category').lean();
            
            // Get recent orders for revenue/sales insights
            const recentOrders = await Order.find({ status: { $ne: 'cancelled' } })
                .sort({ date: -1 })
                .limit(50)
                .select('total status date')
                .lean();

            contextData = {
                role: 'admin',
                lowStockProducts,
                recentOrders
            };
        } else {
            // Customer Context: Product recommendations, shopping assistant
            const products = await Product.find({ stock: { $gt: 0 } }).select('name price category description.short').limit(30).lean();
            
            contextData = {
                role: 'customer',
                storeProducts: products
            };
        }

        // Call AI Service passing the role along with context
        const aiResponse = await AiService.handleChat(conversation.messages, contextData, role);

        // Add AI response to history
        conversation.messages.push({ role: 'model', content: aiResponse });
        
        // Keep only last 10 messages to avoid token bloat
        if (conversation.messages.length > 10) {
            conversation.messages = conversation.messages.slice(conversation.messages.length - 10);
        }

        await conversation.save();

        res.status(200).json({ success: true, response: aiResponse });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
