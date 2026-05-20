import express from 'express';
import auth from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';
import { getUsers, getProfile, updateProfile } from '../controllers/usersController';

const router = express.Router();

// GET /api/users (protected, admin only)
router.get('/', auth, authorizeRoles('admin'), getUsers);

// GET /api/users/me (protected)
router.get('/me', auth, getProfile);

// PUT /api/users/profile (protected)
router.put('/profile', auth, updateProfile);

export default router;
