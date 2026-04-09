require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const usersRoute = require('./routes/users');
const authRoute = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200', credentials: true }));
app.use(cookieParser());

const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB().catch(err => console.error('DB connection error:', err));

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
