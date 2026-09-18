import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Invitation, User, UserRole } from '../types/index.js';
import { dataStore } from './dataStore.js';
import { mongoLogger } from './mongoLogger.js';
import { socketService } from './socketService.js';
import { authService } from './authService.js';
import { sessionService, UserSession } from './sessionService.js';
import { prisma } from './db.js';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
];

class MemberService {
  async initFromDb(): Promise<void> {
    try {
      const dbInvitations = await prisma.invitation.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (dbInvitations.length > 0) {
        this.invitations = dbInvitations.map((i) => {
          const inviter = dataStore.getUserById(i.inviterId);
          return {
            id: i.id,
            token: i.token,
            email: i.email || undefined,
            role: i.role.toLowerCase() as UserRole,
            developerRole: i.developerRole || undefined,
            invitedById: i.inviterId,
            invitedByName: inviter?.name,
            expiresAt: i.expiresAt.toISOString(),
            isUsed: i.status === 'accepted',
            usedAt: i.acceptedAt ? i.acceptedAt.toISOString() : undefined,
            createdAt: i.createdAt.toISOString(),
          };
        });
      }
      console.log(`📦 MemberService synchronized with PostgreSQL: ${this.invitations.length} invitations.`);
    } catch (err: unknown) {
      console.warn('⚠️  MemberService could not load from PostgreSQL:', err instanceof Error ? err.message : err);
    }
  }

  private invitations: Invitation[] = [];

  generateTempPassword(length = 12): string {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let pass = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      pass += chars[bytes[i] % chars.length];
    }
    return pass;
  }

  async addMember(
    data: {
      name: string;
      email: string;
      password?: string;
      role?: UserRole;
      developerRole?: string;
    },
    inviter: User
  ): Promise<{ user: User; tempPassword?: string }> {
    // RBAC: Only Admin and Manager can directly add members
    if (inviter.role !== 'admin' && inviter.role !== 'manager') {
      throw new Error('Permission denied: Only Admins and Managers have permission to add members.');
    }

    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = dataStore.getUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error(`Email "${data.email}" is already registered in this workspace.`);
    }

    const tempPassword = data.password?.trim() || this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const role: UserRole = data.role || 'member';

    // Pick avatar preset deterministically from email hash
    let avatarIndex = 0;
    for (let i = 0; i < normalizedEmail.length; i++) {
      avatarIndex = (avatarIndex + normalizedEmail.charCodeAt(i)) % AVATAR_PRESETS.length;
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      developerRole: data.developerRole || 'fullstack_developer',
      status: 'online',
      avatar: AVATAR_PRESETS[avatarIndex],
    };

    dataStore.addUser(newUser);

    // MongoDB audit log
    await mongoLogger.log(
      'MEMBER_ADDED',
      {
        newUserId: newUser.id,
        newUserName: newUser.name,
        newUserEmail: newUser.email,
        role: newUser.role,
        developerRole: newUser.developerRole,
        addedById: inviter.id,
        addedByName: inviter.name,
      },
      inviter
    );

    const { passwordHash: _, ...safeUser } = newUser;

    // Real-time socket broadcast
    socketService.emitUserCreated(safeUser as User);

    return {
      user: safeUser as User,
      tempPassword: data.password ? undefined : tempPassword,
    };
  }

  async createInvitation(
    data: {
      email?: string;
      role?: UserRole;
      developerRole?: string;
      expiresInDays?: number;
    },
    inviter: User
  ): Promise<Invitation> {
    if (inviter.role !== 'admin' && inviter.role !== 'manager') {
      throw new Error('Permission denied: Only Admins and Managers have permission to generate invite links.');
    }

    const token = `inv_${crypto.randomBytes(16).toString('hex')}`;
    const expiresInDays = data.expiresInDays && data.expiresInDays > 0 ? data.expiresInDays : 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const invitation: Invitation = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      token,
      email: data.email?.toLowerCase().trim() || undefined,
      role: data.role || 'member',
      developerRole: data.developerRole || 'fullstack_developer',
      invitedById: inviter.id,
      invitedByName: inviter.name,
      expiresAt,
      isUsed: false,
      createdAt: new Date().toISOString(),
    };

    this.invitations.unshift(invitation);

    await prisma.invitation
      .create({
        data: {
          id: invitation.id,
          token: invitation.token,
          email: invitation.email || '',
          role: invitation.role,
          developerRole: invitation.developerRole || null,
          inviterId: invitation.invitedById,
          status: 'pending',
          expiresAt: new Date(invitation.expiresAt),
          createdAt: new Date(invitation.createdAt),
        },
      })
      .catch((err) => console.warn('Failed to persist invitation to PostgreSQL:', err));

    await mongoLogger.log(
      'MEMBER_INVITED',
      {
        invitationId: invitation.id,
        token: invitation.token,
        role: invitation.role,
        targetEmail: invitation.email,
        expiresAt: invitation.expiresAt,
        invitedBy: inviter.id,
      },
      inviter
    );

    return invitation;
  }

  getInvitations(user: User): Invitation[] {
    if (user.role !== 'admin' && user.role !== 'manager') {
      throw new Error('Permission denied: Only Admins and Managers can view active invitations.');
    }
    return this.invitations;
  }

  async revokeInvitation(id: string, actor: User): Promise<boolean> {
    if (actor.role !== 'admin' && actor.role !== 'manager') {
      throw new Error('Permission denied: Only Admins and Managers can revoke invitations.');
    }

    const index = this.invitations.findIndex((i) => i.id === id);
    if (index === -1) return false;

    const revoked = this.invitations.splice(index, 1)[0];

    await prisma.invitation
      .delete({ where: { token: revoked.token } })
      .catch((err) => console.warn('Failed to delete invitation in PostgreSQL:', err));

    mongoLogger.log(
      'INVITATION_REVOKED',
      { invitationId: id, token: revoked.token, role: revoked.role },
      actor
    ).catch(() => {});

    return true;
  }

  verifyInvitation(token: string): {
    valid: boolean;
    error?: string;
    invitation?: Partial<Invitation>;
  } {
    const inv = this.invitations.find((i) => i.token === token.trim());
    if (!inv) {
      return { valid: false, error: 'Invitation link is invalid or does not exist.' };
    }

    if (inv.isUsed) {
      return { valid: false, error: 'This invitation has already been used to join the workspace.' };
    }

    if (new Date(inv.expiresAt).getTime() < Date.now()) {
      return { valid: false, error: 'This invitation link has expired. Please request a new invite.' };
    }

    return {
      valid: true,
      invitation: {
        id: inv.id,
        token: inv.token,
        email: inv.email,
        role: inv.role,
        developerRole: inv.developerRole,
        invitedByName: inv.invitedByName,
        expiresAt: inv.expiresAt,
      },
    };
  }

  async acceptInvitation(
    token: string,
    userData: {
      name: string;
      email?: string;
      password: string;
      developerRole?: string;
    },
    reqContext?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ user: User; token: string; session: UserSession }> {
    const verification = this.verifyInvitation(token);
    if (!verification.valid || !verification.invitation) {
      throw new Error(verification.error || 'Invalid invitation.');
    }

    const inv = this.invitations.find((i) => i.token === token.trim())!;
    const targetEmail = (inv.email || userData.email || '').toLowerCase().trim();

    if (!targetEmail) {
      throw new Error('An email address is required to accept this invitation.');
    }

    const existing = dataStore.getUserByEmail(targetEmail);
    if (existing) {
      throw new Error(`An account with email "${targetEmail}" already exists. Please log in instead.`);
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);

    let avatarIndex = 0;
    for (let i = 0; i < targetEmail.length; i++) {
      avatarIndex = (avatarIndex + targetEmail.charCodeAt(i)) % AVATAR_PRESETS.length;
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: userData.name.trim(),
      email: targetEmail,
      passwordHash,
      role: inv.role,
      developerRole: inv.developerRole || userData.developerRole || 'fullstack_developer',
      status: 'online',
      avatar: AVATAR_PRESETS[avatarIndex],
    };

    dataStore.addUser(newUser);

    // Mark invitation used
    inv.isUsed = true;
    inv.usedById = newUser.id;
    inv.usedAt = new Date().toISOString();

    await prisma.invitation
      .update({
        where: { token: inv.token },
        data: {
          status: 'accepted',
          acceptedAt: new Date(inv.usedAt),
        },
      })
      .catch((err) => console.warn('Failed to update accepted invitation in PostgreSQL:', err));

    // Create session & JWT token
    const userAgent = reqContext?.userAgent || 'Browser';
    const ipAddress = reqContext?.ipAddress || '127.0.0.1';
    const session = await sessionService.createSession(newUser.id, userAgent, ipAddress);
    const authToken = authService.generateToken(newUser, session.id);

    await mongoLogger.log(
      'INVITATION_ACCEPTED',
      {
        invitationId: inv.id,
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        sessionId: session.id,
      },
      newUser
    );

    const { passwordHash: _, ...safeUser } = newUser;

    // Real-time broadcast to all clients
    socketService.emitUserCreated(safeUser as User);

    return {
      user: safeUser as User,
      token: authToken,
      session,
    };
  }

  async updateMemberRole(
    memberId: string,
    data: { role?: UserRole; developerRole?: string },
    actor: User
  ): Promise<User> {
    if (actor.role !== 'admin' && actor.role !== 'manager') {
      throw new Error('Permission denied: Only Admins and Managers can update member roles.');
    }

    const member = dataStore.getUserById(memberId);
    if (!member) {
      throw new Error(`Member with ID "${memberId}" not found.`);
    }

    // Only Admins can modify system workspace authority roles (admin, manager, member, viewer)
    if (data.role && data.role !== member.role) {
      if (actor.role !== 'admin') {
        throw new Error('Permission denied: Only Admins can modify workspace authority roles.');
      }
      member.role = data.role;
    }

    // Admins and Managers can modify engineering developer roles
    if (data.developerRole && data.developerRole !== member.developerRole) {
      member.developerRole = data.developerRole;
    }

    dataStore.updateUser(memberId, member);

    await mongoLogger.log(
      'MEMBER_ROLE_UPDATED',
      {
        memberId: member.id,
        memberName: member.name,
        newRole: member.role,
        newDeveloperRole: member.developerRole,
        updatedById: actor.id,
        updatedByName: actor.name,
      },
      actor
    );

    const { passwordHash: _, ...safeUser } = member;
    socketService.emitUserCreated(safeUser as User);

    return safeUser as User;
  }
}

export const memberService = new MemberService();
