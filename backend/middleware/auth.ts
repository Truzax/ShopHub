import jwt from 'jsonwebtoken';
import User from '../models/User';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export default async function (req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.accessToken;

  if (!token) {
    const authHeader = req.headers.authorization as string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = await User.findById(payload.id).select('-password');
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}
