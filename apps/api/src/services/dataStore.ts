import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  AutomationRule,
  Channel,
  ChannelKey,
  KeyVaultData,
  Message,
  User,
  UserRole,
  Webhook,
  WebhookLog,
  WebhookType,
} from '../types/index.js';
import { prisma } from './db.js';

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
  private seenIvs = new Map<string, number>();

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

    // Periodically prune expired disappearing messages and old IVs every 30 seconds
    setInterval(() => {
      this.purgeExpiredMessages();
      this.cleanOldIvs();
    }, 30000);
  }

  private cleanOldIvs(): void {
    const oneHourAgo = Date.now() - 3600000;
    for (const [iv, ts] of this.seenIvs.entries()) {
      if (ts < oneHourAgo) this.seenIvs.delete(iv);
    }
  }

  purgeExpiredMessages(): void {
    const now = Date.now();
    const initialLen = this.messages.length;
    this.messages = this.messages.filter(
      (m) => !m.expiresAt || new Date(m.expiresAt).getTime() > now
    );
    if (this.messages.length < initialLen) {
      prisma.message
        .deleteMany({
          where: {
            expiresAt: {
              lte: new Date(),
            },
          },
        })
        .catch((err) => console.warn('Failed to purge expired channel messages from DB:', err));
    }
  }

  async initFromDb(): Promise<void> {
    try {
      const dbUsers = await prisma.user.findMany();
      if (dbUsers.length > 0) {
        this.users = dbUsers.map((u) => ({
          id: u.id,
          email: u.email,
          passwordHash: u.passwordHash,
          name: u.name,
          avatar: u.avatar,
          publicKey: u.publicKey || undefined,
          encryptedPrivateKey: u.encryptedPrivateKey || undefined,
          keyVaultSalt: u.keyVaultSalt || undefined,
          keyVaultIv: u.keyVaultIv || undefined,
          role: u.role.toLowerCase() as any,
          developerRole: u.developerRole || undefined,
          status: u.status.toLowerCase() as any,
        }));
      }

      const dbChannels = await prisma.channel.findMany();
      if (dbChannels.length > 0) {
        this.channels = dbChannels.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          isPrivate: c.isPrivate,
          memberCount: 0,
          createdAt: c.createdAt.toISOString(),
        }));
      }

      const dbKeys = await prisma.channelKey.findMany();
      if (dbKeys.length > 0) {
        this.channelKeys = dbKeys.map((k) => ({
          id: k.id,
          channelId: k.channelId,
          userId: k.userId,
          encryptedKey: k.encryptedKey,
          iv: k.iv,
          createdAt: k.createdAt.toISOString(),
        }));
      }

      const dbMessages = await prisma.message.findMany({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      });
      if (dbMessages.length > 0) {
        this.messages = dbMessages.map((m) => ({
          id: m.id,
          channelId: m.channelId,
          userId: m.userId,
          userName: m.user?.name || 'Unknown',
          userAvatar: m.user?.avatar || '',
          ciphertext: m.ciphertext,
          iv: m.iv,
          content: m.content || undefined,
          taskId: m.taskId || undefined,
          bugId: m.bugId || undefined,
          createdAt: m.createdAt.toISOString(),
          expiresAt: m.expiresAt ? m.expiresAt.toISOString() : undefined,
          isEdited: m.isEdited,
          isDeleted: m.isDeleted,
          editedAt: m.editedAt ? m.editedAt.toISOString() : undefined,
          reactions: (m.reactions as any) || undefined,
          parentId: m.parentId || undefined,
          replyCount: m.replyCount,
          lastReplyAt: m.lastReplyAt ? m.lastReplyAt.toISOString() : undefined,
        }));
      }

      try {
        const dbWebhooks = await prisma.webhook.findMany({
          include: { channel: true },
          orderBy: { createdAt: 'desc' },
        });
        if (dbWebhooks.length > 0) {
          this.webhooks = dbWebhooks.map((w) => ({
            id: w.id,
            name: w.name,
            channelId: w.channelId,
            channelName: w.channel?.name,
            token: w.token,
            secret: w.secret || undefined,
            type: w.type as WebhookType,
            avatar: w.avatar || undefined,
            creatorId: w.creatorId,
            isActive: w.isActive,
            createdAt: w.createdAt.toISOString(),
            updatedAt: w.updatedAt.toISOString(),
          }));
        }

        const dbRules = await prisma.automationRule.findMany({
          orderBy: { createdAt: 'desc' },
        });
        if (dbRules.length > 0) {
          this.automationRules = dbRules.map((r) => ({
            id: r.id,
            name: r.name,
            trigger: r.trigger,
            conditions: (r.conditions as any) || undefined,
            actions: (r.actions as any) || {},
            isActive: r.isActive,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          }));
        }

        const dbLogs = await prisma.webhookLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
        if (dbLogs.length > 0) {
          this.webhookLogs = dbLogs.map((l) => ({
            id: l.id,
            webhookId: l.webhookId,
            event: l.event,
            status: l.status,
            payload: l.payload,
            error: l.error || undefined,
            durationMs: l.durationMs,
            createdAt: l.createdAt.toISOString(),
          }));
        }
      } catch (err) {
        console.warn('⚠️  Webhooks / Automation rules table sync notice:', (err as Error).message);
      }

      console.log(`📦 DataStore synchronized with PostgreSQL: ${this.users.length} users, ${this.channels.length} channels, ${this.messages.length} messages, ${this.webhooks.length} webhooks.`);
    } catch (err: unknown) {
      console.warn('⚠️  DataStore could not load from PostgreSQL:', err instanceof Error ? err.message : err);
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
    prisma.user
      .upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          passwordHash: user.passwordHash || '',
          publicKey: user.publicKey || null,
          encryptedPrivateKey: user.encryptedPrivateKey || null,
          keyVaultSalt: user.keyVaultSalt || null,
          keyVaultIv: user.keyVaultIv || null,
          role: user.role.toUpperCase() as any,
          developerRole: user.developerRole || null,
          status: user.status.toUpperCase() as any,
        },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          passwordHash: user.passwordHash || '',
          publicKey: user.publicKey || null,
          encryptedPrivateKey: user.encryptedPrivateKey || null,
          keyVaultSalt: user.keyVaultSalt || null,
          keyVaultIv: user.keyVaultIv || null,
          role: user.role.toUpperCase() as any,
          developerRole: user.developerRole || null,
          status: user.status.toUpperCase() as any,
        },
      })
      .catch((err) => console.warn('Failed to persist user to PostgreSQL:', err));
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, updates);
    const dataToUpdate: any = {};
    if (updates.name !== undefined) dataToUpdate.name = updates.name;
    if (updates.email !== undefined) dataToUpdate.email = updates.email;
    if (updates.avatar !== undefined) dataToUpdate.avatar = updates.avatar;
    if (updates.passwordHash !== undefined) dataToUpdate.passwordHash = updates.passwordHash;
    if (updates.role !== undefined) dataToUpdate.role = updates.role.toUpperCase();
    if (updates.developerRole !== undefined) dataToUpdate.developerRole = updates.developerRole;
    if (updates.status !== undefined) dataToUpdate.status = updates.status.toUpperCase();
    if (updates.publicKey !== undefined) dataToUpdate.publicKey = updates.publicKey;
    if (updates.encryptedPrivateKey !== undefined) dataToUpdate.encryptedPrivateKey = updates.encryptedPrivateKey;
    if (updates.keyVaultSalt !== undefined) dataToUpdate.keyVaultSalt = updates.keyVaultSalt;
    if (updates.keyVaultIv !== undefined) dataToUpdate.keyVaultIv = updates.keyVaultIv;

    prisma.user
      .update({ where: { id }, data: dataToUpdate })
      .catch((err) => console.warn('Failed to update user in PostgreSQL:', err));
    return user;
  }

  updateUserPublicKey(userId: string, publicKey: string): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    user.publicKey = publicKey;
    prisma.user
      .update({ where: { id: userId }, data: { publicKey } })
      .catch((err) => console.warn('Failed to update user publicKey in PostgreSQL:', err));
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
    prisma.user
      .update({
        where: { id: userId },
        data: {
          publicKey: vault.publicKey,
          encryptedPrivateKey: vault.encryptedPrivateKey,
          keyVaultSalt: vault.keyVaultSalt,
          keyVaultIv: vault.keyVaultIv,
        },
      })
      .catch((err) => console.warn('Failed to update user keyVault in PostgreSQL:', err));
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

    prisma.channelKey
      .upsert({
        where: { channelId_userId: { channelId, userId } },
        update: { encryptedKey, iv },
        create: {
          id: record.id,
          channelId,
          userId,
          encryptedKey,
          iv,
        },
      })
      .catch((err) => console.warn('Failed to persist channelKey to PostgreSQL:', err));
    return record;
  }

  getChannelKey(channelId: string, userId: string): ChannelKey | undefined {
    return this.channelKeys.find((k) => k.channelId === channelId && k.userId === userId);
  }

  getChannelKeysForChannel(channelId: string): ChannelKey[] {
    return this.channelKeys.filter((k) => k.channelId === channelId);
  }

  private webhooks: Webhook[] = [
    {
      id: 'whk-demo-incoming',
      name: 'CI/CD Pipeline Alerts',
      channelId: 'engineering',
      channelName: 'engineering',
      token: 'whk_pipeline_ci_cd_engineering_prod',
      secret: 'whsec_pipeline_secret_token_12345',
      type: 'GENERIC',
      avatar: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=150&auto=format&fit=crop&q=80',
      creatorId: 'u-1',
      creatorName: 'Sarah Connor',
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: 'whk-demo-github',
      name: 'GitHub Repository Sync',
      channelId: 'general',
      channelName: 'general',
      token: 'whk_github_main_repo_push_events',
      secret: 'whsec_github_hmac_secret_super_key_99',
      type: 'GITHUB',
      avatar: 'https://github.githubassets.com/favicons/favicon.png',
      creatorId: 'u-1',
      creatorName: 'Sarah Connor',
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
  ];

  private webhookLogs: WebhookLog[] = [];

  private automationRules: AutomationRule[] = [
    {
      id: 'rule-1',
      name: 'Alert #engineering on Critical Bug',
      trigger: 'BUG_CREATED',
      conditions: { severity: 'critical' },
      actions: {
        postMessage: {
          channelId: 'engineering',
          template: '🚨 **Critical Defect Reported**: {title}\nReported by: {reportedByName} in {environment}',
        },
        assignTo: 'u-1',
      },
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: 'rule-2',
      name: 'Auto-transition Kanban cards from commit keywords',
      trigger: 'COMMIT_PUSHED',
      conditions: {},
      actions: {
        updateStatus: 'done',
      },
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
  ];

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
    prisma.channel
      .create({
        data: {
          id: newChannel.id,
          name: newChannel.name,
          description: newChannel.description,
          isPrivate: newChannel.isPrivate,
          createdAt: new Date(newChannel.createdAt),
        },
      })
      .catch((err) => console.warn('Failed to persist channel to PostgreSQL:', err));
    return newChannel;
  }

  getMessagesByChannel(
    channelId: string,
    options?: { before?: string; limit?: number }
  ): { messages: Message[]; hasMore: boolean; nextCursor?: string } {
    const nowTime = Date.now();
    let all = this.messages
      .filter(
        (m) =>
          m.channelId === channelId &&
          !m.parentId &&
          (!m.expiresAt || new Date(m.expiresAt).getTime() > nowTime)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (options?.before) {
      const beforeIndex = all.findIndex((m) => m.id === options.before);
      if (beforeIndex !== -1) {
        all = all.slice(0, beforeIndex);
      } else {
        const beforeTime = new Date(options.before).getTime();
        if (!isNaN(beforeTime)) {
          all = all.filter((m) => new Date(m.createdAt).getTime() < beforeTime);
        }
      }
    }

    const limit = options?.limit ? Math.min(Math.max(1, options.limit), 100) : 50;
    const totalCount = all.length;
    const startIndex = Math.max(0, totalCount - limit);
    const paginated = all.slice(startIndex);
    const hasMore = startIndex > 0;
    const nextCursor = hasMore && paginated.length > 0 ? paginated[0].id : undefined;

    return {
      messages: paginated,
      hasMore,
      nextCursor,
    };
  }

  getThreadReplies(parentId: string): Message[] {
    const nowTime = Date.now();
    return this.messages.filter(
      (m) =>
        m.parentId === parentId &&
        (!m.expiresAt || new Date(m.expiresAt).getTime() > nowTime)
    );
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
    expiresAt?: string;
    clientTimestamp?: number;
    botName?: string;
    botAvatar?: string;
    isBot?: boolean;
    botType?: string;
  }): Message {
    // Replay attack defense
    if (this.seenIvs.has(data.iv)) {
      throw new Error('Replay attack detected: duplicate IV/nonce rejected');
    }
    this.seenIvs.set(data.iv, Date.now());

    // Timestamp drift defense
    if (data.clientTimestamp !== undefined) {
      const drift = Math.abs(Date.now() - data.clientTimestamp);
      if (drift > 5 * 60 * 1000) {
        throw new Error('Cryptographic timestamp drift out of bounds (max 5 minutes)');
      }
    }

    const user = this.users.find((u) => u.id === data.userId) || this.users[0];
    const now = new Date().toISOString();
    const newMessage: Message = {
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channelId: data.channelId,
      userId: user.id,
      userName: data.botName || user.name,
      userAvatar: data.botAvatar || user.avatar,
      ciphertext: data.ciphertext,
      iv: data.iv,
      content: data.content,
      taskId: data.taskId,
      bugId: data.bugId,
      parentId: data.parentId,
      createdAt: now,
      expiresAt: data.expiresAt || undefined,
      isBot: data.isBot ?? (!!data.botName),
      botType: data.botType,
    };

    if (data.parentId) {
      const parent = this.messages.find((m) => m.id === data.parentId);
      if (parent) {
        parent.replyCount = (parent.replyCount || 0) + 1;
        parent.lastReplyAt = now;
      }
    }

    this.messages.push(newMessage);
    prisma.message
      .create({
        data: {
          id: newMessage.id,
          channelId: newMessage.channelId,
          userId: newMessage.userId,
          ciphertext: newMessage.ciphertext,
          iv: newMessage.iv,
          content: newMessage.content,
          taskId: newMessage.taskId,
          bugId: newMessage.bugId,
          parentId: newMessage.parentId,
          replyCount: newMessage.replyCount || 0,
          lastReplyAt: newMessage.lastReplyAt ? new Date(newMessage.lastReplyAt) : null,
          createdAt: new Date(newMessage.createdAt),
          expiresAt: newMessage.expiresAt ? new Date(newMessage.expiresAt) : null,
        },
      })
      .then(() => {
        if (data.parentId) {
          return prisma.message.update({
            where: { id: data.parentId },
            data: {
              replyCount: { increment: 1 },
              lastReplyAt: new Date(now),
            },
          });
        }
      })
      .catch((err) => console.warn('Failed to persist message to PostgreSQL:', err));
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

    prisma.message
      .update({
        where: { id: messageId },
        data: { reactions: message.reactions },
      })
      .catch((err) => console.warn('Failed to persist reactions to PostgreSQL:', err));

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

    prisma.message
      .update({
        where: { id: messageId },
        data: {
          ciphertext: message.ciphertext,
          iv: message.iv,
          isEdited: true,
          editedAt: new Date(message.editedAt),
        },
      })
      .catch((err) => console.warn('Failed to persist editMessage to PostgreSQL:', err));

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

    prisma.message
      .update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          ciphertext: '',
          content: 'This message was deleted',
        },
      })
      .catch((err) => console.warn('Failed to persist deleteMessage to PostgreSQL:', err));

    return message;
  }

  // ==========================================
  // Webhooks & Integrations Methods
  // ==========================================

  getWebhooks(): Webhook[] {
    return this.webhooks;
  }

  getWebhookById(id: string): Webhook | undefined {
    return this.webhooks.find((w) => w.id === id);
  }

  getWebhookByToken(token: string): Webhook | undefined {
    return this.webhooks.find((w) => w.token === token);
  }

  addWebhook(data: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt'>): Webhook {
    const channel = this.getChannelById(data.channelId);
    const creator = this.getUserById(data.creatorId);
    const now = new Date().toISOString();
    const newWebhook: Webhook = {
      id: `whk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      channelName: channel?.name || data.channelId,
      creatorName: creator?.name || 'Developer',
      createdAt: now,
      updatedAt: now,
    };
    this.webhooks.unshift(newWebhook);
    prisma.webhook
      .create({
        data: {
          id: newWebhook.id,
          name: newWebhook.name,
          channelId: newWebhook.channelId,
          token: newWebhook.token,
          secret: newWebhook.secret,
          type: newWebhook.type as any,
          avatar: newWebhook.avatar,
          creatorId: newWebhook.creatorId,
          isActive: newWebhook.isActive,
        },
      })
      .catch((err) => console.warn('Failed to persist webhook to PostgreSQL:', err));
    return newWebhook;
  }

  updateWebhook(id: string, data: Partial<Webhook>): Webhook | undefined {
    const webhook = this.webhooks.find((w) => w.id === id);
    if (!webhook) return undefined;
    Object.assign(webhook, data, { updatedAt: new Date().toISOString() });
    prisma.webhook
      .update({
        where: { id },
        data: {
          name: webhook.name,
          channelId: webhook.channelId,
          secret: webhook.secret,
          type: webhook.type as any,
          avatar: webhook.avatar,
          isActive: webhook.isActive,
        },
      })
      .catch((err) => console.warn('Failed to update webhook in PostgreSQL:', err));
    return webhook;
  }

  deleteWebhook(id: string): boolean {
    const idx = this.webhooks.findIndex((w) => w.id === id);
    if (idx === -1) return false;
    this.webhooks.splice(idx, 1);
    prisma.webhook
      .delete({ where: { id } })
      .catch((err) => console.warn('Failed to delete webhook in PostgreSQL:', err));
    return true;
  }

  getWebhookLogs(webhookId: string): WebhookLog[] {
    return this.webhookLogs.filter((l) => l.webhookId === webhookId);
  }

  addWebhookLog(log: Omit<WebhookLog, 'id' | 'createdAt'>): WebhookLog {
    const newLog: WebhookLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...log,
      createdAt: new Date().toISOString(),
    };
    this.webhookLogs.unshift(newLog);
    if (this.webhookLogs.length > 500) {
      this.webhookLogs.pop();
    }
    prisma.webhookLog
      .create({
        data: {
          id: newLog.id,
          webhookId: newLog.webhookId,
          event: newLog.event,
          status: newLog.status,
          payload: newLog.payload,
          error: newLog.error,
          durationMs: newLog.durationMs,
        },
      })
      .catch((err) => console.warn('Failed to persist webhook log to PostgreSQL:', err));
    return newLog;
  }

  getAutomationRules(): AutomationRule[] {
    return this.automationRules;
  }

  getAutomationRuleById(id: string): AutomationRule | undefined {
    return this.automationRules.find((r) => r.id === id);
  }

  addAutomationRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>): AutomationRule {
    const now = new Date().toISOString();
    const newRule: AutomationRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...rule,
      createdAt: now,
      updatedAt: now,
    };
    this.automationRules.unshift(newRule);
    prisma.automationRule
      .create({
        data: {
          id: newRule.id,
          name: newRule.name,
          trigger: newRule.trigger,
          conditions: newRule.conditions,
          actions: newRule.actions as any,
          isActive: newRule.isActive,
        },
      })
      .catch((err) => console.warn('Failed to persist automation rule to PostgreSQL:', err));
    return newRule;
  }

  updateAutomationRule(id: string, data: Partial<AutomationRule>): AutomationRule | undefined {
    const rule = this.automationRules.find((r) => r.id === id);
    if (!rule) return undefined;
    Object.assign(rule, data, { updatedAt: new Date().toISOString() });
    prisma.automationRule
      .update({
        where: { id },
        data: {
          name: rule.name,
          trigger: rule.trigger,
          conditions: rule.conditions,
          actions: rule.actions as any,
          isActive: rule.isActive,
        },
      })
      .catch((err) => console.warn('Failed to update automation rule in PostgreSQL:', err));
    return rule;
  }

  deleteAutomationRule(id: string): boolean {
    const idx = this.automationRules.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.automationRules.splice(idx, 1);
    prisma.automationRule
      .delete({ where: { id } })
      .catch((err) => console.warn('Failed to delete automation rule in PostgreSQL:', err));
    return true;
  }
}

export const dataStore = new DataStore();
