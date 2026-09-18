import { MongoClient, Db, Collection } from 'mongodb';
import { ActivityLog } from '../types/index.js';

class MongoLogger {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<ActivityLog> | null = null;
  private isConnected = false;
  private memoryFallbackLogs: ActivityLog[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/slackers_logs';
    try {
      this.client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000,
      });

      await this.client.connect();
      this.db = this.client.db('slackers_logs');
      this.collection = this.db.collection<ActivityLog>('activity_logs');
      this.isConnected = true;
      console.log('🍃 MongoDB Logger connected to slackers_logs/activity_logs');
    } catch {
      this.isConnected = false;
      console.log('ℹ️  MongoDB not reachable, activity logs falling back to in-memory/console logging.');
    }
  }

  async log(
    action: ActivityLog['action'],
    details: Record<string, unknown>,
    user?: { id?: string; name?: string },
    level: ActivityLog['level'] = 'info'
  ) {
    const entry: ActivityLog = {
      timestamp: new Date().toISOString(),
      level,
      action,
      userId: user?.id,
      userName: user?.name,
      details,
    };

    if (this.isConnected && this.collection) {
      try {
        await this.collection.insertOne(entry);
        return;
      } catch (err) {
        console.warn('Failed writing to MongoDB collection:', err);
      }
    }

    // Fallback in-memory circular buffer
    this.memoryFallbackLogs.unshift(entry);
    if (this.memoryFallbackLogs.length > 200) {
      this.memoryFallbackLogs.pop();
    }
  }

  async getRecentLogs(limit = 50): Promise<ActivityLog[]> {
    if (this.isConnected && this.collection) {
      try {
        return await this.collection
          .find({})
          .sort({ timestamp: -1 })
          .limit(limit)
          .toArray();
      } catch (err) {
        console.warn('Failed reading from MongoDB collection:', err);
      }
    }
    return this.memoryFallbackLogs.slice(0, limit);
  }

  isMongoConnected(): boolean {
    return this.isConnected;
  }

  async checkMongoHealth(): Promise<{
    status: 'connected' | 'disconnected';
    database?: string;
    documentsCount?: number;
    latencyMs?: number;
    error?: string;
  }> {
    if (!this.isConnected || !this.db) {
      await this.initialize();
    }
    if (this.isConnected && this.db) {
      try {
        const start = Date.now();
        await this.db.command({ ping: 1 });
        const latency = Date.now() - start;
        const count = this.collection ? await this.collection.countDocuments() : 0;
        return {
          status: 'connected',
          database: 'slackers_logs',
          documentsCount: count,
          latencyMs: latency,
        };
      } catch (err: unknown) {
        return {
          status: 'disconnected',
          error: err instanceof Error ? err.message : 'Ping failed',
        };
      }
    }
    return {
      status: 'disconnected',
      error: 'MongoDB client not connected',
    };
  }
}

export const mongoLogger = new MongoLogger();
