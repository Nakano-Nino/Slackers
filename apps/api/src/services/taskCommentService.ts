import { TaskComment, User } from '../types/index.js';
import { dataStore } from './dataStore.js';
import { mongoLogger } from './mongoLogger.js';
import { prisma } from './db.js';

class TaskCommentService {
  async initFromDb(): Promise<void> {
    try {
      const dbComments = await prisma.taskComment.findMany({
        orderBy: { createdAt: 'asc' },
      });
      this.comments = dbComments.map((c) => ({
        id: c.id,
        taskId: c.taskId,
        userId: c.userId,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
      console.log(`📦 TaskCommentService synchronized with PostgreSQL: ${this.comments.length} comments.`);
    } catch (err: unknown) {
      console.warn('⚠️  TaskCommentService could not load from PostgreSQL:', err instanceof Error ? err.message : err);
    }
  }

  private comments: TaskComment[] = [
    {
      id: 'tc-1',
      taskId: 'task-1',
      userId: 'u-1', // Sarah Connor
      content: 'Database models and migrations tested against local database instance. Indexed on foreign keys for high performance.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'tc-2',
      taskId: 'task-1',
      userId: 'u-3', // Jordan Lee
      content: 'Verified relations for users, channels, and tasks. Schema looks solid!',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    },
    {
      id: 'tc-3',
      taskId: 'task-3',
      userId: 'u-2', // Alex Rivera
      content: 'Kanban drag and drop works smoothly with HTML5 drag events and 1-click fallback arrows.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ];

  private enrichComment(comment: TaskComment): TaskComment {
    const user = dataStore.getUserById(comment.userId);
    return {
      ...comment,
      user: user ? { id: user.id, name: user.name, email: user.email, avatar: user.avatar, status: user.status, role: user.role, developerRole: user.developerRole } : undefined,
    };
  }

  getCommentsByTask(taskId: string): TaskComment[] {
    return this.comments
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((c) => this.enrichComment(c));
  }

  getCommentCountForTask(taskId: string): number {
    return this.comments.filter((c) => c.taskId === taskId).length;
  }

  async addComment(taskId: string, userId: string, content: string): Promise<TaskComment> {
    const user = dataStore.getUserById(userId);
    if (!user) {
      throw new Error(`User with id "${userId}" not found.`);
    }

    if (user.role === 'viewer') {
      throw new Error('Viewers have read-only permissions and cannot comment on tasks.');
    }

    const newComment: TaskComment = {
      id: `tc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      taskId,
      userId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.comments.push(newComment);

    await prisma.taskComment
      .create({
        data: {
          id: newComment.id,
          taskId: newComment.taskId,
          userId: newComment.userId,
          content: newComment.content,
          createdAt: new Date(newComment.createdAt),
          updatedAt: new Date(newComment.updatedAt),
        },
      })
      .catch((err) => console.warn('Failed to persist task comment to PostgreSQL:', err));

    await mongoLogger.log(
      'TASK_COMMENT_ADDED',
      {
        commentId: newComment.id,
        taskId,
        commentSnippet: content.slice(0, 80),
      },
      user
    );

    return this.enrichComment(newComment);
  }

  async deleteComment(commentId: string, actor: User): Promise<boolean> {
    const index = this.comments.findIndex((c) => c.id === commentId);
    if (index === -1) return false;

    const comment = this.comments[index];

    // Allowed if author OR admin OR manager
    if (comment.userId !== actor.id && actor.role !== 'admin' && actor.role !== 'manager') {
      throw new Error('Permission denied: You can only delete your own comments.');
    }

    this.comments.splice(index, 1);

    await prisma.taskComment
      .delete({ where: { id: commentId } })
      .catch((err) => console.warn('Failed to delete task comment in PostgreSQL:', err));

    await mongoLogger.log(
      'TASK_COMMENT_DELETED',
      {
        commentId,
        taskId: comment.taskId,
      },
      actor
    );

    return true;
  }
}

export const taskCommentService = new TaskCommentService();
