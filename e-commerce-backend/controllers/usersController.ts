import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { catchAsync } from '../middleware/catchAsync';

export const getUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await UserService.getUsers(req.query);
        res.status(200).json(result);
    } catch (error: any) {
        next(error);
    }
});

export const getProfile = catchAsync(async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const result = await UserService.getProfile(req.user);
        res.json(result);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
});

export const updateProfile = catchAsync(async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const result = await UserService.updateProfile(req.user, req.body);
        res.status(200).json(result);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
});
