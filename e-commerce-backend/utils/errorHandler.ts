import { Request, Response, NextFunction } from 'express';

export default (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  
  // Don't leak stack traces or internal DB schema errors to the client except in dev mode
  let message = err.message || 'Server Error';
  
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
      message = 'Internal Server Error';
  }

  res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
