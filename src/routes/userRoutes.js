import express from 'express';
import {
  createUser,
  loginUser,
  getUserProfile,
  getAllUsers
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', createUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', authenticateToken, getUserProfile);
router.get('/', authenticateToken, getAllUsers);

export default router;