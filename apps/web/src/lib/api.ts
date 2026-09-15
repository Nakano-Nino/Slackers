import { ApiResponse, Channel, HealthStatus, Message, User } from '../types';

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

  getMessages: async (channelId: string): Promise<Message[]> => {
    const res = await fetchJson<ApiResponse<Message[]>>(`/api/messages/channel/${channelId}`);
    return res.data || [];
  },

  sendMessage: async (data: { channelId: string; content: string; userId?: string }): Promise<Message> => {
    const res = await fetchJson<ApiResponse<Message>>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new Error('Failed to send message');
    return res.data;
  },

  getUsers: async (): Promise<User[]> => {
    const res = await fetchJson<ApiResponse<User[]>>('/api/users');
    return res.data || [];
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await fetchJson<ApiResponse<User>>('/api/users/me');
    if (!res.data) throw new Error('Failed to fetch current user');
    return res.data;
  },
};
