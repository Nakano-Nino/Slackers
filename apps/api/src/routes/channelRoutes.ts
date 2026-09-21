import { Router } from 'express';
import {
  createChannel,
  getChannelById,
  getChannelKey,
  getChannels,
  saveChannelKey,
} from '../controllers/channelController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getChannels);
router.get('/:id', authenticate, getChannelById);

// Channel E2EE Keys
router.post('/:channelId/keys', authenticate, saveChannelKey);
router.get('/:channelId/key', authenticate, getChannelKey);

// Channel Creation: ONLY Admin and Manager can create channels (Members cannot create channels)
router.post('/', authenticate, requireRole(['admin', 'manager']), createChannel);

export default router;
