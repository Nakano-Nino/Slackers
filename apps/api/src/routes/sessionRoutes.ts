import { Router } from 'express';
import {
  getSessions,
  revokeOtherSessions,
  revokeSession,
} from '../controllers/sessionController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getSessions);
router.post('/revoke-others', revokeOtherSessions);
router.delete('/:sessionId', revokeSession);

export default router;
