import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { dataStore } from '../services/dataStore.js';
import { mongoLogger } from '../services/mongoLogger.js';
import { notificationService } from '../services/notificationService.js';
import { socketService } from '../services/socketService.js';
import { ApiResponse, Message } from '../types/index.js';

const CreateMessageSchema = z.object({
  channelId: z.string().min(1),
  ciphertext: z.string().min(1, 'ciphertext is required for E2EE'),
  iv: z.string().min(1, 'iv is required for E2EE'),
  content: z.string().optional(),
  userId: z.string().optional(),
  taskId: z.string().optional(),
  bugId: z.string().optional(),
  parentId: z.string().optional(),
  expiresAt: z.string().datetime({ offset: true }).optional().or(z.string().optional()),
  clientTimestamp: z.number().optional(),
});

export const getMessagesByChannel = (req: AuthenticatedRequest, res: Response<ApiResponse<Message[]>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to view messages',
      timestamp: new Date().toISOString(),
    });
  }

  const channelId = Array.isArray(req.params.channelId) ? req.params.channelId[0] : req.params.channelId;
  const channel = dataStore.getChannelById(channelId);
  if (!channel) {
    return res.status(404).json({
      success: false,
      error: `Channel "${channelId}" not found`,
      timestamp: new Date().toISOString(),
    });
  }

  // Private channel authorization: Admin, Manager, or user with an assigned channel key
  if (channel.isPrivate && req.user.role !== 'admin' && req.user.role !== 'manager') {
    const key = dataStore.getChannelKey(channelId, req.user.id);
    if (!key) {
      return res.status(403).json({
        success: false,
        error: `Access denied to private channel #${channel.name}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const before = typeof req.query.before === 'string' ? req.query.before : undefined;
  const limitParam = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
  const limit = limitParam && !isNaN(limitParam) ? limitParam : 50;

  const result = dataStore.getMessagesByChannel(channelId, { before, limit });
  res.json({
    success: true,
    data: result.messages,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
    timestamp: new Date().toISOString(),
  });
};

export const getThreadReplies = (req: AuthenticatedRequest, res: Response<ApiResponse<Message[]>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to view thread replies',
      timestamp: new Date().toISOString(),
    });
  }

  const parentId = Array.isArray(req.params.parentId) ? req.params.parentId[0] : req.params.parentId;
  const parentMessage = dataStore.getMessageById(parentId);
  if (parentMessage) {
    const parentChannel = dataStore.getChannelById(parentMessage.channelId);
    if (parentChannel && parentChannel.isPrivate && req.user.role !== 'admin' && req.user.role !== 'manager') {
      const key = dataStore.getChannelKey(parentChannel.id, req.user.id);
      if (!key) {
        return res.status(403).json({
          success: false,
          error: `Access denied to thread in private channel #${parentChannel.name}`,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
  const replies = dataStore.getThreadReplies(parentId);
  res.json({
    success: true,
    data: replies,
    timestamp: new Date().toISOString(),
  });
};

export const createMessage = async (req: AuthenticatedRequest, res: Response<ApiResponse<Message>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to post messages',
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = CreateMessageSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  const channel = dataStore.getChannelById(parseResult.data.channelId);
  if (!channel) {
    return res.status(404).json({
      success: false,
      error: `Channel "${parseResult.data.channelId}" does not exist`,
      timestamp: new Date().toISOString(),
    });
  }

  // Private channel authorization: Admin, Manager, or user with an assigned channel key
  if (channel.isPrivate && req.user.role !== 'admin' && req.user.role !== 'manager') {
    const key = dataStore.getChannelKey(channel.id, req.user.id);
    if (!key) {
      return res.status(403).json({
        success: false,
        error: `Access denied to post in private channel #${channel.name}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Security: strictly enforce sender identity from authenticated session
  const messageData = {
    ...parseResult.data,
    userId: req.user.id,
  };

  const message = dataStore.addMessage(messageData);
  const sender = req.user;

  if (sender) {
    await mongoLogger.log(
      'MESSAGE_SENT',
      {
        messageId: message.id,
        channelId: message.channelId,
        encrypted: true,
        algorithm: 'AES-GCM-256',
        taskId: message.taskId,
        bugId: message.bugId,
        parentId: message.parentId,
      },
      sender
    );
  }


  // Note: Channel messages do not create global notifications; instead unread state is indicated Discord-style in the sidebar

  // Emit real-time WebSocket events
  if (message.parentId) {
    const parent = dataStore.getMessageById(message.parentId);
    if (parent) {
      socketService.emitThreadReply(channel.id, message.parentId, message, {
        replyCount: parent.replyCount || 1,
        lastReplyAt: parent.lastReplyAt || message.createdAt,
      });
    }
  } else {
    socketService.emitNewMessage(channel.id, message);
  }

  res.status(201).json({
    success: true,
    data: message,
    timestamp: new Date().toISOString(),
  });
};

export const toggleReaction = async (req: AuthenticatedRequest, res: Response<ApiResponse<Message>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to react to messages',
      timestamp: new Date().toISOString(),
    });
  }

  const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { emoji } = req.body;

  if (!emoji || typeof emoji !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Emoji is required',
      timestamp: new Date().toISOString(),
    });
  }

  const updated = dataStore.toggleMessageReaction(messageId, emoji, req.user.id);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: 'Message not found',
      timestamp: new Date().toISOString(),
    });
  }

  socketService.emitMessageReaction(updated.channelId, updated.id, updated.reactions || {});

  res.json({
    success: true,
    data: updated,
    timestamp: new Date().toISOString(),
  });
};

export const editMessage = async (req: AuthenticatedRequest, res: Response<ApiResponse<Message>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to edit messages',
      timestamp: new Date().toISOString(),
    });
  }

  const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { ciphertext, iv } = req.body;

  if (!ciphertext || !iv) {
    return res.status(400).json({
      success: false,
      error: 'Ciphertext and iv are required',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const updated = dataStore.editMessage(
      messageId,
      ciphertext,
      iv,
      req.user.id
    );
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
        timestamp: new Date().toISOString(),
      });
    }

    socketService.emitMessageEdited(updated.channelId, updated);

    res.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};

export const deleteMessage = async (req: AuthenticatedRequest, res: Response<ApiResponse<{ messageId: string }>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to delete messages',
      timestamp: new Date().toISOString(),
    });
  }

  const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const updated = dataStore.deleteMessage(messageId, req.user.id, req.user.role === 'admin');
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
        timestamp: new Date().toISOString(),
      });
    }

    socketService.emitMessageDeleted(updated.channelId, updated.id);

    res.json({
      success: true,
      data: { messageId },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};
