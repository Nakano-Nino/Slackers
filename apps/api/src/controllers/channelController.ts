import { Request, Response } from 'express';
import { z } from 'zod';
import { dataStore } from '../services/dataStore.js';
import { ApiResponse, Channel } from '../types/index.js';

const CreateChannelSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional().default(''),
  isPrivate: z.boolean().optional().default(false),
});

export const getChannels = (req: Request, res: Response<ApiResponse<Channel[]>>) => {
  const channels = dataStore.getChannels();
  res.json({
    success: true,
    data: channels,
    timestamp: new Date().toISOString(),
  });
};

export const getChannelById = (req: Request, res: Response<ApiResponse<Channel>>) => {
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

export const createChannel = (req: Request, res: Response<ApiResponse<Channel>>) => {
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
  res.status(201).json({
    success: true,
    data: newChannel,
    timestamp: new Date().toISOString(),
  });
};
