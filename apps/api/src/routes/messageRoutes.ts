import { Router } from 'express';
import { createMessage, getMessagesByChannel } from '../controllers/messageController.js';

const router = Router();

router.get('/channel/:channelId', getMessagesByChannel);
router.post('/', createMessage);

export default router;
