import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getSprintStats,
  getTaskById,
  getTasks,
  updateTask,
} from '../controllers/taskController.js';

const router = Router();

router.get('/', getTasks);
router.get('/sprint/stats', getSprintStats);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
