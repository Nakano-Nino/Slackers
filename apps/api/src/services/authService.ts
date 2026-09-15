import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../types/index.js';
import { dataStore } from './dataStore.js';
import { mongoLogger } from './mongoLogger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'slackers-super-secure-jwt-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

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

  generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token: string): { id: string; email: string; name: string; role: UserRole } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        name: string;
        role: UserRole;
      };
    } catch {
      return null;
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = dataStore.getUsers().find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await this.comparePassword(password, user.passwordHash || this.defaultPasswordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);

    // MongoDB audit log
    await mongoLogger.log('USER_LOGIN', { email: user.email, role: user.role }, user);

    // Return safe user object (omit passwordHash)
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser as User, token };
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<{ user: User; token: string }> {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = dataStore.getUsers().find((u) => u.email.toLowerCase() === normalizedEmail);

    if (existing) {
      throw new Error(`Email "${data.email}" is already registered`);
    }

    const passwordHash = await this.hashPassword(data.password);
    // User requested default role is MEMBER
    const role: UserRole = data.role || 'member';

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      status: 'online',
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    };

    dataStore.addUser(newUser);

    const token = this.generateToken(newUser);

    // MongoDB audit log
    await mongoLogger.log('USER_REGISTERED', { email: newUser.email, role: newUser.role }, newUser);

    const { passwordHash: _, ...safeUser } = newUser;
    return { user: safeUser as User, token };
  }
}

export const authService = new AuthService();
