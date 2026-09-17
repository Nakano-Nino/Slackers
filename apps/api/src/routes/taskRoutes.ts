import { Router } from 'express';
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
} from '../controllers/taskCommentController.js';
import {
  addQAStep,
  createTask,
  deleteQAStep,
  deleteTask,
  getProjectStats,
  getTaskById,
  getTasks,
  updateQAStep,
  updateTask,
} from '../controllers/taskController.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', optionalAuth, getTasks);
router.get('/stats', optionalAuth, getProjectStats);
router.get('/:id', optionalAuth, getTaskById);

// Task Creation: ONLY Admin and Manager can create tasks (Members cannot create tasks)
router.post('/', authenticate, requireRole(['admin', 'manager']), createTask);

// Task Update: Admin, Manager, and Members can update status; only Admin/Manager can reassign scope
router.patch('/:id', authenticate, requireRole(['admin', 'manager', 'member']), updateTask);

// Task Deletion: ONLY Admin and Manager
router.delete('/:id', authenticate, requireRole(['admin', 'manager']), deleteTask);

// QA Review Steps Endpoints
router.post('/:id/qa-steps', authenticate, addQAStep);
router.patch('/:id/qa-steps/:stepId', authenticate, updateQAStep);
router.delete('/:id/qa-steps/:stepId', authenticate, deleteQAStep);

// Task Comments Endpoints
router.get('/:taskId/comments', optionalAuth, getTaskComments);
router.post('/:taskId/comments', authenticate, createTaskComment);
router.delete('/:taskId/comments/:commentId', authenticate, deleteTaskComment);

export default router;
