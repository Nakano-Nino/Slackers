import { Response } from 'express';
import { z } from 'zod';
import { bugService } from '../services/bugService.js';
import { ApiResponse, Bug, BugEnvironment, BugSeverity, BugStats, BugStatus, Task } from '../types/index.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const CreateBugSchema = z.object({
  projectId: z.string().min(1).default('proj-core'),
  title: z.string().min(3).max(150),
  description: z.string().min(5).max(3000),
  severity: z.enum(['critical', 'major', 'minor', 'cosmetic'] as const).default('major'),
  environment: z.enum(['production', 'staging', 'development'] as const).default('production'),
  reproductionSteps: z.string().max(2000).optional().default(''),
  expectedBehavior: z.string().max(1000).optional().default(''),
  actualBehavior: z.string().max(1000).optional().default(''),
  assignedToId: z.string().optional(),
});

const UpdateBugSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().min(5).max(3000).optional(),
  severity: z.enum(['critical', 'major', 'minor', 'cosmetic'] as const).optional(),
  status: z.enum(['open', 'triaged', 'in_progress', 'resolved', 'closed'] as const).optional(),
  environment: z.enum(['production', 'staging', 'development'] as const).optional(),
  reproductionSteps: z.string().max(2000).optional(),
  expectedBehavior: z.string().max(1000).optional(),
  actualBehavior: z.string().max(1000).optional(),
  assignedToId: z.string().optional(),
});

export const getBugs = (req: AuthenticatedRequest, res: Response<ApiResponse<Bug[]>>) => {
  const projectId = req.query.projectId as string | undefined;
  const severity = req.query.severity as BugSeverity | undefined;
  const status = req.query.status as BugStatus | undefined;
  const assignedToId = req.query.assignedToId as string | undefined;

  const bugs = bugService.getBugs({ projectId, severity, status, assignedToId }, req.user);
  res.json({
    success: true,
    data: bugs,
    timestamp: new Date().toISOString(),
  });
};

export const getBugById = (req: AuthenticatedRequest, res: Response<ApiResponse<Bug>>) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const bug = bugService.getBugById(id, req.user);
  if (!bug) {
    return res.status(404).json({
      success: false,
      error: `Bug ticket "${id}" not found or permission denied`,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: bug,
    timestamp: new Date().toISOString(),
  });
};

export const createBug = async (req: AuthenticatedRequest, res: Response<ApiResponse<Bug>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to file bug reports',
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = CreateBugSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  const bug = await bugService.createBug(parseResult.data, req.user);
  res.status(201).json({
    success: true,
    data: bug,
    timestamp: new Date().toISOString(),
  });
};

export const updateBug = async (req: AuthenticatedRequest, res: Response<ApiResponse<Bug>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parseResult = UpdateBugSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  const updated = await bugService.updateBug(id, parseResult.data, req.user);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: `Bug ticket "${id}" not found`,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: updated,
    timestamp: new Date().toISOString(),
  });
};

export const deleteBug = async (req: AuthenticatedRequest, res: Response<ApiResponse<{ id: string }>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const deleted = await bugService.deleteBug(id, req.user);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Bug ticket "${id}" not found`,
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

export const convertBugToTask = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ bug: Bug; task: Task }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const result = await bugService.convertBugToTask(id, req.user);
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to convert bug to task',
      timestamp: new Date().toISOString(),
    });
  }
};

export const getBugStats = (req: AuthenticatedRequest, res: Response<ApiResponse<BugStats>>) => {
  const projectId = req.query.projectId as string | undefined;
  const stats = bugService.getBugStats(projectId, req.user);
  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
};
