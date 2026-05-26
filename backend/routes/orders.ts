import express from 'express';
import { createOrder, getOrders, getOrderById, updateOrderStatus } from '../controllers/ordersController';
import protect from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';

const router = express.Router();

router.use(protect); // All order routes require authentication

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', authorizeRoles('admin'), updateOrderStatus);

export default router;
