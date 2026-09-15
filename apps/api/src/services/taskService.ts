import { ProjectStats, Task, TaskPriority, TaskStatus, User } from '../types/index.js';
import { dataStore } from './dataStore.js';
import { mongoLogger } from './mongoLogger.js';
import { projectService } from './projectService.js';

class TaskService {
  private tasks: Task[] = [
    {
      id: 'task-1',
      projectId: 'proj-core',
      title: 'Design PostgreSQL schema & Prisma relations',
      description: 'Setup Users, Projects, Tasks, Channels, and Messages tables with indexes and foreign keys.',
      status: 'done',
      priority: 'high',
      storyPoints: 5,
      tags: ['Backend', 'Postgres', 'Prisma'],
      assigneeId: 'u-1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'task-2',
      projectId: 'proj-core',
      title: 'Setup MongoDB activity and audit logging service',
      description: 'Stream task status transitions, message events, and project activity updates to MongoDB.',
      status: 'done',
      priority: 'medium',
      storyPoints: 3,
      tags: ['Backend', 'MongoDB', 'Logging'],
      assigneeId: 'u-3',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: 'task-3',
      projectId: 'proj-core',
      title: 'Implement drag-and-drop Kanban Board UI',
      description: 'Build responsive columns (Backlog, Todo, In Progress, In Review, Done) with HTML5 drag/drop + quick-move buttons.',
      status: 'in_progress',
      priority: 'urgent',
      storyPoints: 8,
      tags: ['Frontend', 'Kanban', 'Tailwind'],
      assigneeId: 'u-2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      projectId: 'proj-core',
      title: 'Connect "Discuss in Chat" action on Kanban cards',
      description: 'Allow team to instantly dispatch a rich task card preview into #engineering or #general chat for fast collaboration.',
      status: 'in_review',
      priority: 'high',
      storyPoints: 3,
      tags: ['Fullstack', 'Integration', 'Chat'],
      assigneeId: 'u-2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-5',
      projectId: 'proj-core',
      title: 'Add project progress bar and velocity calculator',
      description: 'Real-time metrics showing completed vs remaining story points and project completion percentage.',
      status: 'todo',
      priority: 'medium',
      storyPoints: 5,
      tags: ['Frontend', 'Analytics'],
      assigneeId: 'u-1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-6',
      projectId: 'proj-core',
      title: 'Implement WebSocket real-time task notifications',
      description: 'Broadcast task updates and card moves to all active browser sessions without refresh.',
      status: 'backlog',
      priority: 'low',
      storyPoints: 8,
      tags: ['Backend', 'WebSockets', 'Future'],
      assigneeId: 'u-3',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Tasks for proj-mobile
    {
      id: 'task-7',
      projectId: 'proj-mobile',
      title: 'Setup React Native / Expo scaffolding',
      description: 'Initialize native workspace with navigation stack, Tailwind NativeWind, and state store.',
      status: 'done',
      priority: 'high',
      storyPoints: 5,
      tags: ['Mobile', 'React Native'],
      assigneeId: 'u-2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'task-8',
      projectId: 'proj-mobile',
      title: 'Offline push notifications with APNS & FCM',
      description: 'Configure device push credentials and background wake-up for channel mentions.',
      status: 'in_progress',
      priority: 'urgent',
      storyPoints: 8,
      tags: ['Mobile', 'Push', 'iOS'],
      assigneeId: 'u-3',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private enrichTask(task: Task): Task {
    const user = task.assigneeId ? dataStore.getUserById(task.assigneeId) : undefined;
    const project = projectService.getProjects().find((p) => p.id === task.projectId);
    return {
      ...task,
      assignee: user,
      projectName: project ? project.name : 'Unknown Project',
    };
  }

  getTasks(filter?: { projectId?: string; status?: TaskStatus; assigneeId?: string }): Task[] {
    let result = this.tasks;
    if (filter?.projectId) {
      result = result.filter((t) => t.projectId === filter.projectId);
    }
    if (filter?.status) {
      result = result.filter((t) => t.status === filter.status);
    }
    if (filter?.assigneeId) {
      result = result.filter((t) => t.assigneeId === filter.assigneeId);
    }
    return result.map((t) => this.enrichTask(t));
  }

  getTaskById(id: string): Task | undefined {
    const task = this.tasks.find((t) => t.id === id);
    return task ? this.enrichTask(task) : undefined;
  }

  async createTask(
    data: {
      projectId: string;
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      storyPoints?: number;
      tags?: string[];
      dueDate?: string;
      assigneeId?: string;
    },
    creator: User
  ): Promise<Task> {
    // RBAC: Viewers cannot create tasks
    if (creator.role === 'viewer') {
      throw new Error('Viewers do not have permission to create tasks');
    }

    // Default to proj-core if not specified
    const projectId = data.projectId || 'proj-core';

    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId,
      title: data.title,
      description: data.description || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      storyPoints: data.storyPoints || 1,
      tags: data.tags || ['Feature'],
      dueDate: data.dueDate,
      assigneeId: data.assigneeId,
      creatorId: creator.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.push(newTask);

    await mongoLogger.log(
      'TASK_CREATED',
      {
        taskId: newTask.id,
        projectId: newTask.projectId,
        title: newTask.title,
        status: newTask.status,
        priority: newTask.priority,
        storyPoints: newTask.storyPoints,
        assignedTo: newTask.assigneeId,
      },
      creator
    );

    return this.enrichTask(newTask);
  }

  async updateTask(
    id: string,
    updates: Partial<Task>,
    actor: User
  ): Promise<Task | undefined> {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    const oldTask = this.tasks[index];

    // RBAC check:
    // Viewers cannot update anything
    if (actor.role === 'viewer') {
      throw new Error('Viewers do not have permission to modify tasks');
    }

    // If changing assignee, storyPoints, or project: only admin or manager allowed
    if ((updates.assigneeId !== undefined && updates.assigneeId !== oldTask.assigneeId) ||
        (updates.storyPoints !== undefined && updates.storyPoints !== oldTask.storyPoints) ||
        (updates.projectId !== undefined && updates.projectId !== oldTask.projectId)) {
      if (actor.role !== 'admin' && actor.role !== 'manager') {
        throw new Error('Only Admins and Managers have permission to reassign or adjust task scope');
      }
    }

    const isStatusChange = updates.status && updates.status !== oldTask.status;

    this.tasks[index] = {
      ...oldTask,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updatedTask = this.tasks[index];

    // MongoDB Log
    if (isStatusChange) {
      await mongoLogger.log(
        'TASK_STATUS_CHANGED',
        {
          taskId: id,
          projectId: oldTask.projectId,
          fromStatus: oldTask.status,
          toStatus: updates.status,
          taskTitle: oldTask.title,
        },
        actor
      );
    } else {
      await mongoLogger.log(
        'TASK_UPDATED',
        {
          taskId: id,
          projectId: oldTask.projectId,
          changes: updates,
        },
        actor
      );
    }

    return this.enrichTask(updatedTask);
  }

  async deleteTask(id: string, actor: User): Promise<boolean> {
    // RBAC: Only Admin and Manager can delete tasks
    if (actor.role !== 'admin' && actor.role !== 'manager') {
      throw new Error('Permission denied. Only Admins and Managers can delete tasks.');
    }

    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;

    const deleted = this.tasks.splice(index, 1)[0];
    await mongoLogger.log(
      'TASK_DELETED',
      {
        taskId: id,
        projectId: deleted.projectId,
        title: deleted.title,
      },
      actor
    );

    return true;
  }

  getProjectStats(projectId?: string): ProjectStats {
    const targetProjectId = projectId || 'proj-core';
    const project = projectService.getProjects().find((p) => p.id === targetProjectId);
    const projectName = project ? project.name : 'All Projects';

    const projectTasks = projectId
      ? this.tasks.filter((t) => t.projectId === projectId)
      : this.tasks;

    const totalTasks = projectTasks.length;
    let totalPoints = 0;
    let completedPoints = 0;

    const tasksByStatus: Record<TaskStatus, number> = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      in_review: 0,
      done: 0,
    };

    for (const t of projectTasks) {
      totalPoints += t.storyPoints;
      if (t.status === 'done') {
        completedPoints += t.storyPoints;
      }
      if (tasksByStatus[t.status] !== undefined) {
        tasksByStatus[t.status]++;
      }
    }

    const progressPercentage =
      totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    return {
      projectId: targetProjectId,
      projectName,
      totalPoints,
      completedPoints,
      progressPercentage,
      tasksByStatus,
      totalTasks,
    };
  }
}

export const taskService = new TaskService();
