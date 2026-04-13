import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectDB from './config/db';
import usersRoute from './routes/users';
import authRoute from './routes/auth';
import errorHandler from './middleware/errorHandler';

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200', credentials: true }));
app.use(cookieParser());

const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB().catch((err) => console.error('DB connection error:', err));

// Base route
app.get('/', (req, res) => res.send('Server is running'));

// API routes
app.use('/api/users', usersRoute);
app.use('/api/auth', authRoute);

// Error handler
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
