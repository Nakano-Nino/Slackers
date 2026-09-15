import { Request, Response } from 'express';
import { z } from 'zod';
import { dataStore } from '../services/dataStore.js';
import { ApiResponse, Message } from '../types/index.js';

const CreateMessageSchema = z.object({
  channelId: z.string().min(1),
  content: z.string().min(1).max(2000),
  userId: z.string().optional(),
});

export const getMessagesByChannel = (req: Request, res: Response<ApiResponse<Message[]>>) => {
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

export const createMessage = (req: Request, res: Response<ApiResponse<Message>>) => {
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

  const message = dataStore.addMessage(parseResult.data);
  res.status(201).json({
    success: true,
    data: message,
    timestamp: new Date().toISOString(),
  });
};
