import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService.js';
import { ApiResponse, AuthResponse, User } from '../types/index.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const RegisterSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  developerRole: z.string().optional(),
});

export const login = async (req: Request, res: Response<ApiResponse<AuthResponse>>) => {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  const userAgent = (req.headers['user-agent'] as string) || 'unknown';
  const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

  try {
    const result = await authService.login(parseResult.data.email, parseResult.data.password, {
      userAgent,
      ipAddress,
    });
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(401).json({
      success: false,
      error: err instanceof Error ? err.message : 'Login failed',
      timestamp: new Date().toISOString(),
    });
  }
};

export const register = async (req: Request, res: Response<ApiResponse<AuthResponse>>) => {
  const parseResult = RegisterSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  const userAgent = (req.headers['user-agent'] as string) || 'unknown';
  const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

  try {
    // New registrations default to 'member' role with optional developerRole
    const result = await authService.register(
      {
        ...parseResult.data,
        role: 'member',
      },
      { userAgent, ipAddress }
    );

    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : 'Registration failed',
      timestamp: new Date().toISOString(),
    });
  }
};

export const getMe = (req: AuthenticatedRequest, res: Response<ApiResponse<User>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      timestamp: new Date().toISOString(),
    });
  }

  const { passwordHash: _, ...safeUser } = req.user;
  res.json({
    success: true,
    data: safeUser as User,
    timestamp: new Date().toISOString(),
  });
};

const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  avatar: z.string().min(1).optional(),
  developerRole: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<AuthResponse>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = UpdateProfileSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const result = await authService.updateProfile(req.user.id, parseResult.data);
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    const status = message.includes('Permission denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
};
