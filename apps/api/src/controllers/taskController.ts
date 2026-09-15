import { Request, Response } from 'express';
import { z } from 'zod';
import { taskService } from '../services/taskService.js';
import { ApiResponse, SprintStats, Task, TaskPriority, TaskStatus } from '../types/index.js';

const CreateTaskSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(2000).optional().default(''),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done'] as const).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const).optional().default('medium'),
  storyPoints: z.number().int().min(1).max(21).optional().default(1),
  tags: z.array(z.string()).optional().default(['Feature']),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done'] as const).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const).optional(),
  storyPoints: z.number().int().min(1).max(21).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

export const getTasks = (req: Request, res: Response<ApiResponse<Task[]>>) => {
  const status = req.query.status as TaskStatus | undefined;
  const assigneeId = req.query.assigneeId as string | undefined;

  const tasks = taskService.getTasks({ status, assigneeId });
  res.json({
    success: true,
    data: tasks,
    timestamp: new Date().toISOString(),
  });
};

export const getTaskById = (req: Request, res: Response<ApiResponse<Task>>) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const task = taskService.getTaskById(id);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: `Task "${id}" not found`,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: task,
    timestamp: new Date().toISOString(),
  });
};

export const createTask = async (req: Request, res: Response<ApiResponse<Task>>) => {
  const parseResult = CreateTaskSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  const task = await taskService.createTask(parseResult.data);
  res.status(201).json({
    success: true,
    data: task,
    timestamp: new Date().toISOString(),
  });
};

export const updateTask = async (req: Request, res: Response<ApiResponse<Task>>) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parseResult = UpdateTaskSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  const updated = await taskService.updateTask(id, parseResult.data);
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
};

export const deleteTask = async (req: Request, res: Response<ApiResponse<{ id: string }>>) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const deleted = await taskService.deleteTask(id);
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
};

export const getSprintStats = (req: Request, res: Response<ApiResponse<SprintStats>>) => {
  const stats = taskService.getSprintStats();
  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
};
