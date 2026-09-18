import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService.js';
import { sessionService } from '../services/sessionService.js';
import { socketService } from '../services/socketService.js';
import { mongoLogger } from '../services/mongoLogger.js';
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

export const logout = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ loggedOut: boolean; sessionId?: string }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    if (req.sessionId) {
      await sessionService.revokeSession(req.user.id, req.sessionId);
      socketService.emitSessionRevoked(req.user.id, req.sessionId);
      await mongoLogger.log('USER_LOGOUT', {
        userId: req.user.id,
        sessionId: req.sessionId,
      });
    }

    res.json({
      success: true,
      data: { loggedOut: true, sessionId: req.sessionId },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to logout',
      timestamp: new Date().toISOString(),
    });
  }
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
    const result = await authService.updateProfile(req.user.id, parseResult.data, req.sessionId);
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

const UploadAvatarSchema = z.object({
  image: z.string().min(1, 'Image data is required'),
});

export const uploadAvatar = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ avatarUrl: string; user: User }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = UploadAvatarSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const rawImage = parseResult.data.image;
    let mimeType = 'image/jpeg';
    let base64Data = rawImage;
    let ext = 'jpg';

    if (rawImage.startsWith('data:')) {
      const matches = rawImage.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1].toLowerCase();
        base64Data = matches[2];
        if (mimeType === 'image/png') ext = 'png';
        else if (mimeType === 'image/webp') ext = 'webp';
        else if (mimeType === 'image/gif') ext = 'gif';
        else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') ext = 'jpg';
        else {
          return res.status(400).json({
            success: false,
            error: 'Unsupported image type. Only PNG, JPG, WebP, and GIF are allowed.',
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid data URL format for image',
          timestamp: new Date().toISOString(),
        });
      }
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error: 'Image exceeds maximum size limit of 5 MB',
        timestamp: new Date().toISOString(),
      });
    }

    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const avatarsDir = path.join(uploadsDir, 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    const filename = `avatar-${req.user.id}-${Date.now()}.${ext}`;
    const filePath = path.join(avatarsDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    const updateResult = await authService.updateProfile(req.user.id, { avatar: avatarUrl }, req.sessionId);

    res.json({
      success: true,
      data: {
        avatarUrl,
        user: updateResult.user,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to upload avatar',
      timestamp: new Date().toISOString(),
    });
  }
};
