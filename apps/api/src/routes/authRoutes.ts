import { Router } from 'express';
import { getMe, login, register, updateProfile, uploadAvatar, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authRateLimiter, login);
router.post('/register', authRateLimiter, register);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/avatar', authenticate, uploadAvatar);

export default router;
