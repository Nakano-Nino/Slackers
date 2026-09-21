import { Request, Response } from 'express';
import { webhookService } from '../services/webhookService.js';
import { verifyHmacSha256 } from '../services/webhookCryptoService.js';
import { dataStore } from '../services/dataStore.js';

export const webhookController = {
  // ==========================================
  // Public Webhook Ingestion Handlers
  // ==========================================

  async handleIncomingWebhook(req: Request, res: Response): Promise<void> {
    const token = req.params.token as string;
    const webhook = webhookService.getWebhookByToken(token);

    if (!webhook) {
      res.status(404).json({ success: false, error: 'Invalid or unknown webhook token' });
      return;
    }

    const result = await webhookService.processIncomingWebhook(webhook, req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.json({
      success: true,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
    });
  },

  async handleGitHubWebhook(req: Request, res: Response): Promise<void> {
    const token = req.params.token as string;
    const webhook = webhookService.getWebhookByToken(token);

    if (!webhook) {
      res.status(404).json({ success: false, error: 'Invalid or unknown webhook token' });
      return;
    }

    // HMAC verification if secret is configured
    if (webhook.secret) {
      const signature = req.headers['x-hub-signature-256'] as string;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      if (!verifyHmacSha256(rawBody, signature, webhook.secret)) {
        res.status(401).json({ success: false, error: 'Invalid GitHub HMAC-SHA256 signature' });
        return;
      }
    }

    const event = (req.headers['x-github-event'] as string) || 'push';
    const result = await webhookService.processGitHubWebhook(webhook, event, req.body);

    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.json({
      success: true,
      event,
      messageId: result.messageId,
      actions: result.actions || [],
      timestamp: new Date().toISOString(),
    });
  },

  async handleGitLabWebhook(req: Request, res: Response): Promise<void> {
    const token = req.params.token as string;
    const webhook = webhookService.getWebhookByToken(token);

    if (!webhook) {
      res.status(404).json({ success: false, error: 'Invalid or unknown webhook token' });
      return;
    }

    // GitLab token check if secret configured
    if (webhook.secret) {
      const tokenHeader = req.headers['x-gitlab-token'] as string;
      if (tokenHeader !== webhook.secret) {
        res.status(401).json({ success: false, error: 'Invalid GitLab secret token' });
        return;
      }
    }

    const result = await webhookService.processGitLabWebhook(webhook, req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.json({
      success: true,
      messageId: result.messageId,
      actions: result.actions || [],
      timestamp: new Date().toISOString(),
    });
  },

  // ==========================================
  // Management & Administration Handlers
  // ==========================================

  getWebhooks(_req: Request, res: Response): void {
    const webhooks = webhookService.getWebhooks();
    const sanitized = webhooks.map((w) => ({
      ...w,
      secret: w.secret ? 'whsec_' + '*'.repeat(16) : undefined,
    }));
    res.json({ success: true, data: sanitized });
  },

  createWebhook(req: Request, res: Response): void {
    const { name, channelId, type, avatar, secret } = req.body;
    const user = (req as any).user;

    if (!name || !channelId) {
      res.status(400).json({ success: false, error: 'Webhook name and channelId are required' });
      return;
    }

    const webhook = webhookService.createWebhook({
      name,
      channelId,
      type,
      avatar,
      secret,
      creatorId: user?.id || 'u-1',
    });

    res.status(201).json({ success: true, data: webhook });
  },

  updateWebhook(req: Request, res: Response): void {
    const id = req.params.id as string;
    const updated = webhookService.updateWebhook(id, req.body);

    if (!updated) {
      res.status(404).json({ success: false, error: 'Webhook not found' });
      return;
    }

    res.json({ success: true, data: updated });
  },

  deleteWebhook(req: Request, res: Response): void {
    const id = req.params.id as string;
    const deleted = webhookService.deleteWebhook(id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Webhook not found' });
      return;
    }

    res.json({ success: true, message: 'Webhook deleted successfully' });
  },

  getWebhookLogs(req: Request, res: Response): void {
    const id = req.params.id as string;
    const logs = webhookService.getWebhookLogs(id);
    res.json({ success: true, data: logs });
  },

  async sendTestPing(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const webhook = webhookService.getWebhookById(id);

    if (!webhook) {
      res.status(404).json({ success: false, error: 'Webhook not found' });
      return;
    }

    let result;

    if (webhook.type === 'GITHUB') {
      result = await webhookService.processGitHubWebhook(webhook, 'push', {
        repository: { full_name: 'acme/slackers-core' },
        ref: 'refs/heads/main',
        pusher: { name: 'Sarah Connor' },
        commits: [
          {
            id: '7c8b2f9104d538e1a',
            message: 'feat: add automated CI/CD pipeline notifications\n\nVerified end-to-end webhook delivery',
            url: 'https://github.com/acme/slackers-core/commit/7c8b2f9',
            author: { name: 'Sarah Connor' },
          },
        ],
      });
    } else if (webhook.type === 'GITLAB') {
      result = await webhookService.processGitLabWebhook(webhook, {
        object_kind: 'pipeline',
        project: { name: 'acme/infrastructure' },
        object_attributes: {
          id: 1042,
          ref: 'main',
          status: 'success',
          duration: 48,
          sha: 'https://gitlab.com/acme/infra/pipelines/1042',
        },
      });
    } else {
      result = await webhookService.processIncomingWebhook(webhook, {
        text: '🚀 **Test Ping**: Incoming Webhook is fully functional and delivering to this channel!',
        attachments: [
          {
            title: 'CI/CD Pipeline Status: Green ✅',
            text: 'All 48 unit and integration tests passed in 1.4s.',
            fields: [
              { title: 'Environment', value: 'Production', short: true },
              { title: 'Deployment Target', value: 'AWS us-east-1', short: true },
            ],
            footer: 'Slackers Developer Integrations',
          },
        ],
      });
    }

    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.json({
      success: true,
      message: 'Test ping delivered and decrypted successfully in target channel!',
      messageId: result.messageId,
    });
  },

  // ==========================================
  // Automation Rules Handlers
  // ==========================================

  getAutomationRules(_req: Request, res: Response): void {
    const rules = dataStore.getAutomationRules();
    res.json({ success: true, data: rules });
  },

  createAutomationRule(req: Request, res: Response): void {
    const { name, trigger, conditions, actions } = req.body;

    if (!name || !trigger || !actions) {
      res.status(400).json({ success: false, error: 'Rule name, trigger, and actions are required' });
      return;
    }

    const rule = dataStore.addAutomationRule({
      name,
      trigger,
      conditions: conditions || {},
      actions,
      isActive: true,
    });

    res.status(201).json({ success: true, data: rule });
  },

  updateAutomationRule(req: Request, res: Response): void {
    const id = req.params.id as string;
    const updated = dataStore.updateAutomationRule(id, req.body);

    if (!updated) {
      res.status(404).json({ success: false, error: 'Rule not found' });
      return;
    }

    res.json({ success: true, data: updated });
  },

  deleteAutomationRule(req: Request, res: Response): void {
    const id = req.params.id as string;
    const deleted = dataStore.deleteAutomationRule(id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Rule not found' });
      return;
    }

    res.json({ success: true, message: 'Automation rule deleted successfully' });
  },
};
