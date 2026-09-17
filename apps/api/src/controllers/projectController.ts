import { Response } from 'express';
import { z } from 'zod';
import { projectService } from '../services/projectService.js';
import { taskService } from '../services/taskService.js';
import { ApiResponse, Project, ProjectStats } from '../types/index.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const CreateProjectSchema = z.object({
  name: z.string().min(2).max(100),
  key: z.string().min(2).max(10),
  description: z.string().max(1000).optional().default(''),
  isPrivate: z.boolean().optional().default(false),
  memberIds: z.array(z.string()).optional(),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  isPrivate: z.boolean().optional(),
  memberIds: z.array(z.string()).optional(),
});

export const getProjects = (req: AuthenticatedRequest, res: Response<ApiResponse<Project[]>>) => {
  const projects = projectService.getProjects(req.user);

  // Augment with live task/progress stats
  const augmented = projects.map((p) => {
    const stats = taskService.getProjectStats(p.id, req.user);
    return {
      ...p,
      totalTasks: stats.totalTasks,
      totalPoints: stats.totalPoints,
      completedPoints: stats.completedPoints,
      progressPercentage: stats.progressPercentage,
    };
  });

  res.json({
    success: true,
    data: augmented,
    timestamp: new Date().toISOString(),
  });
};

export const getProjectById = (req: AuthenticatedRequest, res: Response<ApiResponse<Project>>) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const project = projectService.getProjectById(id, req.user);

  if (!project) {
    return res.status(404).json({
      success: false,
      error: `Project "${id}" not found or you do not have permission to view it`,
      timestamp: new Date().toISOString(),
    });
  }

  const stats = taskService.getProjectStats(project.id, req.user);
  const augmented: Project = {
    ...project,
    totalTasks: stats.totalTasks,
    totalPoints: stats.totalPoints,
    completedPoints: stats.completedPoints,
    progressPercentage: stats.progressPercentage,
  };

  res.json({
    success: true,
    data: augmented,
    timestamp: new Date().toISOString(),
  });
};

export const createProject = async (req: AuthenticatedRequest, res: Response<ApiResponse<Project>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = CreateProjectSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const project = await projectService.createProject(parseResult.data, req.user);
    res.status(201).json({
      success: true,
      data: project,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create project',
      timestamp: new Date().toISOString(),
    });
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response<ApiResponse<Project>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const project = projectService.getProjectById(id, req.user);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: `Project "${id}" not found or permission denied`,
      timestamp: new Date().toISOString(),
    });
  }

  const isAdminOrManager = req.user.role === 'admin' || req.user.role === 'manager';
  const isOwner = project.ownerId === req.user.id;
  if (!isAdminOrManager && !isOwner) {
    return res.status(403).json({
      success: false,
      error: 'Only the project owner, workspace administrators, or managers can update project settings or members',
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = UpdateProjectSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  const updated = await projectService.updateProject(id, parseResult.data, req.user);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: `Project "${id}" not found`,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: updated,
    timestamp: new Date().toISOString(),
  });
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response<ApiResponse<{ id: string }>>) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const deleted = await projectService.deleteProject(id, req.user);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: `Project "${id}" not found`,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: { id },
    timestamp: new Date().toISOString(),
  });
};

export const getProjectStats = (req: AuthenticatedRequest, res: Response<ApiResponse<ProjectStats>>) => {
  const projectId = req.params.id ? (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) : undefined;
  const stats = taskService.getProjectStats(projectId, req.user);
  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
};
