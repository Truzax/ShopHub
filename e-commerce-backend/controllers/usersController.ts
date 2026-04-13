import User from '../models/User';
import { Request, Response, NextFunction } from 'express';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    res.json(req.user);
  } catch (err) {
    next(err);
  }
};
