import http from 'http';
import path from 'path';
import fs from 'fs';
import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import bugRoutes from './routes/bugRoutes.js';
import dmRoutes from './routes/dmRoutes.js';
import logRoutes from './routes/logRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import { dataStore } from './services/dataStore.js';
import { socketService } from './services/socketService.js';
import { connectPostgres } from './services/db.js';
import { seedPostgres } from './services/dbSeed.js';
import { projectService } from './services/projectService.js';
import { taskService } from './services/taskService.js';
import { bugService } from './services/bugService.js';
import { dmService } from './services/dmService.js';
import { taskCommentService } from './services/taskCommentService.js';
import { notificationService } from './services/notificationService.js';
import { memberService } from './services/memberService.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Defense-in-depth HTTP security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Middleware
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);
// Raw binary body parser for zero-knowledge encrypted file uploads
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(morgan('dev'));

// Static files for uploads (avatars, attachments)
const uploadsDir = path.resolve(process.cwd(), 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
app.use(
  '/uploads',
  (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    next();
  },
  express.static(uploadsDir)
);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth/sessions', sessionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/direct-messages', dmRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/webhooks', webhookRoutes);

// Users route (authenticated, cryptographic secrets stripped)
app.get('/api/users', authenticate, (_req: Request, res: Response) => {
  const sanitizedUsers = dataStore.getUsers().map(({ encryptedPrivateKey, keyVaultSalt, keyVaultIv, ...safeUser }) => safeUser);
  res.json({
    success: true,
    data: sanitizedUsers,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/users/me', authenticate, (req: Request, res: Response) => {
  const rawUser = (req as any).user || dataStore.getCurrentUser();
  const {
    passwordHash: _,
    encryptedPrivateKey: __,
    keyVaultSalt: ___,
    keyVaultIv: ____,
    ...safeUser
  } = rawUser;

  res.json({
    success: true,
    data: safeUser,
    timestamp: new Date().toISOString(),
  });
});

// Fallback 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.url}`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// Initialize WebSockets
socketService.init(httpServer, CLIENT_URL);

httpServer.listen(PORT, async () => {
  console.log(`🚀 Slackers API & WebSocket Server running on http://localhost:${PORT}`);
  console.log(`👉 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`👉 Projects: http://localhost:${PORT}/api/projects`);
  console.log(`👉 Tasks & Kanban: http://localhost:${PORT}/api/tasks`);
  console.log(`👉 Bug Tracker: http://localhost:${PORT}/api/bugs`);
  console.log(`👉 Channels & Chat: http://localhost:${PORT}/api/channels`);
  console.log(`👉 MongoDB Audit Logs: http://localhost:${PORT}/api/logs`);

  // Initialize PostgreSQL connection & seed if needed
  const pgOk = await connectPostgres();
  if (pgOk) {
    try {
      if (process.env.SEED_DB === 'true') {
        await seedPostgres();
      } else {
        console.log('ℹ️  Running in clean database mode (SEED_DB=false).');
      }
      await dataStore.initFromDb();
      await projectService.initFromDb();
      await taskService.initFromDb();
      await bugService.initFromDb();
      await dmService.initFromDb();
      await taskCommentService.initFromDb();
      await notificationService.initFromDb();
      await memberService.initFromDb();
      console.log('✅ All services initialized and synchronized with PostgreSQL.');
    } catch (err: unknown) {
      console.warn('⚠️  PostgreSQL initial synchronization error:', err instanceof Error ? err.message : err);
    }
  }
});

export { app, httpServer };
export default app;
