import { IncomingWebhookPayload, Webhook, WebhookLog, WebhookType } from '../types/index.js';
import { dataStore } from './dataStore.js';
import { socketService } from './socketService.js';
import { encryptChannelMessageNode, generateWebhookSecret, generateWebhookToken } from './webhookCryptoService.js';
import { automationService } from './automationService.js';

class WebhookService {
  getWebhooks(): Webhook[] {
    return dataStore.getWebhooks();
  }

  getWebhookById(id: string): Webhook | undefined {
    return dataStore.getWebhookById(id);
  }

  getWebhookByToken(token: string): Webhook | undefined {
    return dataStore.getWebhookByToken(token);
  }

  createWebhook(params: {
    name: string;
    channelId: string;
    type?: WebhookType;
    avatar?: string;
    secret?: string;
    creatorId: string;
  }): Webhook {
    const token = generateWebhookToken();
    const secret = params.secret || (params.type === 'GITHUB' || params.type === 'GITLAB' ? generateWebhookSecret() : undefined);

    let defaultAvatar = params.avatar;
    if (!defaultAvatar) {
      if (params.type === 'GITHUB') {
        defaultAvatar = 'https://github.githubassets.com/favicons/favicon.png';
      } else if (params.type === 'GITLAB') {
        defaultAvatar = 'https://gitlab.com/assets/favicon-72a2cad5025aa931d6ea56c3201d1f18e68a8cd39788c7c80d5b2b82aa5143ef.png';
      } else {
        defaultAvatar = 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=150&auto=format&fit=crop&q=80';
      }
    }

    return dataStore.addWebhook({
      name: params.name,
      channelId: params.channelId,
      token,
      secret,
      type: params.type || 'GENERIC',
      avatar: defaultAvatar,
      creatorId: params.creatorId,
      isActive: true,
    });
  }

  updateWebhook(id: string, data: Partial<Webhook>): Webhook | undefined {
    return dataStore.updateWebhook(id, data);
  }

  deleteWebhook(id: string): boolean {
    return dataStore.deleteWebhook(id);
  }

  getWebhookLogs(webhookId: string): WebhookLog[] {
    return dataStore.getWebhookLogs(webhookId);
  }

  /**
   * Process generic incoming webhook (Slack/Discord/Standard text format)
   */
  async processIncomingWebhook(
    webhook: Webhook,
    payload: IncomingWebhookPayload
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const startTime = Date.now();

    try {
      if (!webhook.isActive) {
        throw new Error('Webhook endpoint is deactivated');
      }

      const formattedMarkdown = this.formatGenericPayload(payload);
      if (!formattedMarkdown.trim()) {
        throw new Error('Empty webhook message content');
      }

      // Smart issue keys in incoming text
      await automationService.parseAndProcessSmartReferences(formattedMarkdown, {
        authorName: payload.username || webhook.name,
        eventType: 'generic',
      });

      // Encrypt with channel key
      const { ciphertext, iv } = encryptChannelMessageNode(formattedMarkdown, webhook.channelId);

      const botName = payload.username || payload.botName || webhook.name;
      const botAvatar = payload.icon_url || payload.avatar_url || webhook.avatar;

      const message = dataStore.addMessage({
        channelId: webhook.channelId,
        ciphertext,
        iv,
        content: formattedMarkdown,
        userId: webhook.creatorId,
        botName,
        botAvatar,
        isBot: true,
        botType: webhook.type,
      });

      // Dispatch real-time websocket
      socketService.emitNewMessage(webhook.channelId, message);

      // Log success
      dataStore.addWebhookLog({
        webhookId: webhook.id,
        event: 'incoming.message',
        status: 200,
        payload: typeof payload === 'object' ? payload : { text: String(payload) },
        durationMs: Date.now() - startTime,
      });

      return { success: true, messageId: message.id };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      dataStore.addWebhookLog({
        webhookId: webhook.id,
        event: 'incoming.error',
        status: 400,
        payload: payload,
        error: errorMsg,
        durationMs: Date.now() - startTime,
      });

      return { success: false, error: errorMsg };
    }
  }

  /**
   * Process GitHub Webhook events (push, pull_request, workflow_run)
   */
  async processGitHubWebhook(
    webhook: Webhook,
    event: string,
    payload: Record<string, any>
  ): Promise<{ success: boolean; messageId?: string; actions?: string[]; error?: string }> {
    const startTime = Date.now();
    const actionsTaken: string[] = [];

    try {
      if (!webhook.isActive) {
        throw new Error('Webhook endpoint is deactivated');
      }

      let formattedMarkdown = '';
      const repoName = payload.repository?.full_name || 'Repository';

      if (event === 'push') {
        const branch = (payload.ref || '').replace('refs/heads/', '');
        const pusher = payload.pusher?.name || payload.sender?.login || 'Developer';
        const commits = payload.commits || [];

        formattedMarkdown = `### 📦 GitHub Push to \`${repoName}:${branch}\`\n**Pushed by**: @${pusher} (${commits.length} commit${commits.length === 1 ? '' : 's'})\n\n`;

        for (const c of commits) {
          const shortHash = (c.id || '').substring(0, 7);
          const firstLine = (c.message || '').split('\n')[0];
          formattedMarkdown += `- [\`${shortHash}\`](${c.url}) ${firstLine} — *@${c.author?.name || pusher}*\n`;

          // Smart issue reference execution
          const refRes = await automationService.parseAndProcessSmartReferences(c.message, {
            authorName: c.author?.name || pusher,
            commitHash: c.id,
            commitUrl: c.url,
            branch,
            eventType: 'push',
          });
          actionsTaken.push(...refRes.actionsTaken);
        }

        // Trigger commit pushed automation rules
        await automationService.trigger('COMMIT_PUSHED', {
          repoName,
          branch,
          pusher,
          commits,
        });
      } else if (event === 'pull_request') {
        const pr = payload.pull_request || {};
        const action = payload.action || 'updated';
        const isMerged = pr.merged;
        const author = pr.user?.login || 'Developer';

        const statusEmoji = isMerged ? '💜' : action === 'opened' ? '🟢' : '🔄';
        const actionLabel = isMerged ? 'Merged' : action.charAt(0).toUpperCase() + action.slice(1);

        formattedMarkdown = `### ${statusEmoji} GitHub PR #${pr.number} ${actionLabel}: [${pr.title}](${pr.html_url})\n` +
          `**Author**: @${author} | **Base**: \`${pr.base?.ref}\` ⬅️ **Head**: \`${pr.head?.ref}\`\n\n` +
          (pr.body ? `> ${pr.body.split('\n')[0]}\n` : '');

        // Smart issue reference execution
        const refRes = await automationService.parseAndProcessSmartReferences(
          `${pr.title}\n${pr.body || ''}`,
          {
            authorName: author,
            prNumber: pr.number,
            prUrl: pr.html_url,
            branch: pr.head?.ref,
            eventType: 'pull_request',
          }
        );
        actionsTaken.push(...refRes.actionsTaken);

        if (isMerged) {
          await automationService.trigger('PR_MERGED', { pr, repoName });
        } else if (action === 'opened') {
          await automationService.trigger('PR_OPENED', { pr, repoName });
        }
      } else if (event === 'workflow_run') {
        const run = payload.workflow_run || {};
        const isSuccess = run.conclusion === 'success';
        const emoji = isSuccess ? '✅' : '❌';

        formattedMarkdown = `### ${emoji} GitHub Action: **${run.name}** #${run.run_number} (${run.conclusion || run.status})\n` +
          `**Repo**: \`${repoName}\` | **Branch**: \`${run.head_branch}\`\n` +
          `[View Workflow Run Logs](${run.html_url})`;

        if (!isSuccess && run.conclusion === 'failure') {
          await automationService.trigger('CI_FAILED', {
            workflow: run.name,
            runNumber: run.run_number,
            branch: run.head_branch,
            commit: run.head_sha,
            url: run.html_url,
            repoName,
          });
        }
      } else {
        formattedMarkdown = `### 🔔 GitHub Event: \`${event}\`\n**Repository**: \`${repoName}\`\nActor: @${payload.sender?.login || 'unknown'}`;
      }

      const { ciphertext, iv } = encryptChannelMessageNode(formattedMarkdown, webhook.channelId);

      const message = dataStore.addMessage({
        channelId: webhook.channelId,
        ciphertext,
        iv,
        content: formattedMarkdown,
        userId: webhook.creatorId,
        botName: `GitHub [${repoName}]`,
        botAvatar: 'https://github.githubassets.com/favicons/favicon.png',
        isBot: true,
        botType: 'GITHUB',
      });

      socketService.emitNewMessage(webhook.channelId, message);

      dataStore.addWebhookLog({
        webhookId: webhook.id,
        event: `github.${event}`,
        status: 200,
        payload: { event, repo: repoName, actionsTaken },
        durationMs: Date.now() - startTime,
      });

      return { success: true, messageId: message.id, actions: actionsTaken };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      dataStore.addWebhookLog({
        webhookId: webhook.id,
        event: `github.${event}.error`,
        status: 400,
        payload: { event, error: errorMsg },
        error: errorMsg,
        durationMs: Date.now() - startTime,
      });

      return { success: false, error: errorMsg };
    }
  }

  /**
   * Process GitLab Webhook events (push, merge_request, pipeline)
   */
  async processGitLabWebhook(
    webhook: Webhook,
    payload: Record<string, any>
  ): Promise<{ success: boolean; messageId?: string; actions?: string[]; error?: string }> {
    const startTime = Date.now();
    const actionsTaken: string[] = [];
    const eventKind = payload.object_kind || 'event';

    try {
      if (!webhook.isActive) {
        throw new Error('Webhook endpoint is deactivated');
      }

      let formattedMarkdown = '';
      const projectName = payload.project?.name || payload.project?.path_with_namespace || 'GitLab Project';

      if (eventKind === 'push') {
        const branch = (payload.ref || '').replace('refs/heads/', '');
        const user = payload.user_name || 'Developer';
        const commits = payload.commits || [];

        formattedMarkdown = `### 🦊 GitLab Push to \`${projectName}:${branch}\`\n**By**: ${user} (${commits.length} commits)\n\n`;

        for (const c of commits) {
          const shortHash = (c.id || '').substring(0, 7);
          const firstLine = (c.message || '').split('\n')[0];
          formattedMarkdown += `- [\`${shortHash}\`](${c.url}) ${firstLine} — *${c.author?.name || user}*\n`;

          const refRes = await automationService.parseAndProcessSmartReferences(c.message, {
            authorName: c.author?.name || user,
            commitHash: c.id,
            commitUrl: c.url,
            branch,
            eventType: 'push',
          });
          actionsTaken.push(...refRes.actionsTaken);
        }
      } else if (eventKind === 'merge_request') {
        const mr = payload.object_attributes || {};
        const status = mr.state || 'opened';

        formattedMarkdown = `### 🦊 GitLab MR !${mr.iid} ${status.toUpperCase()}: [${mr.title}](${mr.url})\n` +
          `**Target**: \`${mr.target_branch}\` ⬅️ **Source**: \`${mr.source_branch}\`\n`;

        const refRes = await automationService.parseAndProcessSmartReferences(
          `${mr.title}\n${mr.description || ''}`,
          {
            authorName: payload.user?.name || 'Developer',
            branch: mr.source_branch,
            eventType: 'pull_request',
          }
        );
        actionsTaken.push(...refRes.actionsTaken);
      } else if (eventKind === 'pipeline') {
        const attrs = payload.object_attributes || {};
        const status = attrs.status;
        const isSuccess = status === 'success';

        formattedMarkdown = `### ${isSuccess ? '✅' : '❌'} GitLab Pipeline #${attrs.id}: **${status.toUpperCase()}**\n` +
          `**Ref**: \`${attrs.ref}\` | **Duration**: ${attrs.duration || 0}s\n`;

        if (status === 'failed') {
          await automationService.trigger('CI_FAILED', {
            workflow: `Pipeline #${attrs.id}`,
            branch: attrs.ref,
            url: attrs.sha,
            projectName,
          });
        }
      } else {
        formattedMarkdown = `### 🦊 GitLab Notification: \`${eventKind}\` from **${projectName}**`;
      }

      const { ciphertext, iv } = encryptChannelMessageNode(formattedMarkdown, webhook.channelId);

      const message = dataStore.addMessage({
        channelId: webhook.channelId,
        ciphertext,
        iv,
        content: formattedMarkdown,
        userId: webhook.creatorId,
        botName: `GitLab [${projectName}]`,
        botAvatar: 'https://gitlab.com/assets/favicon-72a2cad5025aa931d6ea56c3201d1f18e68a8cd39788c7c80d5b2b82aa5143ef.png',
        isBot: true,
        botType: 'GITLAB',
      });

      socketService.emitNewMessage(webhook.channelId, message);

      dataStore.addWebhookLog({
        webhookId: webhook.id,
        event: `gitlab.${eventKind}`,
        status: 200,
        payload: { kind: eventKind, project: projectName, actionsTaken },
        durationMs: Date.now() - startTime,
      });

      return { success: true, messageId: message.id, actions: actionsTaken };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      dataStore.addWebhookLog({
        webhookId: webhook.id,
        event: `gitlab.${eventKind}.error`,
        status: 400,
        payload: { kind: eventKind, error: errorMsg },
        error: errorMsg,
        durationMs: Date.now() - startTime,
      });

      return { success: false, error: errorMsg };
    }
  }

  /**
   * Helper to normalize Slack & Discord payload formatting into rich Markdown
   */
  private formatGenericPayload(payload: IncomingWebhookPayload): string {
    let out = '';

    if (payload.text) {
      out += payload.text + '\n\n';
    } else if (payload.content) {
      out += payload.content + '\n\n';
    } else if (payload.message) {
      out += String(payload.message) + '\n\n';
    }

    // Process Slack-style attachments
    if (Array.isArray(payload.attachments)) {
      for (const att of payload.attachments) {
        if (att.pretext) out += `${att.pretext}\n`;
        if (att.title) {
          out += att.title_link ? `**[${att.title}](${att.title_link})**\n` : `**${att.title}**\n`;
        }
        if (att.text) out += `${att.text}\n`;

        if (Array.isArray(att.fields)) {
          for (const field of att.fields) {
            out += `• **${field.title}**: ${field.value}\n`;
          }
        }
        if (att.footer) out += `*${att.footer}*\n`;
        out += '\n';
      }
    }

    // Process Discord-style embeds
    if (Array.isArray(payload.embeds)) {
      for (const emb of payload.embeds) {
        if (emb.title) {
          out += emb.url ? `### [${emb.title}](${emb.url})\n` : `### ${emb.title}\n`;
        }
        if (emb.description) out += `${emb.description}\n`;

        if (Array.isArray(emb.fields)) {
          for (const field of emb.fields) {
            out += `• **${field.name}**: ${field.value}\n`;
          }
        }
        if (emb.footer?.text) out += `*${emb.footer.text}*\n`;
        out += '\n';
      }
    }

    return out.trim();
  }
}

export const webhookService = new WebhookService();
