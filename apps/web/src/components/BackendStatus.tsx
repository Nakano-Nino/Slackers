'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { HealthStatus } from '../types';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

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
  );
}
