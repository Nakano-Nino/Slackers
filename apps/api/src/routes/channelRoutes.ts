import { Router } from 'express';
import { createChannel, getChannelById, getChannels } from '../controllers/channelController.js';

const router = Router();

router.get('/', getChannels);
router.get('/:id', getChannelById);
router.post('/', createChannel);

export default router;
