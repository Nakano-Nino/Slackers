import { Router, Request, Response } from 'express';
import { dataStore } from '../services/dataStore.js';
import { redisService } from '../services/redisService.js';
import { s3Service } from '../services/s3Service.js';
import { checkPostgresHealth } from '../services/db.js';
import { mongoLogger } from '../services/mongoLogger.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const [redisHealth, s3Health, postgresHealth, mongoHealth] = await Promise.all([
    redisService.checkHealth(),
    s3Service.checkHealth(),
    checkPostgresHealth(),
    mongoLogger.checkMongoHealth(),
  ]);

  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'slackers-api',
    database: {
      postgres: postgresHealth,
      mongodb: mongoHealth,
    },
    stats: {
      channelsCount: dataStore.getChannels().length,
      usersCount: dataStore.getUsers().length,
    },
    redis: redisHealth,
    storage: s3Health,
  });
});

export default router;
