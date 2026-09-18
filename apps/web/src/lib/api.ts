import {
  ActivityLog,
  ApiResponse,
  AuthResponse,
  Bug,
  BugStats,
  Channel,
  ChannelKey,
  DirectMessage,
  HealthStatus,
  Invitation,
  KeyVaultData,
  Message,
  MuteDuration,
  MuteTarget,
  Notification,
  Project,
  ProjectStats,
  QAReviewStep,
  QAStepStatus,
  Task,
  TaskComment,
  User,
  UserRole,
  UserSession,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const TOKEN_KEY = 'slackers_auth_token';

export const authStorage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },
  clearToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
};

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = authStorage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }
    return data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(String(err));
  }
}

export const api = {
  getHealth: async (): Promise<HealthStatus> => {
    return fetchJson<HealthStatus>('/api/health');
  },

  // Authentication
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await fetchJson<ApiResponse<AuthResponse>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (!res.data) throw new Error('Login failed');
    authStorage.setToken(res.data.token);
    return res.data;
  },

  register: async (data: { name: string; email: string; password: string; developerRole?: string }): Promise<AuthResponse> => {
    const res = await fetchJson<ApiResponse<AuthResponse>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Registration failed');
    authStorage.setToken(res.data.token);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await fetchJson<ApiResponse<User>>('/api/auth/me');
    if (!res.data) throw new Error('Failed to fetch profile');
    return res.data;
  },

  updateProfile: async (data: {
    name?: string;
    email?: string;
    avatar?: string;
    developerRole?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<AuthResponse> => {
    const res = await fetchJson<ApiResponse<AuthResponse>>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to update profile');
    if (res.data.token) {
      authStorage.setToken(res.data.token);
    }
    return res.data;
  },

  uploadAvatar: async (imageData: string): Promise<{ avatarUrl: string; user: User }> => {
    const res = await fetchJson<ApiResponse<{ avatarUrl: string; user: User }>>('/api/auth/avatar', {
      method: 'POST',
      body: JSON.stringify({ image: imageData }),
    });
    if (!res.data) throw new Error('Failed to upload avatar');
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      const token = authStorage.getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }).catch((err) => {
          console.warn('Backend logout call notice:', err);
        });
      }
    } finally {
      authStorage.clearToken();
    }
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const res = await fetchJson<ApiResponse<Project[]>>('/api/projects');
    return res.data || [];
  },

  getProject: async (id: string): Promise<Project> => {
    const res = await fetchJson<ApiResponse<Project>>(`/api/projects/${id}`);
    if (!res.data) throw new Error('Project not found');
    return res.data;
  },

  createProject: async (data: {
    name: string;
    key: string;
    description?: string;
    isPrivate?: boolean;
    memberIds?: string[];
  }): Promise<Project> => {
    const res = await fetchJson<ApiResponse<Project>>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to create project');
    return res.data;
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<Project> => {
    const res = await fetchJson<ApiResponse<Project>>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to update project');
    return res.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await fetchJson<ApiResponse<{ id: string }>>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },

  getProjectStats: async (projectId?: string): Promise<ProjectStats> => {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const res = await fetchJson<ApiResponse<ProjectStats>>(`/api/tasks/stats${query}`);
    if (!res.data) throw new Error('Failed to fetch project stats');
    return res.data;
  },

  // Channels
  getChannels: async (): Promise<Channel[]> => {
    const res = await fetchJson<ApiResponse<Channel[]>>('/api/channels');
    return res.data || [];
  },

  createChannel: async (data: { name: string; description?: string; isPrivate?: boolean }): Promise<Channel> => {
    const res = await fetchJson<ApiResponse<Channel>>('/api/channels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to create channel');
    return res.data;
  },

  saveChannelKey: async (channelId: string, data: { encryptedKey: string; iv: string }): Promise<ChannelKey> => {
    const res = await fetchJson<ApiResponse<ChannelKey>>(`/api/channels/${channelId}/keys`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to save channel key');
    return res.data;
  },

  getChannelKey: async (channelId: string): Promise<ChannelKey | null> => {
    const res = await fetchJson<ApiResponse<ChannelKey | null>>(`/api/channels/${channelId}/key`);
    return res.data || null;
  },

  // Messages
  getMessages: async (channelId: string): Promise<Message[]> => {
    const res = await fetchJson<ApiResponse<Message[]>>(`/api/messages/channel/${channelId}`);
    return res.data || [];
  },

  sendMessage: async (data: {
    channelId: string;
    ciphertext: string;
    iv: string;
    content?: string;
    userId?: string;
    taskId?: string;
    bugId?: string;
    parentId?: string;
  }): Promise<Message> => {
    const res = await fetchJson<ApiResponse<Message>>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to send message');
    return res.data;
  },

  getThreadReplies: async (parentId: string): Promise<Message[]> => {
    const res = await fetchJson<ApiResponse<Message[]>>(`/api/messages/thread/${parentId}`);
    return res.data || [];
  },

  toggleMessageReaction: async (messageId: string, emoji: string): Promise<Message> => {
    const res = await fetchJson<ApiResponse<Message>>(`/api/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
    if (!res.data) throw new Error('Failed to toggle reaction');
    return res.data;
  },

  editMessage: async (messageId: string, ciphertext: string, iv: string): Promise<Message> => {
    const res = await fetchJson<ApiResponse<Message>>(`/api/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ ciphertext, iv }),
    });
    if (!res.data) throw new Error('Failed to edit message');
    return res.data;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await fetchJson<ApiResponse<{ messageId: string }>>(`/api/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await fetchJson<ApiResponse<User[]>>('/api/users');
    return res.data || [];
  },

  // Tasks & Kanban
  getTasks: async (filter?: { projectId?: string; status?: string; assigneeId?: string }): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.set('projectId', filter.projectId);
    if (filter?.status) params.set('status', filter.status);
    if (filter?.assigneeId) params.set('assigneeId', filter.assigneeId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchJson<ApiResponse<Task[]>>(`/api/tasks${query}`);
    return res.data || [];
  },

  createTask: async (data: {
    projectId: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    storyPoints?: number;
    tags?: string[];
    dueDate?: string;
    assigneeId?: string;
    qaSteps?: Array<{ title: string; description?: string }>;
  }): Promise<Task> => {
    const res = await fetchJson<ApiResponse<Task>>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to create task');
    return res.data;
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
    const res = await fetchJson<ApiResponse<Task>>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (!res.data) throw new Error('Failed to update task');
    return res.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await fetchJson<ApiResponse<{ id: string }>>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  // QA Review Steps
  addQAStep: async (taskId: string, data: { title: string; description?: string }): Promise<Task> => {
    const res = await fetchJson<ApiResponse<Task>>(`/api/tasks/${taskId}/qa-steps`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to add QA step');
    return res.data;
  },

  updateQAStep: async (
    taskId: string,
    stepId: string,
    data: {
      status?: QAStepStatus;
      notes?: string;
      title?: string;
      description?: string;
    }
  ): Promise<Task> => {
    const res = await fetchJson<ApiResponse<Task>>(`/api/tasks/${taskId}/qa-steps/${stepId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to update QA step');
    return res.data;
  },

  deleteQAStep: async (taskId: string, stepId: string): Promise<Task> => {
    const res = await fetchJson<ApiResponse<Task>>(`/api/tasks/${taskId}/qa-steps/${stepId}`, {
      method: 'DELETE',
    });
    if (!res.data) throw new Error('Failed to delete QA step');
    return res.data;
  },

  // Bugs & Defect Tracking
  getBugs: async (filter?: {
    projectId?: string;
    severity?: string;
    status?: string;
    assignedToId?: string;
  }): Promise<Bug[]> => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.set('projectId', filter.projectId);
    if (filter?.severity) params.set('severity', filter.severity);
    if (filter?.status) params.set('status', filter.status);
    if (filter?.assignedToId) params.set('assignedToId', filter.assignedToId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchJson<ApiResponse<Bug[]>>(`/api/bugs${query}`);
    return res.data || [];
  },

  getBug: async (id: string): Promise<Bug> => {
    const res = await fetchJson<ApiResponse<Bug>>(`/api/bugs/${id}`);
    if (!res.data) throw new Error('Bug not found');
    return res.data;
  },

  createBug: async (data: {
    projectId: string;
    title: string;
    description: string;
    severity: string;
    environment: string;
    reproductionSteps?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    assignedToId?: string;
  }): Promise<Bug> => {
    const res = await fetchJson<ApiResponse<Bug>>('/api/bugs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to report bug');
    return res.data;
  },

  updateBug: async (id: string, updates: Partial<Bug>): Promise<Bug> => {
    const res = await fetchJson<ApiResponse<Bug>>(`/api/bugs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (!res.data) throw new Error('Failed to update bug');
    return res.data;
  },

  deleteBug: async (id: string): Promise<void> => {
    await fetchJson<ApiResponse<{ id: string }>>(`/api/bugs/${id}`, {
      method: 'DELETE',
    });
  },

  convertBugToTask: async (bugId: string): Promise<{ bug: Bug; task: Task }> => {
    const res = await fetchJson<ApiResponse<{ bug: Bug; task: Task }>>(`/api/bugs/${bugId}/convert-to-task`, {
      method: 'POST',
    });
    if (!res.data) throw new Error('Failed to convert bug to task');
    return res.data;
  },

  getBugStats: async (projectId?: string): Promise<BugStats> => {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const res = await fetchJson<ApiResponse<BugStats>>(`/api/bugs/stats${query}`);
    if (!res.data) throw new Error('Failed to fetch bug stats');
    return res.data;
  },

  // Direct Messages (End-to-End Encrypted)
  getDirectMessages: async (partnerId: string): Promise<DirectMessage[]> => {
    const res = await fetchJson<ApiResponse<DirectMessage[]>>(`/api/direct-messages/${partnerId}`);
    return res.data || [];
  },

  getDmUnreadCounts: async (): Promise<Record<string, number>> => {
    const res = await fetchJson<ApiResponse<Record<string, number>>>('/api/direct-messages/unread-counts');
    return res.data || {};
  },

  markDirectMessagesAsRead: async (partnerId: string): Promise<{ markedCount: number }> => {
    const res = await fetchJson<ApiResponse<{ markedCount: number }>>(`/api/direct-messages/${partnerId}/read`, {
      method: 'PATCH',
    });
    return res.data || { markedCount: 0 };
  },

  sendDirectMessage: async (data: {
    receiverId: string;
    ciphertext: string;
    iv: string;
    senderCopy?: string;
  }): Promise<DirectMessage> => {
    const res = await fetchJson<ApiResponse<DirectMessage>>('/api/direct-messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to send direct message');
    return res.data;
  },

  getDirectConversations: async (): Promise<{ user: User; lastMessage: DirectMessage }[]> => {
    const res = await fetchJson<ApiResponse<{ user: User; lastMessage: DirectMessage }[]>>(
      '/api/direct-messages/conversations'
    );
    return res.data || [];
  },

  toggleDmReaction: async (messageId: string, emoji: string): Promise<DirectMessage> => {
    const res = await fetchJson<ApiResponse<DirectMessage>>(`/api/direct-messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
    if (!res.data) throw new Error('Failed to toggle DM reaction');
    return res.data;
  },

  editDirectMessage: async (
    messageId: string,
    ciphertext: string,
    iv: string,
    senderCopy?: string
  ): Promise<DirectMessage> => {
    const res = await fetchJson<ApiResponse<DirectMessage>>(`/api/direct-messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ ciphertext, iv, senderCopy }),
    });
    if (!res.data) throw new Error('Failed to edit direct message');
    return res.data;
  },

  deleteDirectMessage: async (messageId: string): Promise<void> => {
    await fetchJson<ApiResponse<{ messageId: string }>>(`/api/direct-messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  registerPublicKey: async (publicKey: string): Promise<boolean> => {
    const res = await fetchJson<ApiResponse<{ updated: boolean }>>('/api/direct-messages/public-key', {
      method: 'POST',
      body: JSON.stringify({ publicKey }),
    });
    return !!res.data?.updated;
  },

  getUserPublicKey: async (userId: string): Promise<string | null> => {
    const res = await fetchJson<ApiResponse<{ publicKey: string | null }>>(
      `/api/direct-messages/public-key/${userId}`
    );
    return res.data?.publicKey || null;
  },

  saveKeyVault: async (vault: KeyVaultData): Promise<boolean> => {
    const res = await fetchJson<ApiResponse<{ updated: boolean }>>('/api/direct-messages/key-vault', {
      method: 'POST',
      body: JSON.stringify(vault),
    });
    return !!res.data?.updated;
  },

  getKeyVault: async (): Promise<KeyVaultData | null> => {
    const res = await fetchJson<ApiResponse<KeyVaultData | null>>('/api/direct-messages/key-vault');
    return res.data || null;
  },

  // Task Comments
  getTaskComments: async (taskId: string): Promise<TaskComment[]> => {
    const res = await fetchJson<ApiResponse<TaskComment[]>>(`/api/tasks/${taskId}/comments`);
    return res.data || [];
  },

  createTaskComment: async (taskId: string, content: string): Promise<TaskComment> => {
    const res = await fetchJson<ApiResponse<TaskComment>>(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    if (!res.data) throw new Error('Failed to post task comment');
    return res.data;
  },

  deleteTaskComment: async (taskId: string, commentId: string): Promise<void> => {
    await fetchJson<ApiResponse<{ deleted: boolean }>>(`/api/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  // Logs
  getLogs: async (limit = 50): Promise<{ data: ActivityLog[]; mongoConnected: boolean }> => {
    return fetchJson<{ data: ActivityLog[]; mongoConnected: boolean }>(`/api/logs?limit=${limit}`);
  },

  // Notifications
  getNotifications: async (): Promise<{ notifications: Notification[]; unreadCount: number }> => {
    const res = await fetchJson<ApiResponse<{ notifications: Notification[]; unreadCount: number }>>('/api/notifications');
    return res.data || { notifications: [], unreadCount: 0 };
  },

  markNotificationAsRead: async (id: string): Promise<boolean> => {
    const res = await fetchJson<ApiResponse<{ updated: boolean }>>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return !!res.data?.updated;
  },

  markAllNotificationsAsRead: async (): Promise<number> => {
    const res = await fetchJson<ApiResponse<{ count: number }>>('/api/notifications/read-all', {
      method: 'PATCH',
    });
    return res.data?.count || 0;
  },

  deleteNotification: async (id: string): Promise<boolean> => {
    const res = await fetchJson<ApiResponse<{ deleted: boolean }>>(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
    return !!res.data?.deleted;
  },

  // Mute Notifications
  getMutedTargets: async (): Promise<MuteTarget[]> => {
    const res = await fetchJson<ApiResponse<MuteTarget[]>>('/api/notifications/mutes');
    return res.data || [];
  },

  muteTarget: async (
    targetType: 'channel' | 'dm',
    targetId: string,
    duration: MuteDuration,
    targetName?: string
  ): Promise<MuteTarget | null> => {
    const res = await fetchJson<ApiResponse<MuteTarget>>('/api/notifications/mute', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId, duration, targetName }),
    });
    return res.data || null;
  },

  unmuteTarget: async (targetType: 'channel' | 'dm', targetId: string): Promise<boolean> => {
    const res = await fetchJson<ApiResponse<{ unmuted: boolean }>>(
      `/api/notifications/mute/${targetType}/${targetId}`,
      {
        method: 'DELETE',
      }
    );
    return !!res.data?.unmuted;
  },

  // Multi-Device Sessions
  getSessions: async (): Promise<UserSession[]> => {
    const res = await fetchJson<ApiResponse<UserSession[]>>('/api/auth/sessions');
    return res.data || [];
  },

  revokeSession: async (sessionId: string): Promise<boolean> => {
    const res = await fetchJson<ApiResponse<{ revoked: boolean }>>(`/api/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    return !!res.data?.revoked;
  },

  revokeOtherSessions: async (): Promise<number> => {
    const res = await fetchJson<ApiResponse<{ revokedCount: number }>>('/api/auth/sessions/revoke-others', {
      method: 'POST',
    });
    return res.data?.revokedCount || 0;
  },

  // Zero-Knowledge Encrypted File Attachments
  uploadEncryptedFile: async (
    encryptedBlob: Blob,
    originalName: string,
    mimeType: string
  ): Promise<{ fileId: string; fileUrl: string; originalName: string; mimeType: string; size: number; storage: string }> => {
    const url = `${API_BASE_URL}/api/files/upload`;
    const token = authStorage.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
      'x-file-name': encodeURIComponent(originalName),
      'x-file-type': mimeType,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: encryptedBlob,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to upload encrypted file');
    return json.data;
  },

  downloadEncryptedFile: async (fileId: string): Promise<ArrayBuffer> => {
    const url = `${API_BASE_URL}/api/files/${fileId}`;
    const token = authStorage.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Failed to download encrypted file (${res.status})`);
    return await res.arrayBuffer();
  },

  // Member & Invitation Management
  addMember: async (data: {
    name: string;
    email: string;
    password?: string;
    role?: UserRole;
    developerRole?: string;
  }): Promise<{ user: User; tempPassword?: string }> => {
    const res = await fetchJson<ApiResponse<{ user: User; tempPassword?: string }>>('/api/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error(res.error || 'Failed to add member');
    return res.data;
  },

  createInvitation: async (data: {
    email?: string;
    role?: UserRole;
    developerRole?: string;
    expiresInDays?: number;
  }): Promise<Invitation> => {
    const res = await fetchJson<ApiResponse<Invitation>>('/api/members/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error(res.error || 'Failed to generate invitation');
    return res.data;
  },

  getInvitations: async (): Promise<Invitation[]> => {
    const res = await fetchJson<ApiResponse<Invitation[]>>('/api/members/invitations');
    return res.data || [];
  },

  revokeInvitation: async (id: string): Promise<void> => {
    await fetchJson<ApiResponse<{ id: string }>>(`/api/members/invitations/${id}`, {
      method: 'DELETE',
    });
  },

  verifyInvitation: async (token: string): Promise<{ valid: boolean; invitation?: Partial<Invitation> }> => {
    const res = await fetchJson<ApiResponse<{ valid: boolean; invitation?: Partial<Invitation> }>>(
      `/api/members/invitations/verify/${encodeURIComponent(token)}`
    );
    if (!res.data) throw new Error(res.error || 'Invalid invitation');
    return res.data;
  },

  acceptInvitation: async (data: {
    token: string;
    name: string;
    email?: string;
    password: string;
    developerRole?: string;
  }): Promise<AuthResponse> => {
    const res = await fetchJson<ApiResponse<AuthResponse>>('/api/members/invitations/accept', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error(res.error || 'Failed to accept invitation');
    authStorage.setToken(res.data.token);
    return res.data;
  },

  updateMemberRole: async (
    id: string,
    data: { role?: UserRole; developerRole?: string }
  ): Promise<User> => {
    const res = await fetchJson<ApiResponse<User>>(`/api/members/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error(res.error || 'Failed to update member role');
    return res.data;
  },
};

