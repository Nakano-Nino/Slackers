import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

let isConnected = false;

export async function connectPostgres(): Promise<boolean> {
  try {
    const start = Date.now();
    await prisma.$connect();
    const result: any = await prisma.$queryRaw`SELECT current_database();`;
    const latency = Date.now() - start;
    const dbName = result?.[0]?.current_database || 'slackers';
    isConnected = true;
    console.log(`🐘 PostgreSQL connected to database "${dbName}" (${latency}ms)`);
    return true;
  } catch (err: unknown) {
    isConnected = false;
    console.warn('⚠️  PostgreSQL connection failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

export async function checkPostgresHealth(): Promise<{
  status: 'connected' | 'disconnected';
  database?: string;
  latencyMs?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    const result: any = await prisma.$queryRaw`SELECT current_database();`;
    const latency = Date.now() - start;
    const dbName = result?.[0]?.current_database || 'slackers';
    isConnected = true;
    return {
      status: 'connected',
      database: dbName,
      latencyMs: latency,
    };
  } catch (err: unknown) {
    isConnected = false;
    return {
      status: 'disconnected',
      error: err instanceof Error ? err.message : 'Connection error',
    };
  }
}

export function isPostgresConnected(): boolean {
  return isConnected;
}
