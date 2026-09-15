import { Router } from 'express';
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  getProjectStats,
  updateProject,
} from '../controllers/projectController.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', optionalAuth, getProjects);
router.get('/:id', optionalAuth, getProjectById);
router.get('/:id/stats', optionalAuth, getProjectStats);
router.post('/', authenticate, requireRole(['admin', 'manager']), createProject);
router.patch('/:id', authenticate, requireRole(['admin', 'manager']), updateProject);
router.delete('/:id', authenticate, requireRole(['admin']), deleteProject);

export default router;
