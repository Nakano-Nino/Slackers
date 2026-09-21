import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redisService.js';
import { AuthRequest } from './authMiddleware.js';

export interface RateLimiterOptions {
  windowMs: number; // e.g. 60_000 for 1 min
  max: number; // max requests per window
  prefix?: string;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

// In-memory fallback map: key -> list of millisecond timestamps
const memoryRateLimits = new Map<string, number[]>();

export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    max,
    prefix = 'rl',
    message = 'Too many requests, please slow down and try again later.',
    keyGenerator = (req: Request) => {
      const authReq = req as AuthRequest;
      if (authReq.user?.id) {
        return `user:${authReq.user.id}`;
      }
      return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    },
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = keyGenerator(req);
    const key = `ratelimit:${prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    const resetTimeSec = Math.ceil((now + windowMs) / 1000);

    let currentCount = 1;
    let usedRedis = false;

    if (redisService.isAvailable()) {
      const client = redisService.getClient();
      if (client) {
        try {
          const multi = client.multi();
          multi.zremrangebyscore(key, 0, windowStart);
          multi.zadd(key, now, `${now}-${Math.random().toString(36).substring(2, 8)}`);
          multi.zcard(key);
          multi.expire(key, Math.ceil(windowMs / 1000) + 2);
          const results = await multi.exec();

          if (results && results[2] && typeof results[2][1] === 'number') {
            currentCount = results[2][1] as number;
            usedRedis = true;
          }
        } catch (err) {
          // Redis call failed, proceed with memory fallback
          usedRedis = false;
        }
      }
    }

    if (!usedRedis) {
      // Memory fallback sliding window
      let timestamps = memoryRateLimits.get(key) || [];
      // Clean expired
      timestamps = timestamps.filter((ts) => ts > windowStart);
      timestamps.push(now);
      memoryRateLimits.set(key, timestamps);
      currentCount = timestamps.length;

      // Periodic garbage collection for memory map
      if (memoryRateLimits.size > 2000) {
        for (const [k, tsList] of memoryRateLimits.entries()) {
          if (tsList.length === 0 || tsList[tsList.length - 1] < windowStart) {
            memoryRateLimits.delete(k);
          }
        }
      }
    }

    const remaining = Math.max(0, max - currentCount);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTimeSec);

    if (currentCount > max) {
      const retryAfterSec = Math.ceil(windowMs / 1000);
      res.setHeader('Retry-After', retryAfterSec);

      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: retryAfterSec,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

// 10 requests per 60s on auth endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  prefix: 'auth',
  message: 'Too many authentication attempts. Please try again in 1 minute.',
});

// 30 requests per 10s on messaging endpoints
export const messagingRateLimiter = createRateLimiter({
  windowMs: 10 * 1000,
  max: 30,
  prefix: 'messaging',
  message: 'Message send limit exceeded. Please wait a few seconds before sending more.',
});

// 60 requests per 60s for public webhook ingestion endpoints
export const webhookIngestRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  prefix: 'webhook-ingest',
  message: 'Webhook ingestion rate limit exceeded. Please throttle webhook dispatch.',
  keyGenerator: (req: Request) => {
    const token = req.params?.token || 'unknown';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `token:${token}:ip:${ip}`;
  },
});

