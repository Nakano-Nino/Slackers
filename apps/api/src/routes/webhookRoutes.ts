import { Router } from 'express';
import { webhookController } from '../controllers/webhookController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { webhookIngestRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// ==========================================
// Public Webhook Ingestion Endpoints (Rate Limited)
// ==========================================
router.post('/incoming/:token', webhookIngestRateLimiter, webhookController.handleIncomingWebhook);
router.post('/github/:token', webhookIngestRateLimiter, webhookController.handleGitHubWebhook);
router.post('/gitlab/:token', webhookIngestRateLimiter, webhookController.handleGitLabWebhook);

// ==========================================
// Authenticated Automation Rules Endpoints
// ==========================================
router.get('/rules/all', authenticate, webhookController.getAutomationRules);
router.post('/rules/create', authenticate, requireRole(['admin', 'manager']), webhookController.createAutomationRule);
router.patch('/rules/:id', authenticate, requireRole(['admin', 'manager']), webhookController.updateAutomationRule);
router.delete('/rules/:id', authenticate, requireRole(['admin', 'manager']), webhookController.deleteAutomationRule);

// ==========================================
// Authenticated Webhook Management Endpoints
// ==========================================
router.get('/', authenticate, webhookController.getWebhooks);
router.post('/', authenticate, requireRole(['admin', 'manager']), webhookController.createWebhook);
router.patch('/:id', authenticate, requireRole(['admin', 'manager']), webhookController.updateWebhook);
router.delete('/:id', authenticate, requireRole(['admin', 'manager']), webhookController.deleteWebhook);
router.get('/:id/logs', authenticate, webhookController.getWebhookLogs);
router.post('/:id/test', authenticate, requireRole(['admin', 'manager']), webhookController.sendTestPing);

export default router;
