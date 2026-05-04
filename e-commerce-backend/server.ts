import dotenv from 'dotenv';
dotenv.config();

const requiredEnv = ['JWT_SECRET', 'MONGO_URI'];
for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.error(`FATAL ERROR: ${env} is not defined in environment variables.`);
    process.exit(1);
  }
}

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectDB from './config/db';
import usersRoute from './routes/users';
import authRoute from './routes/auth';
import productsRoute from './routes/products';
import ordersRoute from './routes/orders';
import analyticsRoute from './routes/analytics';
import errorHandler from './utils/errorHandler';

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200', credentials: true }));
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB().catch((err) => console.error('DB connection error:', err));

// Base route
app.get('/', (req, res) => res.send('Server is running'));

// API routes
app.use('/api/users', usersRoute);
app.use('/api/auth', authRoute);
app.use('/api/products', productsRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/dashboard', analyticsRoute);

// Error handler
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
