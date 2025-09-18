import express from 'express';
import {
  createPoll,
  getAllPolls,
  getPollById,
  getUserPolls,
  updatePoll,
  deletePoll
} from '../controllers/pollController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllPolls);
router.get('/:pollId', authenticateToken, getPollById);

// Protected routes
router.post('/', authenticateToken, createPoll);
router.get('/user/my-polls', authenticateToken, getUserPolls);
router.put('/:pollId', authenticateToken, updatePoll);
router.delete('/:pollId', authenticateToken, deletePoll);

export default router;