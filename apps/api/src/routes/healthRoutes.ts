import { Router, Request, Response } from 'express';
import { dataStore } from '../services/dataStore.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'slackers-api',
    stats: {
      channelsCount: dataStore.getChannels().length,
      usersCount: dataStore.getUsers().length,
    },
  });
});

export default router;
