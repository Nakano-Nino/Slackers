import { Bug, BugEnvironment, BugSeverity, BugStats, BugStatus, User } from '../types/index.js';
import { dataStore } from './dataStore.js';
import { mongoLogger } from './mongoLogger.js';
import { projectService } from './projectService.js';
import { taskService } from './taskService.js';

class BugService {
  private bugs: Bug[] = [
    {
      id: 'bug-1',
      projectId: 'proj-core',
      title: 'WebSocket disconnect loop on Safari iOS backgrounding',
      description: 'When switching tabs on mobile Safari, socket heartbeats fail to suspend, resulting in 100+ rapid reconnection requests and socket flood.',
      severity: 'critical',
      status: 'in_progress',
      environment: 'production',
      reproductionSteps: '1. Open chat on Safari iOS\n2. Minimize browser for 30s\n3. Re-open tab and inspect network inspector',
      expectedBehavior: 'Socket should pause heartbeat on visibilitychange and reconnect cleanly with exponential backoff.',
      actualBehavior: 'Immediate connection loop triggering HTTP 429 Too Many Requests.',
      reportedById: 'u-3',
      assignedToId: 'u-2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: 'bug-2',
      projectId: 'proj-core',
      title: 'JWT session token header missing on image attachment upload',
      description: 'Attachment upload multipart endpoint rejects valid authenticated users with 401 due to missing Bearer token propagation.',
      severity: 'major',
      status: 'triaged',
      environment: 'staging',
      reproductionSteps: '1. Log in as member\n2. Open #engineering channel\n3. Attach 1.5MB PNG file',
      expectedBehavior: 'Upload completes with 200 OK and generates attachment preview.',
      actualBehavior: 'Upload aborts with 401 Unauthorized.',
      reportedById: 'u-1',
      assignedToId: 'u-3',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'bug-3',
      projectId: 'proj-core',
      title: 'Avatar upload error toast lacks size limit explanation',
      description: 'Uploading image greater than 5MB fails silently without displaying the 5MB file cap constraint to the user.',
      severity: 'minor',
      status: 'open',
      environment: 'production',
      reproductionSteps: '1. Profile settings\n2. Upload 8MB high-res photograph',
      expectedBehavior: 'Display validation error: "File exceeds maximum size of 5MB".',
      actualBehavior: 'Spinner spins indefinitely then resets without message.',
      reportedById: 'u-4',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bug-4',
      projectId: 'proj-core',
      title: 'Sidebar badge text alignment offset on 125% DPI displays',
      description: 'Channel unread pill text is shifted 2px to the top on Windows scaling at 125%.',
      severity: 'cosmetic',
      status: 'resolved',
      environment: 'development',
      reproductionSteps: 'Inspect on Windows 11 Chrome with 125% display scaling.',
      expectedBehavior: 'Badge numbers centered vertically.',
      actualBehavior: 'Numbers clipped slightly at the top border.',
      reportedById: 'u-2',
      assignedToId: 'u-2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: 'bug-5',
      projectId: 'proj-mobile',
      title: 'Push notification sound triggers twice on Android 14',
      description: 'Incoming direct messages trigger both FCM default notification channel and custom in-app sound player.',
      severity: 'major',
      status: 'open',
      environment: 'staging',
      reproductionSteps: '1. Lock Android 14 test device\n2. Send DM from web client',
      expectedBehavior: 'Single audible notification chime.',
      actualBehavior: 'Double echo notification chimes within 200ms.',
      reportedById: 'u-3',
      assignedToId: 'u-2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private enrichBug(bug: Bug): Bug {
    const reporter = dataStore.getUserById(bug.reportedById);
    const assignee = bug.assignedToId ? dataStore.getUserById(bug.assignedToId) : undefined;
    const project = projectService.getProjects().find((p) => p.id === bug.projectId);

    return {
      ...bug,
      reportedBy: reporter,
      assignedTo: assignee,
      projectName: project ? project.name : 'Unknown Project',
    };
  }

  getBugs(filter?: {
    projectId?: string;
    severity?: BugSeverity;
    status?: BugStatus;
    assignedToId?: string;
  }): Bug[] {
    let result = this.bugs;
    if (filter?.projectId) {
      result = result.filter((b) => b.projectId === filter.projectId);
    }
    if (filter?.severity) {
      result = result.filter((b) => b.severity === filter.severity);
    }
    if (filter?.status) {
      result = result.filter((b) => b.status === filter.status);
    }
    if (filter?.assignedToId) {
      result = result.filter((b) => b.assignedToId === filter.assignedToId);
    }
    return result.map((b) => this.enrichBug(b));
  }

  getBugById(id: string): Bug | undefined {
    const bug = this.bugs.find((b) => b.id === id);
    return bug ? this.enrichBug(bug) : undefined;
  }

  async createBug(
    data: {
      projectId: string;
      title: string;
      description: string;
      severity: BugSeverity;
      environment: BugEnvironment;
      reproductionSteps?: string;
      expectedBehavior?: string;
      actualBehavior?: string;
      assignedToId?: string;
    },
    reporter: User
  ): Promise<Bug> {
    const newBug: Bug = {
      id: `bug-${Date.now()}`,
      projectId: data.projectId || 'proj-core',
      title: data.title.trim(),
      description: data.description.trim(),
      severity: data.severity || 'major',
      status: 'open',
      environment: data.environment || 'production',
      reproductionSteps: data.reproductionSteps || '',
      expectedBehavior: data.expectedBehavior || '',
      actualBehavior: data.actualBehavior || '',
      reportedById: reporter.id,
      assignedToId: data.assignedToId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.bugs.unshift(newBug);

    await mongoLogger.log(
      'BUG_REPORTED',
      {
        bugId: newBug.id,
        projectId: newBug.projectId,
        title: newBug.title,
        severity: newBug.severity,
        environment: newBug.environment,
      },
      reporter
    );

    return this.enrichBug(newBug);
  }

  async updateBug(
    id: string,
    updates: Partial<Bug>,
    actor: User
  ): Promise<Bug | undefined> {
    const index = this.bugs.findIndex((b) => b.id === id);
    if (index === -1) return undefined;

    const oldBug = this.bugs[index];
    const isStatusChange = updates.status && updates.status !== oldBug.status;

    this.bugs[index] = {
      ...oldBug,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updatedBug = this.bugs[index];

    if (isStatusChange) {
      await mongoLogger.log(
        'BUG_STATUS_CHANGED',
        {
          bugId: id,
          fromStatus: oldBug.status,
          toStatus: updates.status,
          title: oldBug.title,
        },
        actor
      );
    } else {
      await mongoLogger.log(
        'BUG_UPDATED',
        {
          bugId: id,
          changes: updates,
        },
        actor
      );
    }

    return this.enrichBug(updatedBug);
  }

  async deleteBug(id: string, actor: User): Promise<boolean> {
    // Only Admin and Manager can delete bugs
    if (actor.role !== 'admin' && actor.role !== 'manager') {
      throw new Error('Permission denied. Only Admins and Managers can delete bug tickets.');
    }

    const index = this.bugs.findIndex((b) => b.id === id);
    if (index === -1) return false;

    const deleted = this.bugs.splice(index, 1)[0];
    await mongoLogger.log('BUG_DELETED', { bugId: id, title: deleted.title }, actor);

    return true;
  }

  async convertBugToTask(bugId: string, actor: User) {
    const bug = this.bugs.find((b) => b.id === bugId);
    if (!bug) {
      throw new Error(`Bug ticket "${bugId}" not found`);
    }

    // Map severity to priority and points
    const priority = bug.severity === 'critical' ? 'urgent' : bug.severity === 'major' ? 'high' : 'medium';
    const storyPoints = bug.severity === 'critical' ? 5 : bug.severity === 'major' ? 3 : 2;

    const taskDescription = `${bug.description}\n\n**Reproduction Steps**:\n${bug.reproductionSteps || 'N/A'}\n\n**Expected**:\n${bug.expectedBehavior || 'N/A'}\n\n**Actual**:\n${bug.actualBehavior || 'N/A'}`;

    // Create Kanban task
    const task = await taskService.createTask(
      {
        projectId: bug.projectId,
        title: `[DEFECT] ${bug.title}`,
        description: taskDescription,
        status: 'in_progress',
        priority,
        storyPoints,
        tags: ['Bug', bug.severity, bug.environment],
        assigneeId: bug.assignedToId || actor.id,
      },
      actor
    );

    // Update bug status to 'in_progress' and link taskId (per user request: "yes, it should")
    bug.status = 'in_progress';
    bug.taskId = task.id;
    bug.updatedAt = new Date().toISOString();

    await mongoLogger.log(
      'BUG_CONVERTED_TO_TASK',
      {
        bugId: bug.id,
        taskId: task.id,
        taskTitle: task.title,
      },
      actor
    );

    return {
      bug: this.enrichBug(bug),
      task,
    };
  }

  getBugStats(projectId?: string): BugStats {
    const targetBugs = projectId
      ? this.bugs.filter((b) => b.projectId === projectId)
      : this.bugs;

    const totalBugs = targetBugs.length;
    let openBugs = 0;
    let criticalBugs = 0;
    let resolvedBugs = 0;

    const bySeverity: Record<BugSeverity, number> = {
      critical: 0,
      major: 0,
      minor: 0,
      cosmetic: 0,
    };

    const byStatus: Record<BugStatus, number> = {
      open: 0,
      triaged: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };

    for (const b of targetBugs) {
      if (b.status === 'open' || b.status === 'triaged') {
        openBugs++;
      }
      if (b.status === 'resolved' || b.status === 'closed') {
        resolvedBugs++;
      }
      if (b.severity === 'critical' && b.status !== 'closed' && b.status !== 'resolved') {
        criticalBugs++;
      }

      if (bySeverity[b.severity] !== undefined) {
        bySeverity[b.severity]++;
      }
      if (byStatus[b.status] !== undefined) {
        byStatus[b.status]++;
      }
    }

    const resolutionRate = totalBugs > 0 ? Math.round((resolvedBugs / totalBugs) * 100) : 0;

    return {
      totalBugs,
      openBugs,
      criticalBugs,
      resolvedBugs,
      resolutionRate,
      bySeverity,
      byStatus,
    };
  }
}

export const bugService = new BugService();
