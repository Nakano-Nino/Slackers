import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { dataStore } from '../services/dataStore.js';
import { User, UserRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
