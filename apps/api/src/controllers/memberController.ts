import { Request, Response } from 'express';
import { z } from 'zod';
import { memberService } from '../services/memberService.js';
import { ApiResponse, AuthResponse, Invitation, User } from '../types/index.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const AddMemberSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'manager', 'member', 'viewer'] as const).optional().default('member'),
  developerRole: z.string().optional().default('fullstack_developer'),
});

const CreateInviteSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['admin', 'manager', 'member', 'viewer'] as const).optional().default('member'),
  developerRole: z.string().optional().default('fullstack_developer'),
  expiresInDays: z.number().int().min(1).max(365).optional().default(7),
});

const AcceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  password: z.string().min(6),
  developerRole: z.string().optional(),
});

const UpdateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'member', 'viewer'] as const).optional(),
  developerRole: z.string().optional(),
});

export const addMember = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ user: User; tempPassword?: string }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to add members.',
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = AddMemberSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const result = await memberService.addMember(parseResult.data, req.user);
    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to add member',
      timestamp: new Date().toISOString(),
    });
  }
};

export const createInvitation = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<Invitation>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to generate invitations.',
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = CreateInviteSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const invite = await memberService.createInvitation(parseResult.data, req.user);
    res.status(201).json({
      success: true,
      data: invite,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create invitation',
      timestamp: new Date().toISOString(),
    });
  }
};

export const getInvitations = (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<Invitation[]>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const invites = memberService.getInvitations(req.user);
    res.json({
      success: true,
      data: invites,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(403).json({
      success: false,
      error: err instanceof Error ? err.message : 'Permission denied',
      timestamp: new Date().toISOString(),
    });
  }
};

export const revokeInvitation = (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ id: string }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
      timestamp: new Date().toISOString(),
    });
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const success = memberService.revokeInvitation(id, req.user);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Invitation "${id}" not found.`,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: { id },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(403).json({
      success: false,
      error: err instanceof Error ? err.message : 'Permission denied',
      timestamp: new Date().toISOString(),
    });
  }
};

export const verifyInvitation = (
  req: Request,
  res: Response<ApiResponse<{ valid: boolean; invitation?: Partial<Invitation> }>>
) => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const result = memberService.verifyInvitation(token);

  if (!result.valid) {
    return res.status(400).json({
      success: false,
      error: result.error || 'Invalid or expired invitation link',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: {
      valid: true,
      invitation: result.invitation,
    },
    timestamp: new Date().toISOString(),
  });
};

export const acceptInvitation = async (
  req: Request,
  res: Response<ApiResponse<AuthResponse>>
) => {
  const parseResult = AcceptInviteSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const context = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const { token, ...userData } = parseResult.data;
    const result = await memberService.acceptInvitation(token, userData, context);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to accept invitation',
      timestamp: new Date().toISOString(),
    });
  }
};

export const updateMemberRole = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<User>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
      timestamp: new Date().toISOString(),
    });
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parseResult = UpdateMemberRoleSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const updatedMember = await memberService.updateMemberRole(id, parseResult.data, req.user);
    res.json({
      success: true,
      data: updatedMember,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update member role';
    const status = message.includes('Permission denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
};
