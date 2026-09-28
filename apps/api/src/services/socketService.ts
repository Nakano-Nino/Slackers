import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { authService } from './authService.js';
import { dataStore } from './dataStore.js';
import { sessionService } from './sessionService.js';
import { projectService } from './projectService.js';
import { DirectMessage, Message, Notification, Task, User, VoiceParticipant } from '../types/index.js';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

export interface AuthenticatedSocket extends Socket {
  user?: User;
}

class SocketService {
  private io: Server | null = null;
  private onlineUsers: Map<string, number> = new Map(); // userId -> active connection count
  private voiceRooms: Map<string, Map<string, VoiceParticipant>> = new Map(); // channelId -> Map<userId, VoiceParticipant>
  private activeDmCalls: Map<string, { caller: User; calleeId: string; callerSocketId: string; startedAt: number }> = new Map();

  async init(httpServer: HttpServer, clientUrl: string = 'http://localhost:3000') {
    this.io = new Server(httpServer, {
      cors: {
        origin: (_origin, callback) => {
          // Allow dynamic origin mirroring behind reverse proxies; auth is strictly enforced by JWT handshake
          callback(null, true);
        },
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 25000,
    });

    // Optional Redis Adapter Setup (falls back gracefully to memory if unavailable)
    if (process.env.REDIS_URL) {
      try {
        const pubClient = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });
        pubClient.on('error', (err) => console.warn('⚠️  Redis adapter pubClient error:', err.message));
        const subClient = pubClient.duplicate();
        subClient.on('error', (err) => console.warn('⚠️  Redis adapter subClient error:', err.message));
        await Promise.all([pubClient.connect(), subClient.connect()]);
        this.io.adapter(createAdapter(pubClient, subClient));
        console.log('⚡ Socket.IO Redis adapter active on', process.env.REDIS_URL);
      } catch (err) {
        console.warn('⚠️  Redis connection unavailable, continuing in-memory:', (err as Error).message);
      }
    }

    // Handshake Authentication Middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.substring(7)
          : null);

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const payload = authService.verifyToken(token);
      if (!payload) {
        return next(new Error('Authentication error: Invalid or expired token'));
      }

      // Enforce sessionId presence in WebSocket handshake (prevent session revocation bypass)
      if (!payload.sessionId) {
        return next(new Error('Authentication error: Token missing session identifier'));
      }

      const isValid = await sessionService.isSessionValid(payload.id, payload.sessionId);
      if (!isValid) {
        return next(new Error('Authentication error: Session has been revoked'));
      }

      const user = dataStore.getUserById(payload.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    });

    // Connection Handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const user = socket.user;
      if (!user) return;

      const userId = user.id;
      // Join user's personal room for DMs & Notifications
      socket.join(`user:${userId}`);

      // Auto-join user to all accessible channel rooms for real-time unread/message tracking
      const channels = dataStore.getChannels();
      for (const channel of channels) {
        if (
          !channel.isPrivate ||
          user.role === 'admin' ||
          user.role === 'manager' ||
          dataStore.getChannelKey(channel.id, user.id)
        ) {
          socket.join(`channel:${channel.id}`);
        }
      }

      // Track presence
      const currentCount = this.onlineUsers.get(userId) || 0;
      this.onlineUsers.set(userId, currentCount + 1);

      if (currentCount === 0) {
        dataStore.updateUser(userId, { status: 'online' });
        this.io?.emit('presence:update', { userId, status: 'online' });
      }

      // Channel rooms
      socket.on('channel:join', (channelId: string) => {
        if (!channelId || typeof channelId !== 'string') return;

        const channel = dataStore.getChannelById(channelId);
        if (!channel) return;

        // If channel is private, verify user has access (admin/manager or assigned key)
        if (channel.isPrivate && user.role !== 'admin' && user.role !== 'manager') {
          const key = dataStore.getChannelKey(channelId, user.id);
          if (!key) {
            socket.emit('error', { message: `Access denied to private channel #${channel.name}` });
            return;
          }
        }

        socket.join(`channel:${channelId}`);
      });

      socket.on('channel:leave', (channelId: string) => {
        if (channelId) {
          socket.leave(`channel:${channelId}`);
        }
      });

      // Project rooms (for Kanban card sync) - strictly authorized
      socket.on('project:join', (projectId: string) => {
        if (!projectId || typeof projectId !== 'string') return;

        const project = projectService.getProjectById(projectId, user);
        if (!project) {
          socket.emit('error', { message: `Access denied to project "${projectId}"` });
          return;
        }

        socket.join(`project:${projectId}`);
      });

      socket.on('project:leave', (projectId: string) => {
        if (projectId) {
          socket.leave(`project:${projectId}`);
        }
      });

      // Typing indicators
      socket.on('typing:start', (data: { channelId?: string; dmPartnerId?: string }) => {
        if (data.channelId) {
          socket.to(`channel:${data.channelId}`).emit('typing:update', {
            channelId: data.channelId,
            user: { id: user.id, name: user.name },
            isTyping: true,
          });
        } else if (data.dmPartnerId) {
          socket.to(`user:${data.dmPartnerId}`).emit('typing:update', {
            dmPartnerId: user.id,
            user: { id: user.id, name: user.name },
            isTyping: true,
          });
        }
      });

      socket.on('typing:stop', (data: { channelId?: string; dmPartnerId?: string }) => {
        if (data.channelId) {
          socket.to(`channel:${data.channelId}`).emit('typing:update', {
            channelId: data.channelId,
            user: { id: user.id, name: user.name },
            isTyping: false,
          });
        } else if (data.dmPartnerId) {
          socket.to(`user:${data.dmPartnerId}`).emit('typing:update', {
            dmPartnerId: user.id,
            user: { id: user.id, name: user.name },
            isTyping: false,
          });
        }
      });

      // WebRTC: 1-on-1 Direct Message Voice Calls
      socket.on('webrtc:call-user', (data: { targetUserId: string }) => {
        if (!data?.targetUserId || data.targetUserId === userId) return;
        const targetUser = dataStore.getUserById(data.targetUserId);
        if (!targetUser) return;

        const callId = `call_${userId}_${data.targetUserId}_${Date.now()}`;
        this.activeDmCalls.set(callId, {
          caller: user,
          calleeId: data.targetUserId,
          callerSocketId: socket.id,
          startedAt: Date.now(),
        });

        this.io?.to(`user:${data.targetUserId}`).emit('webrtc:incoming-call', {
          callId,
          caller: user,
          targetUserId: data.targetUserId,
        });
      });

      socket.on('webrtc:accept-call', (data: { callId?: string; callerId: string }) => {
        if (!data?.callerId) return;
        this.io?.to(`user:${data.callerId}`).emit('webrtc:call-accepted', {
          callId: data.callId,
          callee: user,
        });
      });

      socket.on('webrtc:decline-call', (data: { callId?: string; callerId: string; reason?: string }) => {
        if (!data?.callerId) return;
        this.io?.to(`user:${data.callerId}`).emit('webrtc:call-declined', {
          callId: data.callId,
          calleeId: userId,
          reason: data.reason || 'declined',
        });
      });

      socket.on('webrtc:end-call', (data: { targetUserId: string }) => {
        if (data?.targetUserId) {
          this.io?.to(`user:${data.targetUserId}`).emit('webrtc:call-ended', {
            byUserId: userId,
          });
        }
      });

      socket.on('webrtc:signal-dm', (data: { targetUserId: string; signal: any }) => {
        if (data?.targetUserId && data.signal) {
          this.io?.to(`user:${data.targetUserId}`).emit('webrtc:signal-dm', {
            fromUserId: userId,
            signal: data.signal,
          });
        }
      });

      // WebRTC: Group Channel Voice Chat
      socket.on('webrtc:channel-voice-join', (data: { channelId: string }) => {
        const { channelId } = data || {};
        if (!channelId || typeof channelId !== 'string') return;

        const channel = dataStore.getChannelById(channelId);
        if (!channel) return;

        // Access control check for private channels
        if (channel.isPrivate && user.role !== 'admin' && user.role !== 'manager') {
          const key = dataStore.getChannelKey(channelId, user.id);
          if (!key) {
            socket.emit('error', { message: 'Access denied to voice in private channel' });
            return;
          }
        }

        // Leave any previous voice channel room first
        this.leaveAllVoiceRooms(socket, user);

        let room = this.voiceRooms.get(channelId);
        if (!room) {
          room = new Map();
          this.voiceRooms.set(channelId, room);
        }

        const participant: VoiceParticipant = {
          socketId: socket.id,
          userId: user.id,
          user,
          muted: false,
          deafened: false,
          isSpeaking: false,
          joinedAt: new Date().toISOString(),
        };

        room.set(user.id, participant);
        socket.join(`voice:channel:${channelId}`);

        const allParticipants = Array.from(room.values());

        // Send existing participants to the joining user
        socket.emit('webrtc:channel-voice-users', {
          channelId,
          participants: allParticipants,
        });

        // Notify other participants in the voice room
        socket.to(`voice:channel:${channelId}`).emit('webrtc:channel-voice-user-joined', {
          channelId,
          participant,
        });

        // Broadcast voice state update to text channel subscribers so they see live voice activity
        this.io?.to(`channel:${channelId}`).emit('webrtc:channel-voice-state', {
          channelId,
          participants: allParticipants,
        });
      });

      socket.on('webrtc:channel-voice-signal', (data: { targetSocketId?: string; targetUserId?: string; channelId: string; signal: any }) => {
        if (!data?.signal) return;
        if (data.targetSocketId) {
          this.io?.to(data.targetSocketId).emit('webrtc:channel-voice-signal', {
            fromSocketId: socket.id,
            fromUserId: user.id,
            channelId: data.channelId,
            signal: data.signal,
          });
        } else if (data.targetUserId) {
          this.io?.to(`user:${data.targetUserId}`).emit('webrtc:channel-voice-signal', {
            fromSocketId: socket.id,
            fromUserId: user.id,
            channelId: data.channelId,
            signal: data.signal,
          });
        }
      });

      socket.on('webrtc:channel-voice-leave', (data: { channelId: string }) => {
        if (data?.channelId) {
          this.leaveVoiceRoom(socket, user, data.channelId);
        }
      });

      socket.on('webrtc:channel-voice-mute', (data: { channelId: string; muted: boolean; deafened: boolean }) => {
        if (!data?.channelId) return;
        const room = this.voiceRooms.get(data.channelId);
        if (room && room.has(user.id)) {
          const p = room.get(user.id)!;
          p.muted = Boolean(data.muted);
          p.deafened = Boolean(data.deafened);
          this.io?.to(`voice:channel:${data.channelId}`).emit('webrtc:channel-voice-user-updated', {
            channelId: data.channelId,
            userId: user.id,
            muted: p.muted,
            deafened: p.deafened,
          });
        }
      });

      socket.on('webrtc:channel-voice-speaking', (data: { channelId: string; isSpeaking: boolean }) => {
        if (!data?.channelId) return;
        const room = this.voiceRooms.get(data.channelId);
        if (room && room.has(user.id)) {
          const p = room.get(user.id)!;
          p.isSpeaking = Boolean(data.isSpeaking);
          socket.to(`voice:channel:${data.channelId}`).emit('webrtc:channel-voice-speaking', {
            channelId: data.channelId,
            userId: user.id,
            isSpeaking: p.isSpeaking,
          });
        }
      });

      socket.on('webrtc:get-all-voice-states', () => {
        socket.emit('webrtc:all-voice-states', this.getAllVoiceStates());
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.leaveAllVoiceRooms(socket, user);

        // Notify DM call partner if in call
        this.activeDmCalls.forEach((call, callId) => {
          if (call.caller.id === userId) {
            this.io?.to(`user:${call.calleeId}`).emit('webrtc:call-ended', { byUserId: userId });
            this.activeDmCalls.delete(callId);
          } else if (call.calleeId === userId) {
            this.io?.to(`user:${call.caller.id}`).emit('webrtc:call-ended', { byUserId: userId });
            this.activeDmCalls.delete(callId);
          }
        });

        const count = this.onlineUsers.get(userId) || 1;
        if (count <= 1) {
          this.onlineUsers.delete(userId);
          dataStore.updateUser(userId, { status: 'offline' });
          this.io?.emit('presence:update', { userId, status: 'offline' });
        } else {
          this.onlineUsers.set(userId, count - 1);
        }
      });
    });

    console.log('⚡ Socket.IO real-time server active on /socket.io');
  }

  // Dispatch helpers
  emitNewMessage(channelId: string, message: Message) {
    if (!this.io) return;
    this.io.to(`channel:${channelId}`).emit('message:new', message);
  }

  emitMessageReaction(channelId: string, messageId: string, reactions: Record<string, string[]>) {
    if (!this.io) return;
    this.io.to(`channel:${channelId}`).emit('message:reaction', { messageId, reactions });
  }

  emitMessageEdited(channelId: string, message: Message) {
    if (!this.io) return;
    this.io.to(`channel:${channelId}`).emit('message:edited', message);
  }

  emitMessageDeleted(channelId: string, messageId: string) {
    if (!this.io) return;
    this.io.to(`channel:${channelId}`).emit('message:deleted', { messageId, channelId });
  }

  emitThreadReply(
    channelId: string,
    parentId: string,
    reply: Message,
    parentUpdate: { replyCount: number; lastReplyAt: string }
  ) {
    if (!this.io) return;
    this.io.to(`channel:${channelId}`).emit('thread:reply', {
      channelId,
      parentId,
      reply,
      parentUpdate,
    });
  }

  emitNewDirectMessage(senderId: string, receiverId: string, message: DirectMessage) {
    if (!this.io) return;
    this.io.to(`user:${receiverId}`).to(`user:${senderId}`).emit('dm:new', message);
  }

  emitDmReaction(
    senderId: string,
    receiverId: string,
    messageId: string,
    reactions: Record<string, string[]>
  ) {
    if (!this.io) return;
    this.io.to(`user:${receiverId}`).to(`user:${senderId}`).emit('dm:reaction', { messageId, reactions });
  }

  emitDmEdited(senderId: string, receiverId: string, message: DirectMessage) {
    if (!this.io) return;
    this.io.to(`user:${receiverId}`).to(`user:${senderId}`).emit('dm:edited', message);
  }

  emitDmDeleted(senderId: string, receiverId: string, messageId: string) {
    if (!this.io) return;
    this.io.to(`user:${receiverId}`).to(`user:${senderId}`).emit('dm:deleted', { messageId });
  }

  emitDmRead(senderId: string, partnerId: string, readAt: string) {
    if (!this.io) return;
    this.io.to(`user:${senderId}`).emit('dm:read', { partnerId, readAt });
  }

  emitNewNotification(recipientId: string, notification: Notification) {
    if (!this.io) return;
    this.io.to(`user:${recipientId}`).emit('notification:new', notification);
  }

  emitTaskCreated(projectId: string, task: Task) {
    if (!this.io) return;
    this.io.to(`project:${projectId}`).emit('task:created', task);
  }

  emitTaskUpdated(projectId: string, task: Task) {
    if (!this.io) return;
    this.io.to(`project:${projectId}`).emit('task:updated', task);
  }

  emitTaskDeleted(projectId: string, taskId: string) {
    if (!this.io) return;
    this.io.to(`project:${projectId}`).emit('task:deleted', { taskId, projectId });
  }

  emitSessionRevoked(userId: string, sessionId: string) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit('session:revoked', { sessionId });
  }

  emitUserCreated(user: User) {
    if (!this.io) return;
    this.io.emit('user:created', user);
  }

  emitUserUpdated(user: User) {
    if (!this.io) return;
    this.io.emit('user:updated', user);
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  private leaveVoiceRoom(socket: Socket, user: User, channelId: string) {
    const room = this.voiceRooms.get(channelId);
    if (!room) return;

    if (room.has(user.id)) {
      room.delete(user.id);
      socket.leave(`voice:channel:${channelId}`);

      // Notify others in voice room
      socket.to(`voice:channel:${channelId}`).emit('webrtc:channel-voice-user-left', {
        channelId,
        userId: user.id,
      });

      // Update room state
      const remaining = Array.from(room.values());
      if (remaining.length === 0) {
        this.voiceRooms.delete(channelId);
      }

      // Broadcast updated voice state to text channel subscribers
      this.io?.to(`channel:${channelId}`).emit('webrtc:channel-voice-state', {
        channelId,
        participants: remaining,
      });
    }
  }

  private leaveAllVoiceRooms(socket: Socket, user: User) {
    this.voiceRooms.forEach((room, channelId) => {
      if (room.has(user.id)) {
        this.leaveVoiceRoom(socket, user, channelId);
      }
    });
  }

  getAllVoiceStates(): Record<string, VoiceParticipant[]> {
    const states: Record<string, VoiceParticipant[]> = {};
    this.voiceRooms.forEach((room, channelId) => {
      states[channelId] = Array.from(room.values());
    });
    return states;
  }

  getVoiceParticipants(channelId: string): VoiceParticipant[] {
    const room = this.voiceRooms.get(channelId);
    return room ? Array.from(room.values()) : [];
  }
}

export const socketService = new SocketService();
