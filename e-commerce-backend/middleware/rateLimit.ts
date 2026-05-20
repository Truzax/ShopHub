import rateLimit from 'express-rate-limit';

const isTestOrDev = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestOrDev ? 1000 : 10, // Relax limits in test/dev
  message: 'Too many authentication attempts, please try again later.' as any
});

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestOrDev ? 10000 : 100, // Relax limits in test/dev
  message: 'Too many requests from this IP, please try again later.' as any
});
