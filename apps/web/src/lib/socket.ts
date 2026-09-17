import { io, Socket } from 'socket.io-client';
import { authStorage } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(): Socket | null {
  return socket;
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

  // If token changed, disconnect old instance
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('⚡ Real-time WebSocket connected (ID:', socket?.id, ')');
  });

  socket.on('connect_error', (err) => {
    console.warn('⚠️ WebSocket connection error:', err.message);
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
