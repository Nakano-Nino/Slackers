import { Router } from 'express';
import { getMe, login, register } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, getMe);

export default router;
