import { Router } from 'express';
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
} from '../controllers/taskCommentController.js';
import {
  addQAStep,
  addSubtask,
  createTask,
  deleteQAStep,
  deleteSubtask,
  deleteTask,
  getProjectStats,
  getTaskActivity,
  getTaskById,
  getTasks,
  updateQAStep,
  updateSubtask,
  updateTask,
} from '../controllers/taskController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getTasks);
router.get('/stats', authenticate, getProjectStats);
router.get('/:id', authenticate, getTaskById);
router.get('/:id/activity', authenticate, getTaskActivity);

// Task Creation: ONLY Admin and Manager can create tasks (Members cannot create tasks)
router.post('/', authenticate, requireRole(['admin', 'manager']), createTask);

// Task Update: Admin, Manager, and Members can update status; only Admin/Manager can reassign scope
router.patch('/:id', authenticate, requireRole(['admin', 'manager', 'member']), updateTask);

// Task Deletion: ONLY Admin and Manager
router.delete('/:id', authenticate, requireRole(['admin', 'manager']), deleteTask);

// Subtask & Checklist Endpoints
router.post('/:id/subtasks', authenticate, addSubtask);
router.patch('/:id/subtasks/:subtaskId', authenticate, updateSubtask);
router.delete('/:id/subtasks/:subtaskId', authenticate, deleteSubtask);

// QA Review Steps Endpoints
router.post('/:id/qa-steps', authenticate, addQAStep);
router.patch('/:id/qa-steps/:stepId', authenticate, updateQAStep);
router.delete('/:id/qa-steps/:stepId', authenticate, deleteQAStep);

// Task Comments Endpoints
router.get('/:taskId/comments', authenticate, getTaskComments);
router.post('/:taskId/comments', authenticate, createTaskComment);
router.delete('/:taskId/comments/:commentId', authenticate, deleteTaskComment);

export default router;
