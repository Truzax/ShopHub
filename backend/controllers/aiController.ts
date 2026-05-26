import { Request, Response, NextFunction } from 'express';
import { AiService } from '../services/aiService';
import Order from '../models/Order';
import Product from '../models/Product';
import AiConversation from '../models/AiConversation';
import AiCache from '../models/AiCache';
import { catchAsync } from '../middleware/catchAsync';

export const getSalesSummary = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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

    const orders = await Order.find({
        ...dateFilter,
        status: { $in: ['processing', 'shipped', 'delivered'] }
    }).populate('products.product', 'name category price').limit(500).lean();

    let ordersData = orders;
    if (category) {
        ordersData = orders.filter(order => 
            order.products.some((p: any) => p.product?.category === category)
        );
    }

    const categoryKey = category ? `_${category}` : '_all';
    const cacheKey = `v2_sales_summary_${startDate || 'all'}_${endDate || 'all'}${categoryKey}`;
    
    const latestOrder = await Order.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean();
    const latestOrderDate = latestOrder ? (latestOrder as any).updatedAt : new Date(0);

    const cached = await AiCache.findOne({ key: cacheKey });
    if (cached && cached.lastDataUpdate >= latestOrderDate) {
        return res.status(200).json({ success: true, summary: cached.data });
    }

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

    await AiCache.findOneAndUpdate(
        { key: cacheKey },
        { data: summary, lastDataUpdate: latestOrderDate },
        { upsert: true, new: true }
    );

    res.status(200).json({ success: true, summary });
});

export const getPerformanceInsights = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const products = await Product.find().select('name category price stock').lean();
    const recentOrders = await Order.find({ status: { $ne: 'cancelled' } })
        .sort({ date: -1 })
        .limit(100)
        .populate('products.product', 'name category')
        .lean();

    const cacheKey = 'performance_insights';
    
    const latestOrder = await Order.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean();
    const latestProduct = await Product.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean();
    
    const latestOrderDate = latestOrder ? (latestOrder as any).updatedAt : new Date(0);
    const latestProductDate = latestProduct ? (latestProduct as any).updatedAt : new Date(0);
    const currentLatestUpdate = latestOrderDate > latestProductDate ? latestOrderDate : latestProductDate;

    const cached = await AiCache.findOne({ key: cacheKey });
    if (cached && cached.lastDataUpdate >= currentLatestUpdate) {
        return res.status(200).json({ success: true, insights: cached.data });
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

    await AiCache.findOneAndUpdate(
        { key: cacheKey },
        { data: insights, lastDataUpdate: currentLatestUpdate },
        { upsert: true, new: true }
    );

    res.status(200).json({ success: true, insights });
});

export const generateProductDescription = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, category, features, tone, keywords } = req.body;
    
    if (!name || !category) {
        return res.status(400).json({ success: false, message: 'Name and Category are required' });
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
});

export const handleChat = catchAsync(async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    const { message } = req.body;
    const user = req.user;
    const userId = user.id;
    const role = user.role;

    if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
    }

    let conversation = await AiConversation.findOne({ userId });

    if (!conversation) {
        conversation = new AiConversation({
            userId: userId,
            messages: []
        });
    }

    conversation.messages.push({ role: 'user', content: message });

    let contextData: any = {};

    if (role === 'admin') {
        const lowStockProducts = await Product.find({ stock: { $lt: 10 } }).select('name stock category').lean();
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
        const products = await Product.find({ stock: { $gt: 0 } }).select('name price category description.short').limit(30).lean();
        
        contextData = {
            role: 'customer',
            storeProducts: products
        };
    }

    const aiResponse = await AiService.handleChat(conversation.messages, contextData, role);

    conversation.messages.push({ role: 'model', content: aiResponse });
    
    if (conversation.messages.length > 10) {
        conversation.messages = conversation.messages.slice(conversation.messages.length - 10);
    }

    await conversation.save();

    res.status(200).json({ success: true, response: aiResponse });
});
