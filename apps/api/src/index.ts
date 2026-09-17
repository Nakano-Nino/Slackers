import http from 'http';
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
import { dataStore } from './services/dataStore.js';
import { socketService } from './services/socketService.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Middleware
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);
// Raw binary body parser for zero-knowledge encrypted file uploads
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

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

// Users route
app.get('/api/users', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: dataStore.getUsers(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/users/me', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: dataStore.getCurrentUser(),
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

httpServer.listen(PORT, () => {
  console.log(`🚀 Slackers API & WebSocket Server running on http://localhost:${PORT}`);
  console.log(`👉 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`👉 Projects: http://localhost:${PORT}/api/projects`);
  console.log(`👉 Tasks & Kanban: http://localhost:${PORT}/api/tasks`);
  console.log(`👉 Bug Tracker: http://localhost:${PORT}/api/bugs`);
  console.log(`👉 Channels & Chat: http://localhost:${PORT}/api/channels`);
  console.log(`👉 MongoDB Audit Logs: http://localhost:${PORT}/api/logs`);
});

export { app, httpServer };
export default app;
