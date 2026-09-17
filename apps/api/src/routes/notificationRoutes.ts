import { Router } from 'express';
import {
  deleteNotification,
  getMuteTargets,
  getNotifications,
  markAllAsRead,
  markAsRead,
  muteTarget,
  unmuteTarget,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.get('/mutes', getMuteTargets);
router.post('/mute', muteTarget);
router.delete('/mute/:targetType/:targetId', unmuteTarget);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;

