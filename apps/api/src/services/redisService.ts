import dotenv from 'dotenv';
dotenv.config();
import { Redis, RedisOptions } from 'ioredis';

export interface RedisHealth {
  status: 'connected' | 'disconnected' | 'disabled';
  latencyMs?: number;
  memoryUsage?: string;
  keysCount?: number;
}

class RedisService {
  private client: Redis | null = null;
  private isReady: boolean = false;
  private url: string | undefined;

  // In-memory fallback stores
  private memoryStore: Map<string, { value: string; expiresAt?: number }> = new Map();
  private memoryHashes: Map<string, Map<string, string>> = new Map();

  private hasLoggedWarning: boolean = false;

  constructor() {
    this.url = process.env.REDIS_URL;
    this.initClient();
  }

  private initClient() {
    if (!this.url) {
      console.log('ℹ️  REDIS_URL not configured. RedisService running in in-memory fallback mode.');
      return;
    }

    try {
      const options: RedisOptions = {
        maxRetriesPerRequest: 1,
        lazyConnect: false,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          if (times > 3) {
            // Stop retrying to avoid keeping the event loop alive and flooding logs
            return null;
          }
          return Math.min(times * 200, 1000);
        },
      };

      this.client = new Redis(this.url, options);

      this.client.on('connect', () => {
        // Socket opened
      });

      this.client.on('ready', () => {
        this.isReady = true;
        this.hasLoggedWarning = false;
        console.log(`⚡ Redis connected and ready at ${this.url}`);
      });

      this.client.on('error', (err) => {
        this.isReady = false;
        // Suppress repetitive noisy error logs if Redis drops or is unreachable
        if (!this.hasLoggedWarning) {
          console.warn(`⚠️  Redis warning: ${err.message}. Operating in memory fallback.`);
          this.hasLoggedWarning = true;
        }
      });

      this.client.on('close', () => {
        this.isReady = false;
      });
    } catch (err) {
      this.isReady = false;
      if (!this.hasLoggedWarning) {
        console.warn('⚠️  Could not initialize Redis client, using in-memory fallback:', (err as Error).message);
        this.hasLoggedWarning = true;
      }
    }
  }

  disconnect(): void {
    if (this.client) {
      try {
        this.client.disconnect();
      } catch {}
      this.client = null;
      this.isReady = false;
    }
  }

  public isAvailable(): boolean {
    return this.isReady && this.client !== null;
  }

  public getClient(): Redis | null {
    return this.client;
  }

  public createDuplicateClient(): Redis | null {
    if (!this.url) return null;
    try {
      return new Redis(this.url, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
    } catch (err) {
      console.warn('⚠️  Failed to create duplicate Redis client:', (err as Error).message);
      return null;
    }
  }

  // --- Key-Value Cache Operations ---

  async get(key: string): Promise<string | null> {
    if (this.isAvailable() && this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        console.warn(`Redis get("${key}") failed, reading from memory fallback`);
      }
    }

    // Memory fallback
    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isAvailable() && this.client) {
      try {
        if (ttlSeconds && ttlSeconds > 0) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
      } catch (err) {
        console.warn(`Redis set("${key}") failed, caching in memory fallback`);
      }
    }

    // Keep memory fallback updated
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryStore.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.isAvailable() && this.client) {
      try {
        await this.client.del(key);
      } catch (err) {
        console.warn(`Redis del("${key}") failed`);
      }
    }
    this.memoryStore.delete(key);
  }

  // --- Hash Operations (e.g., for Unread DM Counters) ---

  async hget(key: string, field: string): Promise<string | null> {
    if (this.isAvailable() && this.client) {
      try {
        return await this.client.hget(key, field);
      } catch (err) {
        console.warn(`Redis hget("${key}", "${field}") failed`);
      }
    }

    const hash = this.memoryHashes.get(key);
    return hash?.get(field) ?? null;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (this.isAvailable() && this.client) {
      try {
        return await this.client.hgetall(key);
      } catch (err) {
        console.warn(`Redis hgetall("${key}") failed`);
      }
    }

    const hash = this.memoryHashes.get(key);
    if (!hash) return {};
    const result: Record<string, string> = {};
    for (const [field, val] of hash.entries()) {
      result[field] = val;
    }
    return result;
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    if (this.isAvailable() && this.client) {
      try {
        await this.client.hset(key, field, value);
      } catch (err) {
        console.warn(`Redis hset("${key}", "${field}") failed`);
      }
    }

    let hash = this.memoryHashes.get(key);
    if (!hash) {
      hash = new Map();
      this.memoryHashes.set(key, hash);
    }
    hash.set(field, value);
  }

  async hincrby(key: string, field: string, amount: number = 1): Promise<number> {
    if (this.isAvailable() && this.client) {
      try {
        const newVal = await this.client.hincrby(key, field, amount);
        // Also sync memory store
        let hash = this.memoryHashes.get(key);
        if (!hash) {
          hash = new Map();
          this.memoryHashes.set(key, hash);
        }
        hash.set(field, newVal.toString());
        return newVal;
      } catch (err) {
        console.warn(`Redis hincrby("${key}", "${field}") failed`);
      }
    }

    let hash = this.memoryHashes.get(key);
    if (!hash) {
      hash = new Map();
      this.memoryHashes.set(key, hash);
    }
    const current = parseInt(hash.get(field) || '0', 10);
    const updated = current + amount;
    hash.set(field, updated.toString());
    return updated;
  }

  async hdel(key: string, field: string): Promise<void> {
    if (this.isAvailable() && this.client) {
      try {
        await this.client.hdel(key, field);
      } catch (err) {
        console.warn(`Redis hdel("${key}", "${field}") failed`);
      }
    }

    const hash = this.memoryHashes.get(key);
    if (hash) {
      hash.delete(field);
    }
  }

  // --- Health Check ---

  async checkHealth(): Promise<RedisHealth> {
    if (!this.url) {
      return { status: 'disabled' };
    }

    if (!this.client) {
      return { status: 'disconnected' };
    }

    if (this.client.status === 'connecting' || this.client.status === 'connect') {
      await new Promise<void>((resolve) => {
        this.client?.once('ready', () => resolve());
        this.client?.once('error', () => resolve());
        setTimeout(resolve, 2000);
      });
    }

    try {
      const start = Date.now();
      const pong = await this.client.ping();
      const latencyMs = Date.now() - start;

      if (pong !== 'PONG') {
        return { status: 'disconnected' };
      }

      let memoryUsage: string | undefined;
      let keysCount: number | undefined;

      try {
        const info = await this.client.info('memory');
        const match = info.match(/used_memory_human:([^\r\n]+)/);
        if (match) {
          memoryUsage = match[1].trim();
        }
        const dbSize = await this.client.dbsize();
        keysCount = dbSize;
      } catch {
        // info commands are best-effort
      }

      return {
        status: 'connected',
        latencyMs,
        memoryUsage,
        keysCount,
      };
    } catch {
      return { status: 'disconnected' };
    }
  }
}

export const redisService = new RedisService();
