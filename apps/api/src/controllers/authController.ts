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

  try {
    const result = await authService.login(parseResult.data.email, parseResult.data.password);
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

  try {
    // New registrations default to 'member' role
    const result = await authService.register({
      ...parseResult.data,
      role: 'member',
    });

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
