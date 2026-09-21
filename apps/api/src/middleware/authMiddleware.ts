import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { dataStore } from '../services/dataStore.js';
import { sessionService } from '../services/sessionService.js';
import { User, UserRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionId?: string;
}

export type AuthRequest = AuthenticatedRequest;

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid Bearer token.',
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token. Please log in again.',
      timestamp: new Date().toISOString(),
    });
  }

  // Require sessionId in token to ensure session revocation cannot be bypassed
  if (!payload.sessionId) {
    return res.status(401).json({
      success: false,
      error: 'Token missing session identifier. Please log in again.',
      timestamp: new Date().toISOString(),
    });
  }

  const isValid = await sessionService.isSessionValid(payload.id, payload.sessionId);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: 'Session has been revoked or expired. Please log in again.',
      timestamp: new Date().toISOString(),
    });
  }
  // Touch session last active time
  sessionService.touchSession(payload.sessionId).catch(() => {});
  req.sessionId = payload.sessionId;

  const user = dataStore.getUserById(payload.id);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'User account not found',
      timestamp: new Date().toISOString(),
    });
  }

  req.user = user;
  next();
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);
    if (payload) {
      const user = dataStore.getUserById(payload.id);
      if (user) {
        req.user = user;
      }
    }
  }
  next();
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        timestamp: new Date().toISOString(),
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Permission denied. Required role: [${allowedRoles.join(', ')}], current role: "${req.user.role}".`,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};
