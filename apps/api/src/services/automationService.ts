import { AutomationRule, AutomationTrigger, Bug, Task } from '../types/index.js';
import { dataStore } from './dataStore.js';
import { taskService } from './taskService.js';
import { bugService } from './bugService.js';
import { socketService } from './socketService.js';
import { encryptChannelMessageNode } from './webhookCryptoService.js';
import { notificationService } from './notificationService.js';
import { taskCommentService } from './taskCommentService.js';

export interface SmartReferenceResult {
  matchedTasks: Task[];
  matchedBugs: Bug[];
  actionsTaken: string[];
}

class AutomationService {
  /**
   * Parses text (commit messages, PR titles/bodies) for smart issue references like:
   * 'fixes #task-1', 'closes #KAN-101', 'resolves #bug-2', 'wip #task-3', 'refs #task-4'
   */
  async parseAndProcessSmartReferences(
    text: string,
    sourceDetails: {
      authorName?: string;
      commitHash?: string;
      commitUrl?: string;
      prNumber?: number;
      prUrl?: string;
      branch?: string;
      eventType?: 'push' | 'pull_request' | 'generic';
    } = {}
  ): Promise<SmartReferenceResult> {
    const result: SmartReferenceResult = {
      matchedTasks: [],
      matchedBugs: [],
      actionsTaken: [],
    };

    if (!text) return result;

    const regex = /(?:(fixes|close|closes|closed|resolve|resolves|resolved|wip|progress|refs|ref)\s+#?([A-Za-z0-9_-]+))/gi;
    let match: RegExpExecArray | null;

    const actor = dataStore.getCurrentUser();
    const allTasks = taskService.getTasks(undefined, actor);
    const allBugs = bugService.getBugs(undefined, actor);

    while ((match = regex.exec(text)) !== null) {
      const keyword = match[1].toLowerCase();
      const refKey = match[2].toLowerCase();

      // Look up in tasks (match id, or title/tags containing the key)
      const targetTask = allTasks.find(
        (t) =>
          t.id.toLowerCase() === refKey ||
          t.title.toLowerCase().includes(refKey) ||
          t.tags?.some((tag) => tag.toLowerCase() === refKey)
      );

      // Look up in bugs (match id or title containing key)
      const targetBug = allBugs.find(
        (b) => b.id.toLowerCase() === refKey || b.title.toLowerCase().includes(refKey)
      );

      const isFix = ['fixes', 'close', 'closes', 'closed', 'resolve', 'resolves', 'resolved'].includes(
        keyword
      );
      const isWip = ['wip', 'progress'].includes(keyword);

      if (targetTask) {
        if (!result.matchedTasks.some((t) => t.id === targetTask.id)) {
          result.matchedTasks.push(targetTask);
        }

        let newStatus = targetTask.status;
        let actionDesc = '';

        if (isFix) {
          newStatus = 'done';
          actionDesc = `Auto-transitioned task "${targetTask.title}" (${targetTask.id}) to Done via ${keyword} reference`;
        } else if (isWip) {
          newStatus = 'in_progress';
          actionDesc = `Auto-transitioned task "${targetTask.title}" (${targetTask.id}) to In Progress via ${keyword} reference`;
        } else if (sourceDetails.eventType === 'pull_request' && targetTask.status !== 'done') {
          newStatus = 'in_review';
          actionDesc = `Auto-transitioned task "${targetTask.title}" (${targetTask.id}) to In Review via PR #${sourceDetails.prNumber}`;
        }

        if (newStatus !== targetTask.status) {
          const actor = dataStore.getCurrentUser();
          const updated = await taskService.updateTask(targetTask.id, { status: newStatus }, actor);
          if (updated) {
            result.actionsTaken.push(actionDesc);

            // Add activity changelog comment to task
            const author = sourceDetails.authorName || 'Developer';
            const commitInfo = sourceDetails.commitHash
              ? ` (${sourceDetails.commitHash.substring(0, 7)})`
              : '';
            const commentContent = `🤖 **Smart Integration**: ${actionDesc} by ${author}${commitInfo}`;
            try {
              await taskCommentService.addComment(targetTask.id, actor.id, commentContent);
            } catch {
              // ignore comment error
            }
          }
        }
      }

      if (targetBug) {
        if (!result.matchedBugs.some((b) => b.id === targetBug.id)) {
          result.matchedBugs.push(targetBug);
        }

        if (isFix && targetBug.status !== 'resolved' && targetBug.status !== 'closed') {
          const actor = dataStore.getCurrentUser();
          const updatedBug = await bugService.updateBug(targetBug.id, { status: 'resolved' }, actor);
          if (updatedBug) {
            const actionDesc = `Auto-resolved defect "${targetBug.title}" (${targetBug.id}) via ${keyword} reference`;
            result.actionsTaken.push(actionDesc);
          }
        }
      }
    }

    return result;
  }

  /**
   * Event-driven trigger-condition-action workflow runner
   */
  async trigger(
    trigger: AutomationTrigger | string,
    context: Record<string, any>
  ): Promise<string[]> {
    const rules = dataStore.getAutomationRules().filter((r) => r.isActive && r.trigger === trigger);
    const executionLogs: string[] = [];

    for (const rule of rules) {
      if (this.evaluateConditions(rule.conditions, context)) {
        const log = await this.executeActions(rule, context);
        if (log) executionLogs.push(log);
      }
    }

    return executionLogs;
  }

  private evaluateConditions(
    conditions: Record<string, any> | undefined,
    context: Record<string, any>
  ): boolean {
    if (!conditions || Object.keys(conditions).length === 0) return true;

    for (const [key, value] of Object.entries(conditions)) {
      const contextVal = context[key] ?? context.bug?.[key] ?? context.task?.[key];
      if (contextVal === undefined) return false;

      if (typeof value === 'string' && typeof contextVal === 'string') {
        if (contextVal.toLowerCase() !== value.toLowerCase()) return false;
      } else if (contextVal !== value) {
        return false;
      }
    }

    return true;
  }

  private async executeActions(
    rule: AutomationRule,
    context: Record<string, any>
  ): Promise<string> {
    const actions = rule.actions;
    const notes: string[] = [];

    // 1. Post automated bot message to target channel
    if (actions.postMessage) {
      const targetChannelId = actions.postMessage.channelId || 'general';
      const renderedText = this.renderTemplate(actions.postMessage.template, context);

      try {
        const { ciphertext, iv } = encryptChannelMessageNode(renderedText, targetChannelId);
        const botMessage = dataStore.addMessage({
          channelId: targetChannelId,
          ciphertext,
          iv,
          content: renderedText,
          userId: 'u-1',
          botName: `Automation [${rule.name}]`,
          botAvatar: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=150&auto=format&fit=crop&q=80',
          isBot: true,
          botType: 'AUTOMATION',
        });

        socketService.emitNewMessage(targetChannelId, botMessage);
        notes.push(`Posted alert message to #${targetChannelId}`);
      } catch (err) {
        console.warn('⚠️  Failed to post automation message:', (err as Error).message);
      }
    }

    const actor = dataStore.getCurrentUser();

    // 2. Auto-assign task or bug
    if (actions.assignTo) {
      if (context.bugId) {
        await bugService.updateBug(context.bugId, { assignedToId: actions.assignTo }, actor);
        notes.push(`Auto-assigned bug ${context.bugId} to ${actions.assignTo}`);
      }
      if (context.taskId) {
        await taskService.updateTask(context.taskId, { assigneeId: actions.assignTo }, actor);
        notes.push(`Auto-assigned task ${context.taskId} to ${actions.assignTo}`);
      }
    }

    // 3. Update status
    if (actions.updateStatus) {
      if (context.taskId) {
        await taskService.updateTask(context.taskId, { status: actions.updateStatus as any }, actor);
        notes.push(`Auto-updated task ${context.taskId} status to ${actions.updateStatus}`);
      }
      if (context.bugId) {
        await bugService.updateBug(context.bugId, { status: actions.updateStatus as any }, actor);
        notes.push(`Auto-updated bug ${context.bugId} status to ${actions.updateStatus}`);
      }
    }

    // 4. Notifications
    if (actions.notifyUsers && actions.notifyUsers.length > 0) {
      for (const userId of actions.notifyUsers) {
        try {
          notificationService.createNotification({
            recipientId: userId,
            senderId: 'system',
            senderName: 'Slackers Automation',
            type: 'system',
            title: `Automation Alert: ${rule.name}`,
            content: this.renderTemplate(actions.postMessage?.template || rule.name, context),
          });
        } catch {
          // ignore notification error
        }
      }
      notes.push(`Notified ${actions.notifyUsers.length} users`);
    }

    return `Executed rule "${rule.name}": ${notes.join(', ')}`;
  }

  private renderTemplate(template: string, context: Record<string, any>): string {
    return template.replace(/\{([A-Za-z0-9_.]+)\}/g, (_match, path) => {
      const keys = path.split('.');
      let val: any = context;
      for (const k of keys) {
        if (val && typeof val === 'object' && k in val) {
          val = val[k];
        } else {
          return '';
        }
      }
      return val !== undefined ? String(val) : '';
    });
  }
}

export const automationService = new AutomationService();
