import { io, Socket } from 'socket.io-client';
import { authStorage } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:5001';

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(): Socket | null {
  return socket;
}

let isVisibilityListenerAttached = false;

function setupVisibilityHandler() {
  if (typeof document === 'undefined' || isVisibilityListenerAttached) return;
  isVisibilityListenerAttached = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const token = authStorage.getToken();
      if (token && socket && !socket.connected) {
        console.log('🔄 Tab visible: Reconnecting WebSocket...');
        socket.connect();
      }
    }
  });
}

export function connectSocket(overrideToken?: string): Socket | null {
  const token = overrideToken || authStorage.getToken();
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
      currentToken = null;
    }
    return null;
  }

  // If already connected with the same token, return existing socket
  if (socket && socket.connected && currentToken === token) {
    return socket;
  }

  // If token changed or socket exists, disconnect old instance
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;
  setupVisibilityHandler();

  socket = io(API_URL, {
    auth: { token },
    transports: ['polling', 'websocket'], // Start with HTTP polling handshake for stability, upgrade to WebSocket
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('⚡ Real-time WebSocket connected (ID:', socket?.id, ')');
  });

  socket.on('connect_error', (err) => {
    // Distinguish between normal transient transport reconnects and fatal authentication failures
    if (err.message?.includes('Authentication error')) {
      console.warn('🔒 WebSocket authentication rejected by server:', err.message);
      // Stop continuous reconnect attempts if token is invalid or session was revoked
      socket?.disconnect();
    } else {
      console.warn('⚠️ WebSocket connection retry:', err.message);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 WebSocket disconnected:', reason);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}

