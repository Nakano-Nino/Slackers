import { Router } from 'express';
import {
  createMessage,
  getMessagesByChannel,
  getThreadReplies,
  toggleReaction,
  editMessage,
  deleteMessage,
} from '../controllers/messageController.js';
import { messagingRateLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/channel/:channelId', getMessagesByChannel);
router.get('/thread/:parentId', getThreadReplies);
router.post('/', messagingRateLimiter, createMessage);
router.post('/:id/react', authenticate, toggleReaction);
router.patch('/:id', authenticate, editMessage);
router.delete('/:id', authenticate, deleteMessage);

export default router;
