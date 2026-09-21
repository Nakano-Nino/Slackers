import { Router } from 'express';
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  getProjectStats,
  updateProject,
} from '../controllers/projectController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getProjects);
router.get('/:id', authenticate, getProjectById);
router.get('/:id/stats', authenticate, getProjectStats);
router.post('/', authenticate, requireRole(['admin', 'manager']), createProject);
router.patch('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, requireRole(['admin']), deleteProject);

export default router;
