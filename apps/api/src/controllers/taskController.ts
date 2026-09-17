import { Response } from 'express';
import { z } from 'zod';
import { taskService } from '../services/taskService.js';
import { ApiResponse, ProjectStats, Task, TaskPriority, TaskStatus } from '../types/index.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const CreateTaskSchema = z.object({
  projectId: z.string().min(1).default('proj-core'),
  title: z.string().min(2).max(100),
  description: z.string().max(2000).optional().default(''),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done'] as const).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const).optional().default('medium'),
  storyPoints: z.number().int().min(1).max(21).optional().default(1),
  tags: z.array(z.string()).optional().default(['Feature']),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  qaSteps: z
    .array(
      z.object({
        title: z.string().min(2).max(200),
        description: z.string().max(1000).optional(),
      })
    )
    .optional(),
});

const UpdateTaskSchema = z.object({
  projectId: z.string().optional(),
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done'] as const).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const).optional(),
  storyPoints: z.number().int().min(1).max(21).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

const AddQAStepSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
});

const UpdateQAStepSchema = z.object({
  status: z.enum(['pending', 'passed', 'failed', 'skipped'] as const).optional(),
  notes: z.string().max(2000).optional(),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional(),
});

export const getTasks = (req: AuthenticatedRequest, res: Response<ApiResponse<Task[]>>) => {
  const projectId = req.query.projectId as string | undefined;
  const status = req.query.status as TaskStatus | undefined;
  const assigneeId = req.query.assigneeId as string | undefined;

  const tasks = taskService.getTasks({ projectId, status, assigneeId }, req.user);
  res.json({
    success: true,
    data: tasks,
    timestamp: new Date().toISOString(),
  });
};

export const getTaskById = (req: AuthenticatedRequest, res: Response<ApiResponse<Task>>) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const task = taskService.getTaskById(id, req.user);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: `Task "${id}" not found or permission denied`,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: task,
    timestamp: new Date().toISOString(),
  });
};

export const createTask = async (req: AuthenticatedRequest, res: Response<ApiResponse<Task>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to create tasks',
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = CreateTaskSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const task = await taskService.createTask(parseResult.data, req.user);
    res.status(201).json({
      success: true,
      data: task,
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

export const updateTask = async (req: AuthenticatedRequest, res: Response<ApiResponse<Task>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to modify tasks',
      timestamp: new Date().toISOString(),
    });
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parseResult = UpdateTaskSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const updated = await taskService.updateTask(id, parseResult.data, req.user);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Task "${id}" not found`,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: updated,
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

export const deleteTask = async (req: AuthenticatedRequest, res: Response<ApiResponse<{ id: string }>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to delete tasks',
      timestamp: new Date().toISOString(),
    });
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const deleted = await taskService.deleteTask(id, req.user);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Task "${id}" not found`,
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

export const getProjectStats = (req: AuthenticatedRequest, res: Response<ApiResponse<ProjectStats>>) => {
  const projectId = req.query.projectId as string | undefined;
  const stats = taskService.getProjectStats(projectId, req.user);
  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
};

export const addQAStep = async (req: AuthenticatedRequest, res: Response<ApiResponse<Task>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to add QA review steps',
      timestamp: new Date().toISOString(),
    });
  }

  const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parseResult = AddQAStepSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const task = await taskService.addQAStep(taskId, parseResult.data, req.user);
    res.status(201).json({
      success: true,
      data: task,
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

export const updateQAStep = async (req: AuthenticatedRequest, res: Response<ApiResponse<Task>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to update QA review steps',
      timestamp: new Date().toISOString(),
    });
  }

  const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const stepId = Array.isArray(req.params.stepId) ? req.params.stepId[0] : req.params.stepId;
  const parseResult = UpdateQAStepSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const task = await taskService.updateQAStep(taskId, stepId, parseResult.data, req.user);
    res.json({
      success: true,
      data: task,
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

export const deleteQAStep = async (req: AuthenticatedRequest, res: Response<ApiResponse<Task>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to delete QA review steps',
      timestamp: new Date().toISOString(),
    });
  }

  const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const stepId = Array.isArray(req.params.stepId) ? req.params.stepId[0] : req.params.stepId;

  try {
    const task = await taskService.deleteQAStep(taskId, stepId, req.user);
    res.json({
      success: true,
      data: task,
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
