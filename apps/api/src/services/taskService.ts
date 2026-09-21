import { ProjectStats, QAReviewStep, QAStepStatus, Task, TaskPriority, TaskStatus, TaskSubtask, User } from '../types/index.js';
import { dataStore } from './dataStore.js';
import { mongoLogger } from './mongoLogger.js';
import { projectService } from './projectService.js';
import { taskCommentService } from './taskCommentService.js';
import { notificationService } from './notificationService.js';
import { socketService } from './socketService.js';
import { prisma } from './db.js';

class TaskService {
  async initFromDb(): Promise<void> {
    try {
      const dbTasks = await prisma.task.findMany({
        orderBy: { createdAt: 'asc' },
      });
      this.tasks = dbTasks.map((t) => ({
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        description: t.description || '',
        status: t.status.toLowerCase() as TaskStatus,
        priority: t.priority.toLowerCase() as TaskPriority,
        storyPoints: t.storyPoints,
        tags: t.tags || [],
        dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : undefined,
        assigneeId: t.assigneeId || undefined,
        creatorId: t.creatorId || undefined,
        qaSteps: (t.qaSteps as any) || undefined,
        qaVerdict: (t.qaVerdict as any) || undefined,
        subtasks: (t.subtasks as any) || undefined,
        attachments: (t.attachments as any) || undefined,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }));
      console.log(`📦 TaskService synchronized with PostgreSQL: ${this.tasks.length} tasks.`);
    } catch (err: unknown) {
      console.warn('⚠️  TaskService could not load from PostgreSQL:', err instanceof Error ? err.message : err);
    }
  }

  private tasks: Task[] = [
    {
      id: 'task-1',
      projectId: 'proj-core',
      title: 'Design database schema & relations',
      description: 'Setup Users, Projects, Tasks, Channels, and Messages tables with indexes and foreign keys.',
      status: 'done',
      priority: 'high',
      storyPoints: 5,
      tags: ['Backend', 'Database'],
      assigneeId: 'u-1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'task-2',
      projectId: 'proj-core',
      title: 'Setup activity and audit logging service',
      description: 'Stream task status transitions, message events, and project activity updates.',
      status: 'done',
      priority: 'medium',
      storyPoints: 3,
      tags: ['Backend', 'Audit', 'Logging'],
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
      qaSteps: [
        {
          id: 'qa-3-1',
          title: 'Validate column drag and drop reordering',
          description: 'Ensure cards persist new status across column drop targets.',
          status: 'passed',
          notes: 'Smooth 60fps animations verified across modern browsers.',
          testedById: 'u-9',
          testedByName: 'Liam O’Connor',
          testedByAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
          testedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: 'qa-3-2',
          title: 'Optimistic state rollback on network failure',
          description: 'Test network disconnection during card drag; verify card snaps back to previous column.',
          status: 'failed',
          notes: 'Card stays in intermediate drop column if socket handshake times out.',
          testedById: 'u-9',
          testedByName: 'Liam O’Connor',
          testedByAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
          testedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ],
      qaVerdict: 'failed',
      subtasks: [
        { id: 'sub-3-1', title: 'Setup column drop targets and drag sensors', isCompleted: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString() },
        { id: 'sub-3-2', title: 'Implement optimistic card position updates', isCompleted: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString() },
        { id: 'sub-3-3', title: 'Connect Socket.IO task:updated broadcast', isCompleted: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() },
      ],
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
      qaSteps: [
        {
          id: 'qa-4-1',
          title: 'Verify modal channel selector & instant message payload',
          description: 'Check that card preview embeds properly with story points, priority tag, and link.',
          status: 'passed',
          notes: 'Payload verified on both public #general and private #engineering channels.',
          testedById: 'u-9',
          testedByName: 'Liam O’Connor',
          testedByAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
          testedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        },
        {
          id: 'qa-4-2',
          title: 'Verify AES-GCM ciphertext decryption on recipient sessions',
          description: 'Ensure E2EE keys properly resolve for card references in real-time WebSockets.',
          status: 'passed',
          notes: 'Multi-session decrypt verified without latency regressions.',
          testedById: 'u-9',
          testedByName: 'Liam O’Connor',
          testedByAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
          testedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        },
        {
          id: 'qa-4-3',
          title: 'Mobile touch responsiveness on chat embed cards',
          description: 'Validate touch event bubbling and overflow wrapping on iOS Safari & Chrome Mobile.',
          status: 'pending',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        },
      ],
      qaVerdict: 'pending',
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
      assigneeId: 'u-11',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Tasks for proj-ai
    {
      id: 'task-9',
      projectId: 'proj-ai',
      title: 'Train LLM context summarizer for long channel threads',
      description: 'Implement sliding window chunking to summarize 500+ message channel backlogs with cited action items.',
      status: 'in_progress',
      priority: 'high',
      storyPoints: 8,
      tags: ['AI', 'LLM', 'Python'],
      assigneeId: 'u-12',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-10',
      projectId: 'proj-ai',
      title: 'Automated bug-to-task triaging agent',
      description: 'Parse error stack traces from defect logs and automatically classify severity and assignees.',
      status: 'done',
      priority: 'medium',
      storyPoints: 5,
      tags: ['AI', 'Classification'],
      assigneeId: 'u-1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Tasks for proj-cloud
    {
      id: 'task-11',
      projectId: 'proj-cloud',
      title: 'Multi-region Kubernetes deployment with ArgoCD',
      description: 'Configure active-active cluster failover across us-east and eu-central with automatic DNS health-checks.',
      status: 'in_review',
      priority: 'urgent',
      storyPoints: 13,
      tags: ['DevOps', 'K8s', 'Terraform'],
      assigneeId: 'u-8',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Tasks for proj-sec
    {
      id: 'task-12',
      projectId: 'proj-sec',
      title: 'Zero-knowledge WebCrypto vault penetration audit',
      description: 'Perform cryptographic review on PBKDF2 salt derivation, AES-GCM IV nonces, and memory erasure.',
      status: 'done',
      priority: 'urgent',
      storyPoints: 8,
      tags: ['Security', 'Cryptography', 'Audit'],
      assigneeId: 'u-5',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Tasks for proj-ds
    {
      id: 'task-13',
      projectId: 'proj-ds',
      title: 'High-contrast light and dark mode slate palette polish',
      description: 'Audit WCAG AA compliance across text contrast ratios and input border outlines.',
      status: 'done',
      priority: 'medium',
      storyPoints: 5,
      tags: ['Design', 'UI', 'Accessibility'],
      assigneeId: 'u-6',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Tasks for proj-api
    {
      id: 'task-14',
      projectId: 'proj-api',
      title: 'GraphQL subscriptions for real-time Kanban board updates',
      description: 'Implement WebSocket subscriptions for live task drag-and-drop card sync across concurrent users.',
      status: 'todo',
      priority: 'high',
      storyPoints: 5,
      tags: ['GraphQL', 'WebSockets', 'API'],
      assigneeId: 'u-7',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Tasks for proj-data
    {
      id: 'task-15',
      projectId: 'proj-data',
      title: 'Real-time telemetry event bus and throughput dashboard',
      description: 'Stream message send metrics, E2EE handshake latency, and Kanban throughput to ClickHouse.',
      status: 'in_progress',
      priority: 'medium',
      storyPoints: 8,
      tags: ['BigData', 'Telemetry', 'Kafka'],
      assigneeId: 'u-2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private computeQAVerdict(steps?: QAReviewStep[]): 'pending' | 'passed' | 'failed' | undefined {
    if (!steps || steps.length === 0) return undefined;
    if (steps.some((s) => s.status === 'failed')) return 'failed';
    if (steps.every((s) => s.status === 'passed' || s.status === 'skipped') && steps.some((s) => s.status === 'passed')) {
      return 'passed';
    }
    return 'pending';
  }

  constructor() {
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    for (const task of this.tasks) {
      if (!task.dueDate) {
        task.dueDate = oneWeekFromNow;
      }
      if (task.qaSteps && !task.qaVerdict) {
        task.qaVerdict = this.computeQAVerdict(task.qaSteps);
      }
    }
  }

  private enrichTask(task: Task): Task {
    const user = task.assigneeId ? dataStore.getUserById(task.assigneeId) : undefined;
    const creator = task.creatorId ? dataStore.getUserById(task.creatorId) : undefined;
    const project = projectService.getProjectRaw(task.projectId);
    const commentCount = taskCommentService.getCommentCountForTask(task.id);
    return {
      ...task,
      assignee: user,
      creator,
      commentCount,
      projectName: project ? project.name : 'Unknown Project',
    };
  }

  getTasks(
    filter?: { projectId?: string; status?: TaskStatus; assigneeId?: string },
    user?: User
  ): Task[] {
    let result = this.tasks;

    if (filter?.projectId) {
      const proj = projectService.getProjectById(filter.projectId, user);
      if (!proj) return [];
      result = result.filter((t) => t.projectId === filter.projectId);
    } else {
      result = result.filter((t) => !!projectService.getProjectById(t.projectId, user));
    }

    if (filter?.status) {
      result = result.filter((t) => t.status === filter.status);
    }
    if (filter?.assigneeId) {
      result = result.filter((t) => t.assigneeId === filter.assigneeId);
    }
    return result.map((t) => this.enrichTask(t));
  }

  getTaskById(id: string, user?: User): Task | undefined {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return undefined;
    if (!user || !projectService.getProjectById(task.projectId, user)) {
      return undefined;
    }
    return this.enrichTask(task);
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
      qaSteps?: Array<{ title: string; description?: string }>;
    },
    creator: User
  ): Promise<Task> {
    // RBAC: Only Admin and Manager can create tasks (Members cannot create tasks)
    if (creator.role !== 'admin' && creator.role !== 'manager') {
      throw new Error('Permission denied: Only Admins and Managers have permission to create tasks.');
    }

    // Default to proj-core if not specified
    const projectId = data.projectId || 'proj-core';

    // Verify project visibility / access
    const project = projectService.getProjectById(projectId, creator);
    if (!project) {
      throw new Error(`Project "${projectId}" not found or you do not have permission to create tasks in it.`);
    }

    if (data.qaSteps && data.qaSteps.length > 0 && creator.developerRole !== 'qa_engineer') {
      throw new Error('Permission denied: Only QA Engineers can add QA review steps.');
    }

    const initialQaSteps: QAReviewStep[] | undefined =
      data.qaSteps && data.qaSteps.length > 0
        ? data.qaSteps.map((s, idx) => ({
            id: `qa-${Date.now()}-${idx}`,
            title: s.title.trim(),
            description: s.description?.trim() || '',
            status: 'pending' as QAStepStatus,
            createdAt: new Date().toISOString(),
          }))
        : undefined;

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
      qaSteps: initialQaSteps,
      qaVerdict: initialQaSteps ? this.computeQAVerdict(initialQaSteps) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.push(newTask);

    await prisma.task
      .create({
        data: {
          id: newTask.id,
          projectId: newTask.projectId,
          title: newTask.title,
          description: newTask.description,
          status: newTask.status.toUpperCase() as any,
          priority: newTask.priority.toUpperCase() as any,
          storyPoints: newTask.storyPoints,
          tags: newTask.tags,
          dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null,
          assigneeId: newTask.assigneeId || null,
          creatorId: newTask.creatorId || null,
          qaSteps: (newTask.qaSteps as any) || undefined,
          qaVerdict: newTask.qaVerdict || null,
          createdAt: new Date(newTask.createdAt),
          updatedAt: new Date(newTask.updatedAt),
        },
      })
      .catch((err) => console.warn('Failed to persist task to PostgreSQL:', err));

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

    // Notify assignee if not self-assigned
    if (newTask.assigneeId && newTask.assigneeId !== creator.id) {
      notificationService.createNotification({
        recipientId: newTask.assigneeId,
        senderId: creator.id,
        senderName: creator.name,
        senderAvatar: creator.avatar,
        type: 'task_assigned',
        title: 'Task Assigned',
        content: `${creator.name} assigned you to "${newTask.title}" [${newTask.priority.toUpperCase()}]`,
        link: { type: 'task', id: newTask.id },
      });
    }

    const enriched = this.enrichTask(newTask);
    socketService.emitTaskCreated(newTask.projectId, enriched);
    return enriched;
  }

  async updateTask(
    id: string,
    updates: Partial<Task>,
    actor: User
  ): Promise<Task | undefined> {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    const oldTask = this.tasks[index];

    // Check project visibility / permission
    const project = projectService.getProjectById(oldTask.projectId, actor);
    if (!project) {
      throw new Error(`Project "${oldTask.projectId}" not found or permission denied.`);
    }

    if (updates.projectId && updates.projectId !== oldTask.projectId) {
      const targetProj = projectService.getProjectById(updates.projectId, actor);
      if (!targetProj) {
        throw new Error(`Target project "${updates.projectId}" not found or permission denied.`);
      }
    }

    // RBAC check:
    // Viewers cannot update anything
    if (actor.role === 'viewer') {
      throw new Error('Viewers do not have permission to modify tasks');
    }

    const isStatusChange = updates.status && updates.status !== oldTask.status;

    // Moving Kanban card / changing status check:
    // Only the assignee, creator, or Admin can move the task
    if (isStatusChange) {
      const isAssignee = oldTask.assigneeId === actor.id;
      const isCreator = oldTask.creatorId === actor.id;
      const isAdminOrManager = actor.role === 'admin' || actor.role === 'manager';
      if (!isAssignee && !isCreator && !isAdminOrManager) {
        throw new Error('Permission denied: Only the task assignee or creator can move this task on the Kanban board.');
      }
    }

    // If changing assignee, storyPoints, or project: only admin or manager allowed
    if ((updates.assigneeId !== undefined && updates.assigneeId !== oldTask.assigneeId) ||
        (updates.storyPoints !== undefined && updates.storyPoints !== oldTask.storyPoints) ||
        (updates.projectId !== undefined && updates.projectId !== oldTask.projectId)) {
      if (actor.role !== 'admin' && actor.role !== 'manager') {
        throw new Error('Only Admins and Managers have permission to reassign or adjust task scope');
      }
    }

    this.tasks[index] = {
      ...oldTask,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updatedTask = this.tasks[index];

    const dataToUpdate: any = {
      updatedAt: new Date(updatedTask.updatedAt),
    };
    if (updates.title !== undefined) dataToUpdate.title = updates.title;
    if (updates.description !== undefined) dataToUpdate.description = updates.description;
    if (updates.status !== undefined) dataToUpdate.status = updates.status.toUpperCase();
    if (updates.priority !== undefined) dataToUpdate.priority = updates.priority.toUpperCase();
    if (updates.storyPoints !== undefined) dataToUpdate.storyPoints = updates.storyPoints;
    if (updates.tags !== undefined) dataToUpdate.tags = updates.tags;
    if (updates.dueDate !== undefined) dataToUpdate.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    if (updates.assigneeId !== undefined) dataToUpdate.assigneeId = updates.assigneeId || null;
    if (updates.projectId !== undefined) dataToUpdate.projectId = updates.projectId;
    if (updates.qaSteps !== undefined) dataToUpdate.qaSteps = updates.qaSteps as any;
    if (updates.qaVerdict !== undefined) dataToUpdate.qaVerdict = updates.qaVerdict;

    await prisma.task
      .update({
        where: { id },
        data: dataToUpdate,
      })
      .catch((err) => console.warn('Failed to update task in PostgreSQL:', err));

    // Notify if task was assigned or reassigned
    if (updates.assigneeId && updates.assigneeId !== oldTask.assigneeId && updates.assigneeId !== actor.id) {
      notificationService.createNotification({
        recipientId: updates.assigneeId,
        senderId: actor.id,
        senderName: actor.name,
        senderAvatar: actor.avatar,
        type: 'task_assigned',
        title: 'Task Assigned',
        content: `${actor.name} assigned you to "${updatedTask.title}" [${updatedTask.priority.toUpperCase()}]`,
        link: { type: 'task', id: updatedTask.id },
      });
    }

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

    const enriched = this.enrichTask(updatedTask);
    socketService.emitTaskUpdated(updatedTask.projectId, enriched);
    return enriched;
  }

  async deleteTask(id: string, actor: User): Promise<boolean> {
    // RBAC: Only Admin and Manager can delete tasks
    if (actor.role !== 'admin' && actor.role !== 'manager') {
      throw new Error('Permission denied. Only Admins and Managers can delete tasks.');
    }

    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;

    const taskToDelete = this.tasks[index];
    const project = projectService.getProjectById(taskToDelete.projectId, actor);
    if (!project) {
      throw new Error(`Project "${taskToDelete.projectId}" not found or permission denied.`);
    }

    const deleted = this.tasks.splice(index, 1)[0];
    await prisma.task
      .delete({ where: { id } })
      .catch((err) => console.warn('Failed to delete task in PostgreSQL:', err));

    await mongoLogger.log(
      'TASK_DELETED',
      {
        taskId: id,
        projectId: deleted.projectId,
        title: deleted.title,
      },
      actor
    );

    socketService.emitTaskDeleted(deleted.projectId, id);
    return true;
  }

  async addQAStep(
    taskId: string,
    data: { title: string; description?: string },
    actor: User
  ): Promise<Task> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const project = projectService.getProjectById(task.projectId, actor);
    if (!project) {
      throw new Error(`Project "${task.projectId}" not found or permission denied.`);
    }

    if (actor.developerRole !== 'qa_engineer') {
      throw new Error('Permission denied: Only QA Engineers can add QA review steps.');
    }

    const newStep: QAReviewStep = {
      id: `qa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (!task.qaSteps) {
      task.qaSteps = [];
    }
    task.qaSteps.push(newStep);
    task.qaVerdict = this.computeQAVerdict(task.qaSteps);
    task.updatedAt = new Date().toISOString();

    await prisma.task
      .update({
        where: { id: task.id },
        data: {
          qaSteps: task.qaSteps as any,
          qaVerdict: task.qaVerdict || null,
          updatedAt: new Date(task.updatedAt),
        },
      })
      .catch((err) => console.warn('Failed to persist QA step added in PostgreSQL:', err));

    await mongoLogger.log(
      'TASK_QA_STEP_UPDATED',
      {
        taskId: task.id,
        stepId: newStep.id,
        stepTitle: newStep.title,
        action: 'step_added',
      },
      actor
    );

    const enriched = this.enrichTask(task);
    socketService.emitTaskUpdated(task.projectId, enriched);
    return enriched;
  }

  async updateQAStep(
    taskId: string,
    stepId: string,
    updates: {
      status?: QAStepStatus;
      notes?: string;
      title?: string;
      description?: string;
    },
    actor: User
  ): Promise<Task> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const project = projectService.getProjectById(task.projectId, actor);
    if (!project) {
      throw new Error(`Project "${task.projectId}" not found or permission denied.`);
    }

    if (!task.qaSteps || task.qaSteps.length === 0) {
      throw new Error(`Task has no QA steps`);
    }

    const step = task.qaSteps.find((s) => s.id === stepId);
    if (!step) {
      throw new Error(`QA review step "${stepId}" not found`);
    }

    const isQA = actor.developerRole === 'qa_engineer';
    const isAdminOrManager = actor.role === 'admin' || actor.role === 'manager';
    const isAssignee = task.assigneeId === actor.id;
    const isCreator = task.creatorId === actor.id;

    if (actor.role === 'viewer' && !isQA) {
      throw new Error('Viewers do not have permission to update QA review steps.');
    }

    if (updates.status !== undefined && updates.status !== step.status) {
      if (!isQA && !isAdminOrManager && !isAssignee && !isCreator) {
        throw new Error('Only QA Engineers, Admins, Managers, or task assignees can execute QA verification steps.');
      }
      step.status = updates.status;
      if (updates.status === 'pending') {
        step.testedById = undefined;
        step.testedByName = undefined;
        step.testedByAvatar = undefined;
        step.testedAt = undefined;
      } else {
        step.testedById = actor.id;
        step.testedByName = actor.name;
        step.testedByAvatar = actor.avatar;
        step.testedAt = new Date().toISOString();
      }
    }

    if (updates.notes !== undefined) {
      step.notes = updates.notes;
    }
    if (updates.title !== undefined) {
      step.title = updates.title.trim();
    }
    if (updates.description !== undefined) {
      step.description = updates.description.trim() || undefined;
    }

    task.qaVerdict = this.computeQAVerdict(task.qaSteps);
    task.updatedAt = new Date().toISOString();

    await prisma.task
      .update({
        where: { id: task.id },
        data: {
          qaSteps: task.qaSteps as any,
          qaVerdict: task.qaVerdict || null,
          updatedAt: new Date(task.updatedAt),
        },
      })
      .catch((err) => console.warn('Failed to persist QA step updated in PostgreSQL:', err));

    await mongoLogger.log(
      'TASK_QA_STEP_UPDATED',
      {
        taskId: task.id,
        stepId: step.id,
        stepTitle: step.title,
        status: step.status,
        action: 'step_updated',
      },
      actor
    );

    const enriched = this.enrichTask(task);
    socketService.emitTaskUpdated(task.projectId, enriched);
    return enriched;
  }

  async deleteQAStep(
    taskId: string,
    stepId: string,
    actor: User
  ): Promise<Task> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const project = projectService.getProjectById(task.projectId, actor);
    if (!project) {
      throw new Error(`Project "${task.projectId}" not found or permission denied.`);
    }

    if (!task.qaSteps) {
      throw new Error(`Task has no QA steps`);
    }

    const stepIndex = task.qaSteps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) {
      throw new Error(`QA review step "${stepId}" not found`);
    }

    const isQA = actor.developerRole === 'qa_engineer';
    const isAdminOrManager = actor.role === 'admin' || actor.role === 'manager';
    const isCreator = task.creatorId === actor.id;

    if (!isQA && !isAdminOrManager && !isCreator) {
      throw new Error('Permission denied: Only QA Engineers, Admins, Managers, or task creator can remove QA review steps.');
    }

    const removed = task.qaSteps.splice(stepIndex, 1)[0];
    task.qaVerdict = this.computeQAVerdict(task.qaSteps);
    task.updatedAt = new Date().toISOString();

    await prisma.task
      .update({
        where: { id: task.id },
        data: {
          qaSteps: task.qaSteps as any,
          qaVerdict: task.qaVerdict || null,
          updatedAt: new Date(task.updatedAt),
        },
      })
      .catch((err) => console.warn('Failed to persist QA step deleted in PostgreSQL:', err));

    await mongoLogger.log(
      'TASK_QA_STEP_UPDATED',
      {
        taskId: task.id,
        stepId: removed.id,
        stepTitle: removed.title,
        action: 'step_deleted',
      },
      actor
    );

    const enriched = this.enrichTask(task);
    socketService.emitTaskUpdated(task.projectId, enriched);
    return enriched;
  }

  async addSubtask(
    taskId: string,
    title: string,
    actor: User
  ): Promise<Task> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const project = projectService.getProjectById(task.projectId, actor);
    if (!project) {
      throw new Error(`Project "${task.projectId}" not found or permission denied.`);
    }

    const newSubtask: TaskSubtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    if (!task.subtasks) {
      task.subtasks = [];
    }
    task.subtasks.push(newSubtask);
    task.updatedAt = new Date().toISOString();

    await prisma.task
      .update({
        where: { id: task.id },
        data: {
          subtasks: task.subtasks as any,
          updatedAt: new Date(task.updatedAt),
        },
      })
      .catch((err) => console.warn('Failed to persist subtask added in PostgreSQL:', err));

    await mongoLogger.log(
      'TASK_UPDATED',
      {
        taskId: task.id,
        subtaskId: newSubtask.id,
        subtaskTitle: newSubtask.title,
        action: 'subtask_added',
      },
      actor
    );

    const enriched = this.enrichTask(task);
    socketService.emitTaskUpdated(task.projectId, enriched);
    return enriched;
  }

  async updateSubtask(
    taskId: string,
    subtaskId: string,
    updates: { title?: string; isCompleted?: boolean },
    actor: User
  ): Promise<Task> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const project = projectService.getProjectById(task.projectId, actor);
    if (!project) {
      throw new Error(`Project "${task.projectId}" not found or permission denied.`);
    }

    if (!task.subtasks) {
      task.subtasks = [];
    }

    const subtask = task.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) {
      throw new Error(`Subtask "${subtaskId}" not found`);
    }

    if (updates.title !== undefined) {
      subtask.title = updates.title.trim();
    }
    if (updates.isCompleted !== undefined) {
      subtask.isCompleted = updates.isCompleted;
      subtask.completedAt = updates.isCompleted ? new Date().toISOString() : undefined;
    }

    task.updatedAt = new Date().toISOString();

    await prisma.task
      .update({
        where: { id: task.id },
        data: {
          subtasks: task.subtasks as any,
          updatedAt: new Date(task.updatedAt),
        },
      })
      .catch((err) => console.warn('Failed to persist subtask updated in PostgreSQL:', err));

    await mongoLogger.log(
      'TASK_UPDATED',
      {
        taskId: task.id,
        subtaskId: subtask.id,
        subtaskTitle: subtask.title,
        isCompleted: subtask.isCompleted,
        action: 'subtask_updated',
      },
      actor
    );

    const enriched = this.enrichTask(task);
    socketService.emitTaskUpdated(task.projectId, enriched);
    return enriched;
  }

  async deleteSubtask(
    taskId: string,
    subtaskId: string,
    actor: User
  ): Promise<Task> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const project = projectService.getProjectById(task.projectId, actor);
    if (!project) {
      throw new Error(`Project "${task.projectId}" not found or permission denied.`);
    }

    if (!task.subtasks) {
      task.subtasks = [];
    }

    const index = task.subtasks.findIndex((s) => s.id === subtaskId);
    if (index === -1) {
      throw new Error(`Subtask "${subtaskId}" not found`);
    }

    const removed = task.subtasks.splice(index, 1)[0];
    task.updatedAt = new Date().toISOString();

    await prisma.task
      .update({
        where: { id: task.id },
        data: {
          subtasks: task.subtasks as any,
          updatedAt: new Date(task.updatedAt),
        },
      })
      .catch((err) => console.warn('Failed to persist subtask deleted in PostgreSQL:', err));

    await mongoLogger.log(
      'TASK_UPDATED',
      {
        taskId: task.id,
        subtaskId: removed.id,
        subtaskTitle: removed.title,
        action: 'subtask_deleted',
      },
      actor
    );

    const enriched = this.enrichTask(task);
    socketService.emitTaskUpdated(task.projectId, enriched);
    return enriched;
  }

  getProjectStats(projectId?: string, user?: User): ProjectStats {
    const targetProjectId = projectId || 'proj-core';
    const project = projectService.getProjectRaw(targetProjectId);
    const projectName = project ? project.name : 'All Projects';

    if (projectId && user) {
      const hasAccess = projectService.getProjectById(projectId, user);
      if (!hasAccess) {
        return {
          projectId: targetProjectId,
          projectName: 'Restricted Project',
          totalPoints: 0,
          completedPoints: 0,
          progressPercentage: 0,
          tasksByStatus: { backlog: 0, todo: 0, in_progress: 0, in_review: 0, done: 0 },
          totalTasks: 0,
        };
      }
    }

    const projectTasks = projectId
      ? this.tasks.filter((t) => t.projectId === projectId)
      : this.tasks.filter((t) => !!projectService.getProjectById(t.projectId, user));

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
