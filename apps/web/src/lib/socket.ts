import { authStorage } from './api';

function getWsUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  let base =
    envUrl && envUrl.trim() !== ''
      ? envUrl
      : typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost:5001';

  let wsUrl = base.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://');
  wsUrl = wsUrl.replace(/\/+$/, '');
  if (!wsUrl.endsWith('/ws')) {
    wsUrl += '/ws';
  }
  return wsUrl;
}

type EventListener = (...args: any[]) => void;

export class PureWebSocket {
  public id: string = '';
  public connected: boolean = false;

  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private token: string | null = null;
  private reconnectTimer: any = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 20;
  private isExplicitlyClosed: boolean = false;

  constructor(token?: string) {
    if (token) {
      this.token = token;
    }
  }

  public connect(token?: string): this {
    if (token) {
      this.token = token;
    }
    if (!this.token) {
      this.token = authStorage.getToken();
    }
    if (!this.token) {
      return this;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return this;
    }

    this.isExplicitlyClosed = false;
    clearTimeout(this.reconnectTimer);

    const wsUrl = `${getWsUrl()}?token=${encodeURIComponent(this.token)}`;
    try {
      this.ws = new WebSocket(wsUrl);
    } catch (err) {
      console.warn('⚠️ WebSocket initialization failed:', err);
      this.scheduleReconnect();
      return this;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      // Note: connected is formally confirmed when server sends 'connect' event packet
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const text = typeof event.data === 'string' ? event.data : '';
        // Support newline-delimited or individual JSON frames
        const lines = text.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          const msg = JSON.parse(line);
          const eventName = msg.event || msg.action;
          const data = msg.data !== undefined ? msg.data : msg.payload;

          if (eventName === 'connect') {
            this.connected = true;
            if (data?.socketId) {
              this.id = data.socketId;
            }
            console.log('⚡ Pure WebSocket connected (ID:', this.id, ')');
          }

          this.trigger(eventName, data);
        }
      } catch (err) {
        console.warn('⚠️ Error parsing WebSocket frame:', err);
      }
    };

    this.ws.onerror = (err) => {
      this.trigger('connect_error', err);
    };

    this.ws.onclose = (event: CloseEvent) => {
      const wasConnected = this.connected;
      this.connected = false;
      this.trigger('disconnect', event.reason || `Code ${event.code}`);

      if (!this.isExplicitlyClosed && event.code !== 4001 && event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    return this;
  }

  private scheduleReconnect() {
    if (this.isExplicitlyClosed || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts - 1), 10000);
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        console.log(`🔄 Attempting WebSocket reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
      }
    }, delay);
  }

  public disconnect(): this {
    this.isExplicitlyClosed = true;
    clearTimeout(this.reconnectTimer);
    this.connected = false;
    if (this.ws) {
      this.ws.close(1000, 'Explicit client disconnect');
      this.ws = null;
    }
    return this;
  }

  public on(event: string, listener: EventListener): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return this;
  }

  public off(event: string, listener?: EventListener): this {
    if (!listener) {
      this.listeners.delete(event);
    } else {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    }
    return this;
  }

  public emit(event: string, data?: any): this {
    const payload = JSON.stringify({
      event,
      data,
    });

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      // If not yet open, wait briefly or drop transient events
      if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
        const checkAndSend = () => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(payload);
          }
        };
        setTimeout(checkAndSend, 200);
      }
    }
    return this;
  }

  private trigger(event: string, data: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(data);
        } catch (err) {
          console.error(`Error in listener for event "${event}":`, err);
        }
      });
    }
  }
}

// Re-export type Socket to provide drop-in compatibility across frontend
export type Socket = PureWebSocket;

let globalSocket: PureWebSocket | null = null;
let currentToken: string | null = null;
let isVisibilityListenerAttached = false;

function setupVisibilityHandler() {
  if (typeof document === 'undefined' || isVisibilityListenerAttached) return;
  isVisibilityListenerAttached = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const token = authStorage.getToken();
      if (token && globalSocket && !globalSocket.connected) {
        console.log('🔄 Tab visible: Reconnecting pure WebSocket...');
        globalSocket.connect();
      }
    }
  });
}

export function getSocket(): PureWebSocket | null {
  return globalSocket;
}

export function connectSocket(overrideToken?: string): PureWebSocket | null {
  const token = overrideToken || authStorage.getToken();
  if (!token) {
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
      currentToken = null;
    }
    return null;
  }

  if (globalSocket && globalSocket.connected && currentToken === token) {
    return globalSocket;
  }

  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }

  currentToken = token;
  setupVisibilityHandler();

  globalSocket = new PureWebSocket(token);
  globalSocket.connect();
  return globalSocket;
}

export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
    currentToken = null;
  }
}
