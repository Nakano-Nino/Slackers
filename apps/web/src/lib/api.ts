import { ActivityLog, ApiResponse, Channel, HealthStatus, Message, SprintStats, Task, User } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
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

  // Channels
  getChannels: async (): Promise<Channel[]> => {
    const res = await fetchJson<ApiResponse<Channel[]>>('/api/channels');
    return res.data || [];
  },

  getChannel: async (id: string): Promise<Channel> => {
    const res = await fetchJson<ApiResponse<Channel>>(`/api/channels/${id}`);
    if (!res.data) throw new Error('Channel not found');
    return res.data;
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

  sendMessage: async (data: { channelId: string; content: string; userId?: string; taskId?: string }): Promise<Message> => {
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

  getCurrentUser: async (): Promise<User> => {
    const res = await fetchJson<ApiResponse<User>>('/api/users/me');
    if (!res.data) throw new Error('Failed to fetch current user');
    return res.data;
  },

  // Tasks & Kanban
  getTasks: async (filter?: { status?: string; assigneeId?: string }): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.assigneeId) params.set('assigneeId', filter.assigneeId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchJson<ApiResponse<Task[]>>(`/api/tasks${query}`);
    return res.data || [];
  },

  getTask: async (id: string): Promise<Task> => {
    const res = await fetchJson<ApiResponse<Task>>(`/api/tasks/${id}`);
    if (!res.data) throw new Error('Task not found');
    return res.data;
  },

  createTask: async (data: {
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

  getSprintStats: async (): Promise<SprintStats> => {
    const res = await fetchJson<ApiResponse<SprintStats>>('/api/tasks/sprint/stats');
    if (!res.data) throw new Error('Failed to fetch sprint stats');
    return res.data;
  },

  // Logs
  getLogs: async (limit = 50): Promise<{ data: ActivityLog[]; mongoConnected: boolean }> => {
    return fetchJson<{ data: ActivityLog[]; mongoConnected: boolean }>(`/api/logs?limit=${limit}`);
  },
};
