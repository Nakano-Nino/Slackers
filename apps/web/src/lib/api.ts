import {
  ActivityLog,
  ApiResponse,
  AuthResponse,
  Bug,
  BugStats,
  Channel,
  HealthStatus,
  Message,
  Project,
  ProjectStats,
  Task,
  User,
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

  register: async (data: { name: string; email: string; password: string }): Promise<AuthResponse> => {
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

  logout: () => {
    authStorage.clearToken();
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
  }): Promise<Project> => {
    const res = await fetchJson<ApiResponse<Project>>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to create project');
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

  // Messages
  getMessages: async (channelId: string): Promise<Message[]> => {
    const res = await fetchJson<ApiResponse<Message[]>>(`/api/messages/channel/${channelId}`);
    return res.data || [];
  },

  sendMessage: async (data: {
    channelId: string;
    content: string;
    userId?: string;
    taskId?: string;
    bugId?: string;
  }): Promise<Message> => {
    const res = await fetchJson<ApiResponse<Message>>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to send message');
    return res.data;
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

  // Logs
  getLogs: async (limit = 50): Promise<{ data: ActivityLog[]; mongoConnected: boolean }> => {
    return fetchJson<{ data: ActivityLog[]; mongoConnected: boolean }>(`/api/logs?limit=${limit}`);
  },
};
