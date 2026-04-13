import jwt from 'jsonwebtoken';
import User from '../models/User';
import { Request, Response, NextFunction } from 'express';

export default async function (req: Request & { user?: any }, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || '92850b16436cf9ef6648c30d9f3855e5f49efb11134a51625428067e105c90083f9828c9ab6f01ee65dc5a4af99cde013f81f73148dbc6156d1cc68471c58d68') as any;
    req.user = await User.findById(payload.id).select('-password');
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}
