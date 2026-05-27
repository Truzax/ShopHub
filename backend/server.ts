import { env } from './config/env';
import { logger } from './utils/logger';
import pinoHttp from 'pino-http';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import connectDB from './config/db';
import usersRoute from './routes/users';
import authRoute from './routes/auth';
import productsRoute from './routes/products';
import ordersRoute from './routes/orders';
import analyticsRoute from './routes/analytics';
import cartRoute from './routes/cart';
import aiRoute from './routes/ai';
import errorHandler from './utils/errorHandler';
import { globalLimiter } from './middleware/rateLimit';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10kb' }));
const allowedOrigins = env.FRONTEND_ORIGIN;
app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  }, 
  credentials: true 
}));
app.use(cookieParser());
app.use(pinoHttp({ logger }));

const PORT = env.PORT || 3000;

// Connect to MongoDB
connectDB().catch((err) => logger.error({ err }, 'DB connection error'));

// Base route
app.get('/', (req, res) => res.send('Server is running'));

// API routes
app.use('/api', globalLimiter);
app.use('/api/users', usersRoute);
app.use('/api/auth', authRoute);
app.use('/api/products', productsRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/dashboard', analyticsRoute);
app.use('/api/cart', cartRoute);
app.use('/api/ai', aiRoute);

// Error handler
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  logger.info(`Server is running on port: ${PORT}`);
});
