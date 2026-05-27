import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export default (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = { statusCode: 404, message };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { statusCode: 400, message };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = { statusCode: 400, message };
  }

  const statusCode = error.statusCode || 500;
  
  let message = error.message || 'Server Error';
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
      message = 'Internal Server Error';
  }

  res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
