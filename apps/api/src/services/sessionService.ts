import { redisService } from './redisService.js';
import { mongoLogger } from './mongoLogger.js';

export interface UserSession {
  id: string;
  userId: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
}

export function parseDeviceName(userAgent: string): string {
  if (!userAgent || userAgent === 'unknown') return 'Unknown Device';

  let browser = 'Browser';
  if (userAgent.includes('Edg/')) browser = 'Microsoft Edge';
  else if (userAgent.includes('Chrome/')) browser = 'Chrome';
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Safari';
  else if (userAgent.includes('Firefox/')) browser = 'Firefox';
  else if (userAgent.includes('PostmanRuntime')) browser = 'Postman';
  else if (userAgent.includes('curl/')) browser = 'CLI / cURL';

  let os = 'Unknown OS';
  if (userAgent.includes('iPhone')) os = 'iOS';
  else if (userAgent.includes('iPad')) os = 'iPadOS';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

class SessionService {
  // In-memory fallback map: sessionId -> UserSession
  private memorySessions: Map<string, UserSession> = new Map();
  // userSessions: userId -> Set of sessionIds
  private userSessionIndex: Map<string, Set<string>> = new Map();

  // Throttled touch tracker to avoid spamming writes
  private lastTouched: Map<string, number> = new Map();

  async createSession(
    userId: string,
    userAgent: string = 'unknown',
    ipAddress: string = '127.0.0.1'
  ): Promise<UserSession> {
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const deviceName = parseDeviceName(userAgent);

    const session: UserSession = {
      id: sessionId,
      userId,
      deviceName,
      ipAddress: ipAddress.replace('::ffff:', ''),
      userAgent,
      createdAt: now,
      lastActiveAt: now,
    };

    // Save in memory
    this.memorySessions.set(sessionId, session);
    let userSet = this.userSessionIndex.get(userId);
    if (!userSet) {
      userSet = new Set();
      this.userSessionIndex.set(userId, userSet);
    }
    userSet.add(sessionId);

    // Save in Redis (7 days = 604800s)
    await redisService.set(`sess:${sessionId}`, JSON.stringify(session), 7 * 24 * 3600);

    // Also maintain a Redis hash or set of session IDs for the user
    await redisService.hset(`user_sessions:${userId}`, sessionId, now);

    await mongoLogger.log('SESSION_CREATED', {
      sessionId,
      userId,
      deviceName,
      ipAddress: session.ipAddress,
    });

    return session;
  }

  async isSessionValid(userId: string, sessionId?: string): Promise<boolean> {
    // A valid session must provide a sessionId
    if (!sessionId) return false;

    // 1. Check Redis cache first
    const cached = await redisService.get(`sess:${sessionId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as UserSession;
        return parsed.userId === userId;
      } catch {
        // If unparseable, fall through to memory check
      }
    }

    // 2. Check memory store
    const session = this.memorySessions.get(sessionId);
    if (session && session.userId === userId) {
      return true;
    }

    return false;
  }

  async touchSession(sessionId: string): Promise<void> {
    const now = Date.now();
    const last = this.lastTouched.get(sessionId) || 0;
    // Throttle touch to once every 2 minutes
    if (now - last < 2 * 60 * 1000) return;
    this.lastTouched.set(sessionId, now);

    const iso = new Date().toISOString();
    const memSession = this.memorySessions.get(sessionId);
    if (memSession) {
      memSession.lastActiveAt = iso;
    }

    // Update in Redis
    const cached = await redisService.get(`sess:${sessionId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as UserSession;
        parsed.lastActiveAt = iso;
        await redisService.set(`sess:${sessionId}`, JSON.stringify(parsed), 7 * 24 * 3600);
      } catch {
        // Ignore parse error
      }
    }
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    const sessions: UserSession[] = [];

    // 1. Query Redis user sessions
    const redisMap = await redisService.hgetall(`user_sessions:${userId}`);
    const sessionIds = new Set<string>([
      ...Object.keys(redisMap),
      ...(this.userSessionIndex.get(userId) || []),
    ]);

    for (const sid of sessionIds) {
      let session: UserSession | null = null;
      const cached = await redisService.get(`sess:${sid}`);
      if (cached) {
        try {
          session = JSON.parse(cached);
        } catch {
          // ignore
        }
      }

      if (!session) {
        session = this.memorySessions.get(sid) || null;
      }

      if (session && session.userId === userId) {
        sessions.push(session);
      }
    }

    // Sort newest to oldest
    return sessions.sort(
      (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
    );
  }

  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    // 1. Validate session ownership in memory if present
    const memSession = this.memorySessions.get(sessionId);
    if (memSession && memSession.userId !== userId) {
      return false;
    }

    // 2. Validate session ownership in Redis if present
    const cached = await redisService.get(`sess:${sessionId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as UserSession;
        if (parsed.userId !== userId) {
          return false;
        }
      } catch {}
    }

    // If session does not exist anywhere, return false
    if (!memSession && !cached) {
      return false;
    }

    this.memorySessions.delete(sessionId);
    const userSet = this.userSessionIndex.get(userId);
    if (userSet) {
      userSet.delete(sessionId);
    }

    await redisService.del(`sess:${sessionId}`);
    await redisService.hdel(`user_sessions:${userId}`, sessionId);

    await mongoLogger.log('SESSION_REVOKED', {
      sessionId,
      userId,
    });

    return true;
  }

  async revokeOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    const allSessions = await this.getUserSessions(userId);
    let revokedCount = 0;

    for (const session of allSessions) {
      if (session.id !== currentSessionId) {
        await this.revokeSession(userId, session.id);
        revokedCount++;
      }
    }

    await mongoLogger.log('OTHER_SESSIONS_REVOKED', {
      currentSessionId,
      userId,
      revokedCount,
    });

    return revokedCount;
  }
}

export const sessionService = new SessionService();
