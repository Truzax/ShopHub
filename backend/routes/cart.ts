import express from 'express';
import * as cartController from '../controllers/cartController';
import auth from '../middleware/auth';

const router = express.Router();

// All cart routes require authentication
router.use(auth);

router.get('/', cartController.getCart);
router.post('/', cartController.updateCart);
router.delete('/', cartController.clearCart);

export default router;
