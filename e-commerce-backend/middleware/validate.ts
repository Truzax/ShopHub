import { Request, Response, NextFunction } from 'express';

export const validateProduct = (req: Request, res: Response, next: NextFunction) => {
    const { name, price, category, stock } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) return res.status(400).json({ message: 'Valid name is required' });
    if (price === undefined || typeof price !== 'number' || price < 0) return res.status(400).json({ message: 'Valid price is required' });
    if (!category || typeof category !== 'string') return res.status(400).json({ message: 'Valid category is required' });
    if (stock === undefined || typeof stock !== 'number' || stock < 0) return res.status(400).json({ message: 'Valid stock is required' });
    
    next();
};

export const validateOrder = (req: Request, res: Response, next: NextFunction) => {
    const { products, total } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: 'Order must contain at least one product' });
    }
    
    for (const item of products) {
        if (!item.product || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
            return res.status(400).json({ message: 'Invalid product item format in order' });
        }
    }
    
    if (total === undefined || typeof total !== 'number' || total < 0) return res.status(400).json({ message: 'Valid total amount is required' });
    
    next();
};
