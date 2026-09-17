import { Router } from 'express';
import { getMe, login, register, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authRateLimiter, login);
router.post('/register', register);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

export default router;
