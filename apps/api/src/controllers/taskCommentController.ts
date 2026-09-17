import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { taskCommentService } from '../services/taskCommentService.js';
import { taskService } from '../services/taskService.js';
import { ApiResponse, TaskComment } from '../types/index.js';

const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty').max(2000, 'Comment is too long'),
});

export const getTaskComments = (
  req: AuthRequest,
  res: Response<ApiResponse<TaskComment[]>>
) => {
  const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
  const task = taskService.getTaskById(taskId);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: `Task with id "${taskId}" not found`,
      timestamp: new Date().toISOString(),
    });
  }

  const comments = taskCommentService.getCommentsByTask(taskId);
  res.json({
    success: true,
    data: comments,
    timestamp: new Date().toISOString(),
  });
};

export const createTaskComment = async (
  req: AuthRequest,
  res: Response<ApiResponse<TaskComment>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to post comments',
      timestamp: new Date().toISOString(),
    });
  }

  const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
  const task = taskService.getTaskById(taskId);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: `Task with id "${taskId}" not found`,
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = CreateCommentSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const comment = await taskCommentService.addComment(
      taskId,
      req.user.id,
      parseResult.data.content.trim()
    );

    res.status(201).json({
      success: true,
      data: comment,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(403).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to post comment',
      timestamp: new Date().toISOString(),
    });
  }
};

export const deleteTaskComment = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ deleted: boolean }>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const commentId = Array.isArray(req.params.commentId) ? req.params.commentId[0] : req.params.commentId;
  try {
    const deleted = await taskCommentService.deleteComment(commentId, req.user);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Comment with id "${commentId}" not found`,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: { deleted: true },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(403).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete comment',
      timestamp: new Date().toISOString(),
    });
  }
};
