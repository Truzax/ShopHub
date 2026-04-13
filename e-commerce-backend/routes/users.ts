import express from 'express';
import auth from '../middleware/auth';
import { getUsers, getProfile } from '../controllers/usersController';

const router = express.Router();

// GET /api/users (protected)
router.get('/', auth, getUsers);

// GET /api/users/me (protected)
router.get('/me', auth, getProfile);

export default router;
