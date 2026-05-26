import express from 'express';
import { getSalesSummary, getPerformanceInsights, generateProductDescription, handleChat } from '../controllers/aiController';
import protect from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';

const router = express.Router();

const admin = authorizeRoles('admin');

// Admin only routes for dashboard analytics and product management
router.get('/sales-summary', protect, admin, getSalesSummary);
router.get('/insights', protect, admin, getPerformanceInsights);
router.post('/generate-description', protect, admin, generateProductDescription);

// Protected route for AI Chat Assistant (Role-based logic handled in controller)
router.post('/chat', protect, handleChat);

export default router;
