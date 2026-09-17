import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { dataStore } from '../services/dataStore.js';
import { mongoLogger } from '../services/mongoLogger.js';
import { ApiResponse, Channel } from '../types/index.js';

const CreateChannelSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional().default(''),
  isPrivate: z.boolean().optional().default(false),
});

export const getChannels = (req: AuthRequest, res: Response<ApiResponse<Channel[]>>) => {
  const channels = dataStore.getChannels();
  res.json({
    success: true,
    data: channels,
    timestamp: new Date().toISOString(),
  });
};

export const getChannelById = (req: AuthRequest, res: Response<ApiResponse<Channel>>) => {
  const channelId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const channel = dataStore.getChannelById(channelId);
  if (!channel) {
    return res.status(404).json({
      success: false,
      error: `Channel with id "${channelId}" not found`,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: channel,
    timestamp: new Date().toISOString(),
  });
};

export const createChannel = async (req: AuthRequest, res: Response<ApiResponse<Channel>>) => {
  // Only Admin and Manager can create channels
  if (req.user && req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      error: 'Permission denied: Only Admins and Managers can create channels',
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = CreateChannelSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  const existing = dataStore.getChannelById(parseResult.data.name.toLowerCase().replace(/\s+/g, '-'));
  if (existing) {
    return res.status(409).json({
      success: false,
      error: `Channel "#${parseResult.data.name}" already exists`,
      timestamp: new Date().toISOString(),
    });
  }

  const newChannel = dataStore.createChannel(parseResult.data);

  if (req.user) {
    await mongoLogger.log(
      'CHANNEL_CREATED',
      {
        channelId: newChannel.id,
        channelName: newChannel.name,
        isPrivate: newChannel.isPrivate,
      },
      req.user
    );
  }

  res.status(201).json({
    success: true,
    data: newChannel,
    timestamp: new Date().toISOString(),
  });
};

const SaveChannelKeySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  encryptedKey: z.string().min(10, 'encryptedKey is required'),
  iv: z.string().min(8, 'iv is required'),
});

export const saveChannelKey = (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const channelId = Array.isArray(req.params.channelId) ? req.params.channelId[0] : req.params.channelId;
  const parseResult = SaveChannelKeySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  const record = dataStore.setChannelKey(
    channelId,
    parseResult.data.userId,
    parseResult.data.encryptedKey,
    parseResult.data.iv
  );

  res.status(201).json({
    success: true,
    data: record,
    timestamp: new Date().toISOString(),
  });
};

export const getChannelKey = (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const channelId = Array.isArray(req.params.channelId) ? req.params.channelId[0] : req.params.channelId;
  const key = dataStore.getChannelKey(channelId, req.user.id);

  res.json({
    success: true,
    data: key || null,
    timestamp: new Date().toISOString(),
  });
};
