import bcrypt from 'bcryptjs';
import { Channel, Message, User, UserRole } from '../types/index.js';

// Pre-hashed 'password123'
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

class DataStore {
  private users: User[] = [
    {
      id: 'u-1',
      name: 'Sarah Connor',
      email: 'sarah@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      role: 'admin',
    },
    {
      id: 'u-2',
      name: 'Alex Rivera',
      email: 'alex@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      role: 'manager',
    },
    {
      id: 'u-3',
      name: 'Jordan Lee',
      email: 'jordan@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      status: 'away',
      role: 'member',
    },
    {
      id: 'u-4',
      name: 'Taylor Guest',
      email: 'guest@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      role: 'viewer',
    },
  ];

  private channels: Channel[] = [
    {
      id: 'general',
      name: 'general',
      description: 'Company-wide announcements and general discussion',
      isPrivate: false,
      memberCount: 42,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    },
    {
      id: 'engineering',
      name: 'engineering',
      description: 'Tech stack, code reviews, and project discussions',
      isPrivate: false,
      memberCount: 18,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
    {
      id: 'product',
      name: 'product',
      description: 'Product roadmap, features, and release planning',
      isPrivate: false,
      memberCount: 24,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    },
  ];

  private messages: Message[] = [
    {
      id: 'm-1',
      channelId: 'general',
      userId: 'u-1',
      userName: 'Sarah Connor',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      content: 'Welcome to Slackers! We now support Multi-Projects, Role-Based Access Control, and full Email/Password Authentication.',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'm-2',
      channelId: 'general',
      userId: 'u-2',
      userName: 'Alex Rivera',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      content: 'The new Project Kanban system is live. Switch between projects in the header and assign tasks directly!',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'm-3',
      channelId: 'engineering',
      userId: 'u-3',
      userName: 'Jordan Lee',
      userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      content: 'RBAC verification middleware active: Admin and Manager roles can manage project settings and assign tasks.',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ];

  getUsers(): User[] {
    return this.users.map(({ passwordHash: _, ...safeUser }) => safeUser as User);
  }

  getUsersInternal(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  addUser(user: User): User {
    this.users.push(user);
    return user;
  }

  getCurrentUser(): User {
    return this.users[0];
  }

  getChannels(): Channel[] {
    return this.channels;
  }

  getChannelById(id: string): Channel | undefined {
    return this.channels.find((c) => c.id === id);
  }

  createChannel(data: { name: string; description: string; isPrivate?: boolean }): Channel {
    const newChannel: Channel = {
      id: data.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      name: data.name.toLowerCase().replace(/\s+/g, '-'),
      description: data.description || '',
      isPrivate: data.isPrivate || false,
      memberCount: 1,
      createdAt: new Date().toISOString(),
    };
    this.channels.push(newChannel);
    return newChannel;
  }

  getMessagesByChannel(channelId: string): Message[] {
    return this.messages.filter((m) => m.channelId === channelId);
  }

  addMessage(data: { channelId: string; content: string; userId?: string; taskId?: string }): Message {
    const user = this.users.find((u) => u.id === data.userId) || this.users[0];
    const newMessage: Message = {
      id: `m-${Date.now()}`,
      channelId: data.channelId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content: data.content,
      taskId: data.taskId,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(newMessage);
    return newMessage;
  }
}

export const dataStore = new DataStore();
