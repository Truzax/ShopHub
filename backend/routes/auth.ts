import express from 'express';
import { signup, login, refresh, logout, forgotPassword, resetPassword, validateReset } from '../controllers/authController';
import { authLimiter } from '../middleware/rateLimit';

const router = express.Router();

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/validate-reset', authLimiter, validateReset);

export default router;
