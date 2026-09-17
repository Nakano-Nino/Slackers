import { Router } from 'express';
import {
  getConversation,
  getKeyVault,
  getPublicKey,
  getRecentConversations,
  getUnreadCounts,
  markAsRead,
  sendDirectMessage,
  setKeyVault,
  setPublicKey,
  toggleDmReaction,
  editDirectMessage,
  deleteDirectMessage,
} from '../controllers/dmController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { messagingRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.get('/unread-counts', getUnreadCounts);
router.get('/conversations', getRecentConversations);
router.post('/public-key', setPublicKey);
router.get('/public-key/:userId', getPublicKey);
router.post('/key-vault', setKeyVault);
router.get('/key-vault', getKeyVault);
router.patch('/:partnerId/read', markAsRead);
router.get('/:partnerId', getConversation);
router.post('/', messagingRateLimiter, sendDirectMessage);
router.post('/:id/react', toggleDmReaction);
router.patch('/:id', editDirectMessage);
router.delete('/:id', deleteDirectMessage);

export default router;
