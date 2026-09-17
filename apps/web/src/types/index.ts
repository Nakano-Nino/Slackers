export type UserRole = 'admin' | 'manager' | 'member' | 'viewer';

export type DeveloperRole =
  | 'backend_developer'
  | 'frontend_developer'
  | 'qa_engineer'
  | 'fullstack_developer'
  | 'devops_engineer'
  | 'security_engineer'
  | 'ui_ux_designer'
  | 'mobile_developer'
  | 'data_engineer'
  | 'lead_architect'
  | 'engineering_manager';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type BugSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';
export type BugStatus = 'open' | 'triaged' | 'in_progress' | 'resolved' | 'closed';
export type BugEnvironment = 'production' | 'staging' | 'development';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  publicKey?: string;
  encryptedPrivateKey?: string;
  keyVaultSalt?: string;
  keyVaultIv?: string;
  status: 'online' | 'offline' | 'away';
  role: UserRole;
  developerRole?: DeveloperRole | string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  isPrivate: boolean;
  ownerId: string;
  ownerName?: string;
  memberIds?: string[];
  memberCount?: number;
  totalTasks?: number;
  totalPoints?: number;
  completedPoints?: number;
  progressPercentage?: number;
  totalBugs?: number;
  criticalBugs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  fileKey: string;
  fileIv: string;
  uploadedAt: string;
  uploadedById: string;
}

export type QAStepStatus = 'pending' | 'passed' | 'failed' | 'skipped';

export interface QAReviewStep {
  id: string;
  title: string;
  description?: string;
  status: QAStepStatus;
  notes?: string;
  testedById?: string;
  testedByName?: string;
  testedByAvatar?: string;
  testedAt?: string;
  createdAt: string;
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
  creator?: User;
  commentCount?: number;
  attachments?: TaskAttachment[];
  qaSteps?: QAReviewStep[];
  qaVerdict?: 'pending' | 'passed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface Bug {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  environment: BugEnvironment;
  reproductionSteps?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  reportedById: string;
  reportedBy?: User;
  assignedToId?: string;
  assignedTo?: User;
  taskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BugStats {
  totalBugs: number;
  openBugs: number;
  criticalBugs: number;
  resolvedBugs: number;
  resolutionRate: number;
  bySeverity: Record<BugSeverity, number>;
  byStatus: Record<BugStatus, number>;
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
  ciphertext: string;
  iv: string;
  content?: string;
  decryptedContent?: string;
  taskId?: string;
  bugId?: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  editedAt?: string;
  reactions?: Record<string, string[]>;
  parentId?: string;
  replyCount?: number;
  lastReplyAt?: string;
}

export interface ChannelKey {
  id: string;
  channelId: string;
  userId: string;
  encryptedKey: string;
  iv: string;
  createdAt: string;
}

export interface KeyVaultData {
  publicKey: string;
  encryptedPrivateKey: string;
  keyVaultSalt: string;
  keyVaultIv: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  memberCount: number;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  ciphertext: string;
  iv: string;
  senderCopy?: string;
  isRead?: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  editedAt?: string;
  reactions?: Record<string, string[]>;
  parentId?: string;
  replyCount?: number;
  lastReplyAt?: string;
  sender?: User;
  receiver?: User;
  decryptedContent?: string; // Client-side decrypted plaintext cache
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export type NotificationType = 'message' | 'dm' | 'task_assigned' | 'task_comment';

export interface Notification {
  id: string;
  recipientId: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: {
    type: 'channel' | 'dm' | 'task';
    id: string;
  };
  isRead: boolean;
  createdAt: string;
}

export type MuteDuration = '1_day' | '1_week' | '1_month' | 'forever';

export interface MuteTarget {
  id: string;
  userId: string;
  targetType: 'channel' | 'dm';
  targetId: string;
  targetName?: string;
  mutedUntil: string | null;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface FileAttachment {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  fileKey: string;
  fileIv: string;
  storage?: 'minio' | 'local';
}

export interface Invitation {
  id: string;
  token: string;
  email?: string;
  role: UserRole;
  developerRole?: string;
  invitedById: string;
  invitedByName?: string;
  expiresAt: string;
  isUsed: boolean;
  usedById?: string;
  usedAt?: string;
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
  redis?: {
    status: 'connected' | 'disconnected' | 'disabled';
    latencyMs?: number;
    memoryUsage?: string;
    keysCount?: number;
  };
}
