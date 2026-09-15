import { Channel, Message, User } from '../types/index.js';

class DataStore {
  private users: User[] = [
    {
      id: 'u-1',
      name: 'Sarah Connor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      role: 'Lead Architect',
    },
    {
      id: 'u-2',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      role: 'Frontend Engineer',
    },
    {
      id: 'u-3',
      name: 'Jordan Lee',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      status: 'away',
      role: 'Backend Engineer',
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
      description: 'Tech stack, code reviews, and architecture discussions',
      isPrivate: false,
      memberCount: 18,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
    {
      id: 'random',
      name: 'random',
      description: 'Watercooler chat, memes, and non-work banter',
      isPrivate: false,
      memberCount: 35,
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
      content: 'Welcome everyone to the new Slackers fullstack app! Next.js frontend + Node.js backend are up and connected.',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'm-2',
      channelId: 'general',
      userId: 'u-2',
      userName: 'Alex Rivera',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      content: 'Awesome setup! The UI is looking super crisp with Tailwind CSS.',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'm-3',
      channelId: 'engineering',
      userId: 'u-3',
      userName: 'Jordan Lee',
      userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      content: 'Backend Express REST endpoints are ready. Type-safe responses and CORS configured.',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ];

  getUsers(): User[] {
    return this.users;
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

  addMessage(data: { channelId: string; content: string; userId?: string }): Message {
    const user = this.users.find((u) => u.id === data.userId) || this.users[0];
    const newMessage: Message = {
      id: `m-${Date.now()}`,
      channelId: data.channelId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content: data.content,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(newMessage);
    return newMessage;
  }
}

export const dataStore = new DataStore();
