const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUsers, getProfile } = require('../controllers/usersController');

// GET /api/users
router.get('/', getUsers);

// GET /api/users/me (protected)
router.get('/me', auth, getProfile);

module.exports = router;
