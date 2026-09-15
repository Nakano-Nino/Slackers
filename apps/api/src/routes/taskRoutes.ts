import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getProjectStats,
  getTaskById,
  getTasks,
  updateTask,
} from '../controllers/taskController.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', optionalAuth, getTasks);
router.get('/stats', optionalAuth, getProjectStats);
router.get('/:id', optionalAuth, getTaskById);
router.post('/', authenticate, requireRole(['admin', 'manager', 'member']), createTask);
router.patch('/:id', authenticate, requireRole(['admin', 'manager', 'member']), updateTask);
router.delete('/:id', authenticate, requireRole(['admin', 'manager']), deleteTask);

export default router;
