import express from 'express';
import {
  submitVote,
  getPollResults,
  getUserVotes
} from '../controllers/voteController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.post('/', authenticateToken, (req, res) => {
  submitVote(req, res, req.app.get('io'));
});
router.get('/results/:pollId', authenticateToken, getPollResults);
router.get('/user/my-votes', authenticateToken, getUserVotes);

export default router;