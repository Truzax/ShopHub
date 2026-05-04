import { Router } from 'express';
import { getDashboardData } from '../controllers/analyticsController';
import auth from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';

const router = Router();

/**
 * GET /api/dashboard
 * Requires: Admin authentication
 * Query Parameters:
 *   - startDate: ISO date string
 *   - endDate: ISO date string
 *   - category (optional): Filter by product category
 */
router.get('/', auth, authorizeRoles('admin'), getDashboardData);

export default router;
