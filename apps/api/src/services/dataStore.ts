import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Channel, ChannelKey, KeyVaultData, Message, User, UserRole } from '../types/index.js';

// Pre-hashed 'password123'
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

function generateSeedKeyVault(password: string): KeyVaultData {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pubJwk = publicKey.export({ format: 'jwk' });
  const privJwk = privateKey.export({ format: 'jwk' });

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);

  const vaultKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', vaultKey, iv);
  const plaintext = JSON.stringify(privJwk);
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final(), cipher.getAuthTag()]);

  return {
    publicKey: JSON.stringify(pubJwk),
    encryptedPrivateKey: encrypted.toString('base64'),
    keyVaultSalt: salt.toString('base64'),
    keyVaultIv: iv.toString('base64'),
  };
}

class DataStore {
  constructor() {
    // Pre-seed genuine ECDH P-256 keypairs and password-derived KeyVaults for all default demo users
    for (const user of this.users) {
      if (!user.publicKey || !user.encryptedPrivateKey) {
        const vault = generateSeedKeyVault('password123');
        user.publicKey = vault.publicKey;
        user.encryptedPrivateKey = vault.encryptedPrivateKey;
        user.keyVaultSalt = vault.keyVaultSalt;
        user.keyVaultIv = vault.keyVaultIv;
      }
    }
  }

  private users: User[] = [
    {
      id: 'u-1',
      name: 'Sarah Connor',
      email: 'sarah@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      role: 'admin',
      developerRole: 'lead_architect',
    },
    {
      id: 'u-2',
      name: 'Alex Rivera',
      email: 'alex@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      role: 'manager',
      developerRole: 'engineering_manager',
    },
    {
      id: 'u-3',
      name: 'Jordan Lee',
      email: 'jordan@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      status: 'away',
      role: 'member',
      developerRole: 'backend_developer',
    },
    {
      id: 'u-4',
      name: 'Taylor Guest',
      email: 'guest@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      role: 'viewer',
      developerRole: 'qa_engineer',
    },
    {
      id: 'u-5',
      name: 'Morgan Vance',
      email: 'morgan@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      role: 'member',
      developerRole: 'security_engineer',
    },
    {
      id: 'u-6',
      name: 'Elena Rostova',
      email: 'elena@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      status: 'away',
      role: 'member',
      developerRole: 'ui_ux_designer',
    },
    {
      id: 'u-7',
      name: 'Marcus Chen',
      email: 'marcus@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      role: 'member',
      developerRole: 'frontend_developer',
    },
    {
      id: 'u-8',
      name: 'Priya Patel',
      email: 'priya@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      status: 'offline',
      role: 'manager',
      developerRole: 'devops_engineer',
    },
    {
      id: 'u-9',
      name: 'Liam O’Connor',
      email: 'liam@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      role: 'member',
      developerRole: 'qa_engineer',
    },
    {
      id: 'u-10',
      name: 'Chloe Dubois',
      email: 'chloe@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      status: 'away',
      role: 'member',
      developerRole: 'fullstack_developer',
    },
    {
      id: 'u-11',
      name: 'David Kim',
      email: 'david@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      role: 'member',
      developerRole: 'mobile_developer',
    },
    {
      id: 'u-12',
      name: 'Samira Khan',
      email: 'samira@slackers.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      status: 'offline',
      role: 'member',
      developerRole: 'data_engineer',
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
      memberCount: 28,
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
    {
      id: 'design-system',
      name: 'design-system',
      description: 'UI/UX components, Figma tokens, accessibility, and clean slate styling',
      isPrivate: false,
      memberCount: 16,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    },
    {
      id: 'infra-ops',
      name: 'infra-ops',
      description: 'Cloud infrastructure, Kubernetes, CI/CD pipelines, and uptime alerts',
      isPrivate: false,
      memberCount: 12,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    },
    {
      id: 'security-audit',
      name: 'security-audit',
      description: 'Zero-Knowledge E2EE, audit logs, and penetration testing reports',
      isPrivate: true,
      memberCount: 8,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: 'customer-feedback',
      name: 'customer-feedback',
      description: 'Defect reports, client feature suggestions, and support triage',
      isPrivate: false,
      memberCount: 20,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: 'random',
      name: 'random',
      description: 'Non-work banter, watercooler chats, memes, and hobbies',
      isPrivate: false,
      memberCount: 38,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    },
    {
      id: 'announcements',
      name: 'announcements',
      description: 'Official corporate updates, release milestones, and leadership notices',
      isPrivate: false,
      memberCount: 42,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    },
  ];

  private channelKeys: ChannelKey[] = [];

  private messages: Message[] = [
    {
      id: 'm-1',
      channelId: 'general',
      userId: 'u-1',
      userName: 'Sarah Connor',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      ciphertext: 'U2FsdGVkX1+m108/eXpY+seedGeneralChatEncryptedAnnouncement==',
      iv: '4bW1jP2PZk91Z3lF',
      content: 'Welcome to Slackers! We now support Multi-Projects, Role-Based Access Control, and full Email/Password Authentication.',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'm-2',
      channelId: 'general',
      userId: 'u-2',
      userName: 'Alex Rivera',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      ciphertext: 'U2FsdGVkX18m9102XpQ+seedGeneralChatEncryptedKanbanUpdate==',
      iv: '9lZ3lF4bW1jP2PZk',
      content: 'The new Project Kanban system is live. Switch between projects in the header and assign tasks directly!',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'm-3',
      channelId: 'engineering',
      userId: 'u-3',
      userName: 'Jordan Lee',
      userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      ciphertext: 'U2FsdGVkX19x8321XpQ+seedEngineeringEncryptedRbacUpdate==',
      iv: '1Z3lF9lZbW1jP2Pk',
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

  updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, updates);
    return user;
  }

  updateUserPublicKey(userId: string, publicKey: string): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    user.publicKey = publicKey;
    return true;
  }

  getUserPublicKey(userId: string): string | undefined {
    const user = this.users.find((u) => u.id === userId);
    return user?.publicKey;
  }

  updateUserKeyVault(userId: string, vault: KeyVaultData): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    user.publicKey = vault.publicKey;
    user.encryptedPrivateKey = vault.encryptedPrivateKey;
    user.keyVaultSalt = vault.keyVaultSalt;
    user.keyVaultIv = vault.keyVaultIv;
    return true;
  }

  getUserKeyVault(userId: string): KeyVaultData | null {
    const user = this.users.find((u) => u.id === userId);
    if (!user || !user.encryptedPrivateKey || !user.keyVaultSalt || !user.keyVaultIv || !user.publicKey) {
      return null;
    }
    return {
      publicKey: user.publicKey,
      encryptedPrivateKey: user.encryptedPrivateKey,
      keyVaultSalt: user.keyVaultSalt,
      keyVaultIv: user.keyVaultIv,
    };
  }

  setChannelKey(channelId: string, userId: string, encryptedKey: string, iv: string): ChannelKey {
    const existingIndex = this.channelKeys.findIndex(
      (k) => k.channelId === channelId && k.userId === userId
    );

    const record: ChannelKey = {
      id: `ck-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      channelId,
      userId,
      encryptedKey,
      iv,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.channelKeys[existingIndex] = record;
    } else {
      this.channelKeys.push(record);
    }
    return record;
  }

  getChannelKey(channelId: string, userId: string): ChannelKey | undefined {
    return this.channelKeys.find((k) => k.channelId === channelId && k.userId === userId);
  }

  getChannelKeysForChannel(channelId: string): ChannelKey[] {
    return this.channelKeys.filter((k) => k.channelId === channelId);
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
    return this.messages.filter((m) => m.channelId === channelId && !m.parentId);
  }

  getThreadReplies(parentId: string): Message[] {
    return this.messages.filter((m) => m.parentId === parentId);
  }

  getMessageById(id: string): Message | undefined {
    return this.messages.find((m) => m.id === id);
  }

  addMessage(data: {
    channelId: string;
    ciphertext: string;
    iv: string;
    content?: string;
    userId?: string;
    taskId?: string;
    bugId?: string;
    parentId?: string;
  }): Message {
    const user = this.users.find((u) => u.id === data.userId) || this.users[0];
    const now = new Date().toISOString();
    const newMessage: Message = {
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channelId: data.channelId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      ciphertext: data.ciphertext,
      iv: data.iv,
      content: data.content,
      taskId: data.taskId,
      bugId: data.bugId,
      parentId: data.parentId,
      createdAt: now,
    };

    if (data.parentId) {
      const parent = this.messages.find((m) => m.id === data.parentId);
      if (parent) {
        parent.replyCount = (parent.replyCount || 0) + 1;
        parent.lastReplyAt = now;
      }
    }

    this.messages.push(newMessage);
    return newMessage;
  }

  toggleMessageReaction(messageId: string, emoji: string, userId: string): Message | null {
    const message = this.messages.find((m) => m.id === messageId);
    if (!message) return null;

    message.reactions = message.reactions || {};
    const existing = message.reactions[emoji] || [];
    const userIndex = existing.indexOf(userId);

    if (userIndex > -1) {
      existing.splice(userIndex, 1);
      if (existing.length === 0) {
        delete message.reactions[emoji];
      } else {
        message.reactions[emoji] = existing;
      }
    } else {
      existing.push(userId);
      message.reactions[emoji] = existing;
    }

    return message;
  }

  editMessage(messageId: string, ciphertext: string, iv: string, userId: string): Message | null {
    const message = this.messages.find((m) => m.id === messageId);
    if (!message) return null;

    if (message.userId !== userId) {
      throw new Error('Permission denied: Only the sender can edit their message');
    }

    message.ciphertext = ciphertext;
    message.iv = iv;
    message.isEdited = true;
    message.editedAt = new Date().toISOString();
    return message;
  }

  deleteMessage(messageId: string, userId: string, isAdmin: boolean): Message | null {
    const message = this.messages.find((m) => m.id === messageId);
    if (!message) return null;

    if (message.userId !== userId && !isAdmin) {
      throw new Error('Permission denied: You can only delete your own messages');
    }

    message.isDeleted = true;
    message.ciphertext = '';
    message.content = 'This message was deleted';
    return message;
  }
}

export const dataStore = new DataStore();
