import { Router } from 'express';
import { downloadEncryptedFile, uploadEncryptedFile } from '../controllers/fileController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { messagingRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.post('/upload', messagingRateLimiter, uploadEncryptedFile);
router.get('/:fileId', downloadEncryptedFile);

export default router;
