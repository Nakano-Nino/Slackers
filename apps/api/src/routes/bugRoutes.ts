import { Router } from 'express';
import {
  convertBugToTask,
  createBug,
  deleteBug,
  getBugById,
  getBugs,
  getBugStats,
  updateBug,
} from '../controllers/bugController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getBugs);
router.get('/stats', authenticate, getBugStats);
router.get('/:id', authenticate, getBugById);
router.post('/', authenticate, createBug);
router.patch('/:id', authenticate, updateBug);
router.delete('/:id', authenticate, requireRole(['admin', 'manager']), deleteBug);
router.post('/:id/convert-to-task', authenticate, convertBugToTask);

export default router;
