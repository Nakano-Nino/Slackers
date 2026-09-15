import { Task, TaskPriority, TaskStatus, SprintStats } from '../types/index.js';
import { dataStore } from './dataStore.js';
import { mongoLogger } from './mongoLogger.js';

class TaskService {
  private activeSprint = {
    id: 'sprint-24',
    name: 'Sprint 24 - Core Platform & Kanban MVP',
    goal: 'Ship real-time team messaging and interactive Kanban sprint tracker',
  };

  private tasks: Task[] = [
    {
      id: 'task-1',
      title: 'Design PostgreSQL schema & Prisma relations',
      description: 'Setup Users, Channels, Messages, Sprints, and Tasks tables with indexes and foreign keys.',
      status: 'done',
      priority: 'high',
      storyPoints: 5,
      tags: ['Backend', 'Postgres', 'Prisma'],
      assigneeId: 'u-1',
      sprintId: 'sprint-24',
      sprintName: 'Sprint 24 - Core Platform & Kanban MVP',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'task-2',
      title: 'Setup MongoDB activity and audit logging service',
      description: 'Stream task status transitions, message events, and sprint progress updates to MongoDB.',
      status: 'done',
      priority: 'medium',
      storyPoints: 3,
      tags: ['Backend', 'MongoDB', 'Logging'],
      assigneeId: 'u-3',
      sprintId: 'sprint-24',
      sprintName: 'Sprint 24 - Core Platform & Kanban MVP',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: 'task-3',
      title: 'Implement drag-and-drop Kanban Board UI',
      description: 'Build responsive columns (Backlog, Todo, In Progress, In Review, Done) with HTML5 drag/drop + quick-move buttons.',
      status: 'in_progress',
      priority: 'urgent',
      storyPoints: 8,
      tags: ['Frontend', 'Kanban', 'Tailwind'],
      assigneeId: 'u-2',
      sprintId: 'sprint-24',
      sprintName: 'Sprint 24 - Core Platform & Kanban MVP',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: 'Connect "Discuss in Chat" action on Kanban cards',
      description: 'Allow team to instantly dispatch a rich task card preview into #engineering or #general chat for fast collaboration.',
      status: 'in_review',
      priority: 'high',
      storyPoints: 3,
      tags: ['Fullstack', 'Integration', 'Chat'],
      assigneeId: 'u-2',
      sprintId: 'sprint-24',
      sprintName: 'Sprint 24 - Core Platform & Kanban MVP',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-5',
      title: 'Add sprint progress bar and velocity calculator',
      description: 'Real-time metrics showing completed vs remaining story points and sprint completion percentage.',
      status: 'todo',
      priority: 'medium',
      storyPoints: 5,
      tags: ['Frontend', 'Analytics'],
      assigneeId: 'u-1',
      sprintId: 'sprint-24',
      sprintName: 'Sprint 24 - Core Platform & Kanban MVP',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-6',
      title: 'Implement WebSocket real-time task notifications',
      description: 'Broadcast task updates and card moves to all active browser sessions without refresh.',
      status: 'backlog',
      priority: 'low',
      storyPoints: 8,
      tags: ['Backend', 'WebSockets', 'Future'],
      assigneeId: 'u-3',
      sprintId: 'sprint-24',
      sprintName: 'Sprint 24 - Core Platform & Kanban MVP',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private enrichTask(task: Task): Task {
    const user = task.assigneeId ? dataStore.getUsers().find((u) => u.id === task.assigneeId) : undefined;
    return {
      ...task,
      assignee: user,
      sprintName: this.activeSprint.name,
    };
  }

  getTasks(filter?: { status?: TaskStatus; assigneeId?: string }): Task[] {
    let result = this.tasks;
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

  async createTask(data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    storyPoints?: number;
    tags?: string[];
    dueDate?: string;
    assigneeId?: string;
    creatorId?: string;
  }): Promise<Task> {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: data.title,
      description: data.description || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      storyPoints: data.storyPoints || 1,
      tags: data.tags || ['Feature'],
      dueDate: data.dueDate,
      assigneeId: data.assigneeId,
      sprintId: this.activeSprint.id,
      sprintName: this.activeSprint.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.push(newTask);

    // MongoDB audit log
    const user = dataStore.getUsers().find((u) => u.id === data.creatorId) || dataStore.getCurrentUser();
    await mongoLogger.log('TASK_CREATED', {
      taskId: newTask.id,
      title: newTask.title,
      status: newTask.status,
      priority: newTask.priority,
      storyPoints: newTask.storyPoints,
    }, user);

    return this.enrichTask(newTask);
  }

  async updateTask(id: string, updates: Partial<Task>, userId?: string): Promise<Task | undefined> {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    const oldTask = this.tasks[index];
    const isStatusChange = updates.status && updates.status !== oldTask.status;

    this.tasks[index] = {
      ...oldTask,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updatedTask = this.tasks[index];
    const user = dataStore.getUsers().find((u) => u.id === userId) || dataStore.getCurrentUser();

    // Log to MongoDB
    if (isStatusChange) {
      await mongoLogger.log('TASK_STATUS_CHANGED', {
        taskId: id,
        fromStatus: oldTask.status,
        toStatus: updates.status,
        taskTitle: oldTask.title,
      }, user);
    } else {
      await mongoLogger.log('TASK_UPDATED', {
        taskId: id,
        changes: updates,
      }, user);
    }

    return this.enrichTask(updatedTask);
  }

  async deleteTask(id: string, userId?: string): Promise<boolean> {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;

    const deleted = this.tasks.splice(index, 1)[0];
    const user = dataStore.getUsers().find((u) => u.id === userId) || dataStore.getCurrentUser();

    await mongoLogger.log('TASK_DELETED', {
      taskId: id,
      title: deleted.title,
    }, user);

    return true;
  }

  getSprintStats(): SprintStats {
    const tasks = this.tasks;
    const totalTasks = tasks.length;
    let totalPoints = 0;
    let completedPoints = 0;

    const tasksByStatus: Record<TaskStatus, number> = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      in_review: 0,
      done: 0,
    };

    for (const t of tasks) {
      totalPoints += t.storyPoints;
      if (t.status === 'done') {
        completedPoints += t.storyPoints;
      }
      if (tasksByStatus[t.status] !== undefined) {
        tasksByStatus[t.status]++;
      }
    }

    const progressPercentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    return {
      sprintName: this.activeSprint.name,
      totalPoints,
      completedPoints,
      progressPercentage,
      tasksByStatus,
      totalTasks,
    };
  }
}

export const taskService = new TaskService();
