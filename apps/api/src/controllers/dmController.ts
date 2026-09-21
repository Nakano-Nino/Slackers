import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { dataStore } from '../services/dataStore.js';
import { dmService } from '../services/dmService.js';
import { notificationService } from '../services/notificationService.js';
import { redisService } from '../services/redisService.js';
import { socketService } from '../services/socketService.js';
import { ApiResponse, DirectMessage } from '../types/index.js';

const SendMessageSchema = z.object({
  receiverId: z.string().min(1, 'receiverId is required'),
  ciphertext: z.string().min(1, 'ciphertext is required'),
  iv: z.string().min(1, 'iv is required'),
  senderCopy: z.string().optional(),
  expiresAt: z.string().datetime({ offset: true }).optional().or(z.string().optional()),
  clientTimestamp: z.number().optional(),
});

const PublicKeySchema = z.object({
  publicKey: z.string().min(10, 'Valid public key is required'),
});

export const getConversation = (
  req: AuthRequest,
  res: Response<ApiResponse<DirectMessage[]>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const partnerId = Array.isArray(req.params.partnerId) ? req.params.partnerId[0] : req.params.partnerId;
  const before = typeof req.query.before === 'string' ? req.query.before : undefined;
  const limitParam = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
  const limit = limitParam && !isNaN(limitParam) ? limitParam : 50;

  const result = dmService.getConversation(req.user.id, partnerId, { before, limit });

  res.json({
    success: true,
    data: result.messages,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
    timestamp: new Date().toISOString(),
  });
};

export const sendDirectMessage = async (
  req: AuthRequest,
  res: Response<ApiResponse<DirectMessage>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = SendMessageSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const message = await dmService.sendEncryptedMessage(
      req.user.id,
      parseResult.data.receiverId,
      parseResult.data.ciphertext,
      parseResult.data.iv,
      parseResult.data.senderCopy,
      parseResult.data.expiresAt,
      parseResult.data.clientTimestamp
    );

    // Trigger notification for recipient
    notificationService.createNotification({
      recipientId: parseResult.data.receiverId,
      senderId: req.user.id,
      senderName: req.user.name,
      senderAvatar: req.user.avatar,
      type: 'dm',
      title: 'Direct Message',
      content: `${req.user.name} sent you an encrypted direct message`,
      link: { type: 'dm', id: req.user.id },
    });

    // Increment fast unread counter in Redis
    await redisService.hincrby(`unread:dms:${parseResult.data.receiverId}`, req.user.id, 1);

    // Emit real-time WebSocket event for instant DM arrival
    socketService.emitNewDirectMessage(req.user.id, parseResult.data.receiverId, message);

    res.status(201).json({
      success: true,
      data: message,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send message',
      timestamp: new Date().toISOString(),
    });
  }
};

export const getRecentConversations = (
  req: AuthRequest,
  res: Response<ApiResponse<any[]>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const conversations = dmService.getRecentConversations(req.user.id);
  res.json({
    success: true,
    data: conversations,
    timestamp: new Date().toISOString(),
  });
};

export const setPublicKey = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ updated: boolean }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = PublicKeySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  const updated = dataStore.updateUserPublicKey(req.user.id, parseResult.data.publicKey);
  // Cache in Redis for fast future lookups (1-hour TTL)
  await redisService.set(`pk:${req.user.id}`, parseResult.data.publicKey, 3600);

  res.json({
    success: true,
    data: { updated },
    timestamp: new Date().toISOString(),
  });
};

export const getPublicKey = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ publicKey: string | null }>>
) => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

  // 1. Check Redis cache first
  const cached = await redisService.get(`pk:${userId}`);
  if (cached) {
    return res.json({
      success: true,
      data: { publicKey: cached },
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Cache miss: fetch from data store and populate Redis
  const key = dataStore.getUserPublicKey(userId);
  if (key) {
    await redisService.set(`pk:${userId}`, key, 3600);
  }

  res.json({
    success: true,
    data: { publicKey: key || null },
    timestamp: new Date().toISOString(),
  });
};

const KeyVaultSchema = z.object({
  publicKey: z.string().min(10, 'Valid public key is required'),
  encryptedPrivateKey: z.string().min(10, 'Valid encrypted private key is required'),
  keyVaultSalt: z.string().min(8, 'Valid key vault salt is required'),
  keyVaultIv: z.string().min(8, 'Valid key vault IV is required'),
});

export const setKeyVault = (
  req: AuthRequest,
  res: Response<ApiResponse<{ updated: boolean }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = KeyVaultSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  const updated = dataStore.updateUserKeyVault(req.user.id, parseResult.data);
  res.json({
    success: true,
    data: { updated },
    timestamp: new Date().toISOString(),
  });
};

export const getKeyVault = (
  req: AuthRequest,
  res: Response<ApiResponse<any>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const vault = dataStore.getUserKeyVault(req.user.id);
  res.json({
    success: true,
    data: vault,
    timestamp: new Date().toISOString(),
  });
};

export const getUnreadCounts = async (
  req: AuthRequest,
  res: Response<ApiResponse<Record<string, number>>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const userId = req.user.id;
  // 1. Check Redis hash
  const redisCounts = await redisService.hgetall(`unread:dms:${userId}`);
  if (Object.keys(redisCounts).length > 0) {
    const unreadMap: Record<string, number> = {};
    for (const [senderId, countStr] of Object.entries(redisCounts)) {
      const num = parseInt(countStr, 10);
      if (num > 0) {
        unreadMap[senderId] = num;
      }
    }
    return res.json({
      success: true,
      data: unreadMap,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Fallback to dmService calculation and seed Redis hash
  const unreadMap = dmService.getUnreadCounts(userId);
  for (const [senderId, count] of Object.entries(unreadMap)) {
    if (count > 0) {
      await redisService.hset(`unread:dms:${userId}`, senderId, count.toString());
    }
  }

  res.json({
    success: true,
    data: unreadMap,
    timestamp: new Date().toISOString(),
  });
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ markedCount: number }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const partnerId = Array.isArray(req.params.partnerId) ? req.params.partnerId[0] : req.params.partnerId;
  const markedCount = dmService.markConversationAsRead(req.user.id, partnerId);

  // Clear unread count for this partner in Redis hash
  await redisService.hdel(`unread:dms:${req.user.id}`, partnerId);

  if (markedCount > 0) {
    socketService.emitDmRead(partnerId, req.user.id, new Date().toISOString());
  }

  res.json({
    success: true,
    data: { markedCount },
    timestamp: new Date().toISOString(),
  });
};

export const toggleDmReaction = async (
  req: AuthRequest,
  res: Response<ApiResponse<DirectMessage>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
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

  const updated = dmService.toggleReaction(messageId, emoji, req.user.id);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: 'Direct message not found',
      timestamp: new Date().toISOString(),
    });
  }

  socketService.emitDmReaction(
    updated.senderId,
    updated.receiverId,
    updated.id,
    updated.reactions || {}
  );

  res.json({
    success: true,
    data: updated,
    timestamp: new Date().toISOString(),
  });
};

export const editDirectMessage = async (
  req: AuthRequest,
  res: Response<ApiResponse<DirectMessage>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { ciphertext, iv, senderCopy } = req.body;

  if (!ciphertext || !iv) {
    return res.status(400).json({
      success: false,
      error: 'Ciphertext and iv are required',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const updated = dmService.editDirectMessage(
      messageId,
      ciphertext,
      iv,
      req.user.id,
      senderCopy
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Direct message not found',
        timestamp: new Date().toISOString(),
      });
    }

    socketService.emitDmEdited(updated.senderId, updated.receiverId, updated);

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

export const deleteDirectMessage = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ messageId: string }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const updated = dmService.deleteDirectMessage(
      messageId,
      req.user.id,
      req.user.role === 'admin'
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Direct message not found',
        timestamp: new Date().toISOString(),
      });
    }

    socketService.emitDmDeleted(updated.senderId, updated.receiverId, updated.id);

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
