export type UserRole = 'admin' | 'manager' | 'member' | 'viewer';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  isPrivate: boolean;
  ownerId: string;
  ownerName?: string;
  memberCount?: number;
  totalTasks?: number;
  totalPoints?: number;
  completedPoints?: number;
  progressPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints: number;
  tags: string[];
  dueDate?: string;
  assigneeId?: string;
  assignee?: User;
  creatorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  projectId: string;
  projectName: string;
  totalPoints: number;
  completedPoints: number;
  progressPercentage: number;
  tasksByStatus: Record<TaskStatus, number>;
  totalTasks: number;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  taskId?: string;
  createdAt: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  memberCount: number;
  createdAt: string;
}

export interface ActivityLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  action: string;
  userId?: string;
  userName?: string;
  details: Record<string, unknown>;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  timestamp: string;
  service: string;
  stats?: {
    channelsCount: number;
    usersCount: number;
  };
}
