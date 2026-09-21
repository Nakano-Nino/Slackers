import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole, AuthResponse } from '../types/index.js';
import { dataStore } from './dataStore.js';
import { mongoLogger } from './mongoLogger.js';
import { sessionService, UserSession } from './sessionService.js';
import { notificationService } from './notificationService.js';
import { socketService } from './socketService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'slackers-super-secure-jwt-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('🚨 CRITICAL SECURITY WARNING: JWT_SECRET is unset in production environment! Using fallback key is insecure.');
}

export class AuthService {
  // Pre-hashed "password123" for instant startup speed
  private defaultPasswordHash = bcrypt.hashSync('password123', 10);

  constructor() {
    // Ensure all pre-seeded users have password hashes and emails
    this.seedUserCredentials();
  }

  private seedUserCredentials() {
    const users = dataStore.getUsers();
    for (const u of users) {
      if (!u.passwordHash) {
        u.passwordHash = this.defaultPasswordHash;
      }
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(user: User, sessionId?: string): string {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      developerRole: user.developerRole,
      sessionId,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token: string): {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    developerRole?: string;
    sessionId?: string;
  } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        developerRole?: string;
        sessionId?: string;
      };
    } catch {
      return null;
    }
  }

  async login(
    email: string,
    password: string,
    reqContext?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ user: User; token: string; session?: UserSession }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = dataStore.getUserByEmail(normalizedEmail);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await this.comparePassword(password, user.passwordHash || this.defaultPasswordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Create session record for multi-device management
    const session = await sessionService.createSession(
      user.id,
      reqContext?.userAgent,
      reqContext?.ipAddress
    );

    const token = this.generateToken(user, session.id);

    // MongoDB audit log
    await mongoLogger.log(
      'USER_LOGIN',
      {
        email: user.email,
        role: user.role,
        developerRole: user.developerRole,
        sessionId: session.id,
        deviceName: session.deviceName,
      },
      user
    );

    // Return safe user object (omit passwordHash)
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser as User, token, session };
  }

  async register(
    data: {
      name: string;
      email: string;
      password: string;
      role?: UserRole;
      developerRole?: string;
    },
    reqContext?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ user: User; token: string; session?: UserSession }> {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = dataStore.getUserByEmail(normalizedEmail);

    if (existing) {
      throw new Error(`Email "${data.email}" is already registered`);
    }

    const passwordHash = await this.hashPassword(data.password);
    // First user registered on a clean/empty database becomes ADMIN; subsequent users default to MEMBER
    const isFirstUser = dataStore.getUsers().length === 0;
    const role: UserRole = isFirstUser ? 'admin' : (data.role || 'member');

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      developerRole: data.developerRole || 'fullstack_developer',
      status: 'online',
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    };

    dataStore.addUser(newUser);

    const session = await sessionService.createSession(
      newUser.id,
      reqContext?.userAgent,
      reqContext?.ipAddress
    );

    const token = this.generateToken(newUser, session.id);

    // MongoDB audit log
    await mongoLogger.log(
      'USER_REGISTERED',
      {
        email: newUser.email,
        role: newUser.role,
        developerRole: newUser.developerRole,
        sessionId: session.id,
        deviceName: session.deviceName,
      },
      newUser
    );

    const { passwordHash: _, ...safeUser } = newUser;
    return { user: safeUser as User, token, session };
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      email?: string;
      avatar?: string;
      developerRole?: string;
      currentPassword?: string;
      newPassword?: string;
    },
    currentSessionId?: string
  ): Promise<AuthResponse> {
    const user = dataStore.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If changing email, ensure it's not taken by someone else
    if (data.email && data.email.toLowerCase().trim() !== user.email.toLowerCase()) {
      const normalizedEmail = data.email.toLowerCase().trim();
      const existing = dataStore.getUserByEmail(normalizedEmail);
      if (existing && existing.id !== userId) {
        throw new Error(`Email "${data.email}" is already in use by another account`);
      }
      user.email = normalizedEmail;
    }

    // If changing password, verify current password
    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new Error('Current password is required to set a new password');
      }
      const isValid = await this.comparePassword(
        data.currentPassword,
        user.passwordHash || this.defaultPasswordHash
      );
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }
      user.passwordHash = await this.hashPassword(data.newPassword);
    }

    if (data.name) {
      user.name = data.name.trim();
    }

    if (data.avatar) {
      user.avatar = data.avatar.trim();
    }

    if (data.developerRole && data.developerRole !== user.developerRole) {
      if (user.role !== 'admin' && user.role !== 'manager') {
        throw new Error('Permission denied: Normal members cannot change their engineering developer role.');
      }
      user.developerRole = data.developerRole;
    }

    // Save update in dataStore
    dataStore.updateUser(userId, user);

    const token = this.generateToken(user, currentSessionId);

    const passwordChanged = Boolean(data.newPassword);

    // If password was updated, immediately invalidate all other active sessions across devices
    if (passwordChanged && currentSessionId) {
      try {
        await sessionService.revokeOtherSessions(user.id, currentSessionId);
        socketService.emitSessionRevoked(user.id, 'all-others');
      } catch (err) {
        console.warn('Failed to revoke other sessions on password change:', err);
      }
    }

    await mongoLogger.log(
      'USER_PROFILE_UPDATED',
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        developerRole: user.developerRole,
        passwordChanged,
      },
      user
    );

    if (passwordChanged) {
      notificationService.createNotification({
        recipientId: user.id,
        senderId: 'system',
        senderName: 'Slackers Security',
        type: 'system',
        title: 'Password Changed Successfully',
        content: 'Your account password has been updated and other active sessions have been revoked.',
      });
    }

    const { passwordHash: _, ...safeUser } = user;
    socketService.emitUserUpdated(safeUser as User);
    return { user: safeUser as User, token, passwordChanged };
  }
}

export const authService = new AuthService();
