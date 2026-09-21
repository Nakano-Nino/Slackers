import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { sessionService, UserSession } from '../services/sessionService.js';
import { socketService } from '../services/socketService.js';
import { ApiResponse } from '../types/index.js';

export interface UserSessionResponse extends UserSession {
  isCurrent: boolean;
}

export const getSessions = async (
  req: AuthRequest,
  res: Response<ApiResponse<UserSessionResponse[]>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const rawSessions = await sessionService.getUserSessions(req.user.id);
    const sessionsWithCurrent: UserSessionResponse[] = rawSessions.map((s) => ({
      ...s,
      isCurrent: s.id === req.sessionId,
    }));

    res.json({
      success: true,
      data: sessionsWithCurrent,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve sessions',
      timestamp: new Date().toISOString(),
    });
  }
};

export const revokeSession = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ revoked: boolean; sessionId: string }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const sessionId = Array.isArray(req.params.sessionId)
    ? req.params.sessionId[0]
    : req.params.sessionId;

  try {
    const revoked = await sessionService.revokeSession(req.user.id, sessionId);
    if (!revoked) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: Cannot revoke a session that does not belong to your account',
        timestamp: new Date().toISOString(),
      });
    }

    // Notify connected sockets in real time to force logout
    socketService.emitSessionRevoked(req.user.id, sessionId);

    res.json({
      success: true,
      data: { revoked: true, sessionId },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to revoke session',
      timestamp: new Date().toISOString(),
    });
  }
};

export const revokeOtherSessions = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ revokedCount: number }>>
) => {
  if (!req.user || !req.sessionId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required with active session',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const count = await sessionService.revokeOtherSessions(req.user.id, req.sessionId);

    // Broadcast session revoked event
    socketService.emitSessionRevoked(req.user.id, 'all-others');

    res.json({
      success: true,
      data: { revokedCount: count },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to revoke other sessions',
      timestamp: new Date().toISOString(),
    });
  }
};
