'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { HealthStatus } from '../types';
import { CheckCircle2, XCircle, RefreshCw, Zap, Database } from 'lucide-react';

export function BackendStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'API offline');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      {/* Node.js API Connection Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs shadow-sm">
        {loading && !health ? (
          <RefreshCw className="w-3.5 h-3.5 text-neutral-400 animate-spin" />
        ) : health?.status === 'healthy' ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-medium">Node.js API Connected</span>
            <span className="text-neutral-500 text-[10px]">(:5001)</span>
          </>
        ) : (
          <>
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-rose-400 font-medium">API Disconnected</span>
            <button
              onClick={checkHealth}
              className="text-[11px] underline text-neutral-400 hover:text-neutral-200 ml-1"
            >
              Retry
            </button>
          </>
        )}
      </div>

      {/* Redis Pub/Sub & Cache Status Badge */}
      {health?.status === 'healthy' && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs shadow-sm transition-colors ${
            health.redis?.status === 'connected'
              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
              : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
          }`}
          title={
            health.redis?.status === 'connected'
              ? `Redis Connected: ${health.redis.keysCount ?? 0} keys, ${health.redis.memoryUsage ?? '0B'} used`
              : 'Redis unavailable - running on in-memory fallback'
          }
        >
          {health.redis?.status === 'connected' ? (
            <>
              <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400/30" />
              <span className="font-medium">Redis Active</span>
              {health.redis.latencyMs !== undefined && (
                <span className="text-[10px] text-emerald-400/70 font-mono">
                  {health.redis.latencyMs}ms
                </span>
              )}
            </>
          ) : (
            <>
              <Database className="w-3 h-3 text-amber-400" />
              <span className="font-medium">Memory Cache</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
