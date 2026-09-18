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

  const messages = dataStore.getMessagesByChannel(channelId);
  res.json({
    success: true,
    data: messages,
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

  // Trigger notification for all team members except the sender
  const users = dataStore.getUsers();
  for (const u of users) {
    if (u.id !== message.userId) {
      notificationService.createNotification({
        recipientId: u.id,
        senderId: sender?.id || message.userId,
        senderName: sender?.name || message.userName,
        senderAvatar: sender?.avatar || message.userAvatar,
        type: 'message',
        title: message.parentId ? `New reply in #${channel.name}` : `New message in #${channel.name}`,
        content: `${sender?.name || message.userName} posted in #${channel.name}`,
        link: { type: 'channel', id: channel.id },
      });
    }
  }

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

export const toggleReaction = async (req: Request, res: Response<ApiResponse<Message>>) => {
  const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { emoji } = req.body;
  const user = (req as any).user;

  if (!emoji || typeof emoji !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Emoji is required',
      timestamp: new Date().toISOString(),
    });
  }

  const updated = dataStore.toggleMessageReaction(messageId, emoji, user?.id || 'u-1');
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

export const editMessage = async (req: Request, res: Response<ApiResponse<Message>>) => {
  const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { ciphertext, iv } = req.body;
  const user = (req as any).user;

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
      user?.id || 'u-1'
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

export const deleteMessage = async (req: Request, res: Response<ApiResponse<{ messageId: string }>>) => {
  const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = (req as any).user;

  try {
    const updated = dataStore.deleteMessage(messageId, user?.id || 'u-1', user?.role === 'admin');
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
