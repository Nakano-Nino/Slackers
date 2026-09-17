import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { notificationService } from '../services/notificationService.js';
import { ApiResponse, Notification } from '../types/index.js';

export const getNotifications = (
  req: AuthRequest,
  res: Response<ApiResponse<{ notifications: Notification[]; unreadCount: number }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const notifications = notificationService.getNotifications(req.user.id);
  const unreadCount = notificationService.getUnreadCount(req.user.id);

  res.json({
    success: true,
    data: { notifications, unreadCount },
    timestamp: new Date().toISOString(),
  });
};

export const markAsRead = (
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

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const updated = notificationService.markAsRead(id, req.user.id);

  res.json({
    success: true,
    data: { updated },
    timestamp: new Date().toISOString(),
  });
};

export const markAllAsRead = (
  req: AuthRequest,
  res: Response<ApiResponse<{ count: number }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const count = notificationService.markAllAsRead(req.user.id);

  res.json({
    success: true,
    data: { count },
    timestamp: new Date().toISOString(),
  });
};

export const deleteNotification = (
  req: AuthRequest,
  res: Response<ApiResponse<{ deleted: boolean }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const deleted = notificationService.deleteNotification(id, req.user.id);

  res.json({
    success: true,
    data: { deleted },
    timestamp: new Date().toISOString(),
  });
};

export const getMuteTargets = (
  req: AuthRequest,
  res: Response<ApiResponse<import('../types/index.js').MuteTarget[]>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const mutes = notificationService.getMuteTargets(req.user.id);
  res.json({
    success: true,
    data: mutes,
    timestamp: new Date().toISOString(),
  });
};

export const muteTarget = (
  req: AuthRequest,
  res: Response<ApiResponse<import('../types/index.js').MuteTarget>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const { targetType, targetId, duration, targetName } = req.body;
  if (!targetType || !targetId || !duration) {
    return res.status(400).json({
      success: false,
      error: 'targetType, targetId, and duration are required',
      timestamp: new Date().toISOString(),
    });
  }

  if (targetType !== 'channel' && targetType !== 'dm') {
    return res.status(400).json({
      success: false,
      error: "targetType must be 'channel' or 'dm'",
      timestamp: new Date().toISOString(),
    });
  }

  const validDurations = ['1_day', '1_week', '1_month', 'forever'];
  if (!validDurations.includes(duration)) {
    return res.status(400).json({
      success: false,
      error: "duration must be one of: '1_day', '1_week', '1_month', 'forever'",
      timestamp: new Date().toISOString(),
    });
  }

  const mute = notificationService.muteTarget(
    req.user.id,
    targetType,
    targetId,
    duration,
    targetName
  );

  res.status(201).json({
    success: true,
    data: mute,
    timestamp: new Date().toISOString(),
  });
};

export const unmuteTarget = (
  req: AuthRequest,
  res: Response<ApiResponse<{ unmuted: boolean }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const targetType = Array.isArray(req.params.targetType)
    ? req.params.targetType[0]
    : req.params.targetType;
  const targetId = Array.isArray(req.params.targetId)
    ? req.params.targetId[0]
    : req.params.targetId;

  if (targetType !== 'channel' && targetType !== 'dm') {
    return res.status(400).json({
      success: false,
      error: "targetType must be 'channel' or 'dm'",
      timestamp: new Date().toISOString(),
    });
  }

  const unmuted = notificationService.unmuteTarget(req.user.id, targetType as 'channel' | 'dm', targetId);

  res.json({
    success: true,
    data: { unmuted },
    timestamp: new Date().toISOString(),
  });
};

