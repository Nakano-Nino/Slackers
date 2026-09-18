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

router.use(authenticate);

router.get('/channel/:channelId', getMessagesByChannel);
router.get('/thread/:parentId', getThreadReplies);
router.post('/', messagingRateLimiter, createMessage);
router.post('/:id/react', toggleReaction);
router.patch('/:id', editMessage);
router.delete('/:id', deleteMessage);

export default router;
