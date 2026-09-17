import { Router } from 'express';
import {
  acceptInvitation,
  addMember,
  createInvitation,
  getInvitations,
  revokeInvitation,
  updateMemberRole,
  verifyInvitation,
} from '../controllers/memberController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Member management endpoints (Admin & Manager)
router.post('/', authenticate, requireRole(['admin', 'manager']), addMember);
router.patch('/:id/role', authenticate, requireRole(['admin', 'manager']), updateMemberRole);
router.post('/invite', authenticate, requireRole(['admin', 'manager']), createInvitation);
router.get('/invitations', authenticate, requireRole(['admin', 'manager']), getInvitations);
router.delete('/invitations/:id', authenticate, requireRole(['admin', 'manager']), revokeInvitation);

// Public invitation onboarding endpoints
router.get('/invitations/verify/:token', verifyInvitation);
router.post('/invitations/accept', acceptInvitation);

export default router;
