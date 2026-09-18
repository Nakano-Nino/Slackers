import { Router, Request, Response } from 'express';
import { mongoLogger } from '../services/mongoLogger.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, requireRole(['admin']), async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const logs = await mongoLogger.getRecentLogs(limit);
  res.json({
    success: true,
    mongoConnected: mongoLogger.isMongoConnected(),
    data: logs,
    timestamp: new Date().toISOString(),
  });
});

export default router;
