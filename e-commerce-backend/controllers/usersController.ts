import User from '../models/User';
import { Request, Response, NextFunction } from 'express';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password -refreshTokens -resetPasswordToken')
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments();

    res.json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users
    });
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

export const updateProfile = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const { name, phone, address } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    // Remove sensitive data before returning
    const updatedUser = user.toObject();
    delete updatedUser.password;
    delete updatedUser.refreshTokens;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
};
