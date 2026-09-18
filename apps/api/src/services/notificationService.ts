import { Notification, NotificationType, User } from '../types/index.js';
import { dataStore } from './dataStore.js';
import { socketService } from './socketService.js';
import { prisma } from './db.js';

class NotificationService {
  async initFromDb(): Promise<void> {
    try {
      const dbNotifs = await prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      if (dbNotifs.length > 0) {
        this.notifications = dbNotifs.map((n) => ({
          id: n.id,
          recipientId: n.recipientId,
          senderId: n.senderId,
          senderName: n.senderName,
          senderAvatar: n.senderAvatar || undefined,
          type: n.type as NotificationType,
          title: n.title,
          content: n.content,
          link: (n.link as any) || undefined,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        }));
      }
      console.log(`📦 NotificationService synchronized with PostgreSQL: ${this.notifications.length} notifications.`);
    } catch (err: unknown) {
      console.warn('⚠️  NotificationService could not load from PostgreSQL:', err instanceof Error ? err.message : err);
    }
  }

  private notifications: Notification[] = [
    {
      id: 'notif-1',
      recipientId: 'u-1',
      senderId: 'u-2',
      senderName: 'Sarah Connor',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      type: 'task_assigned',
      title: 'Task Assigned',
      content: 'Sarah Connor assigned you to "Design database schema & relations"',
      link: { type: 'task', id: 'task-1' },
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'notif-2',
      recipientId: 'u-1',
      senderId: 'u-3',
      senderName: 'Jordan Lee',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      type: 'message',
      title: 'New message in #general',
      content: 'Jordan Lee sent a new message in #general',
      link: { type: 'channel', id: 'general' },
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: 'notif-3',
      recipientId: 'u-2',
      senderId: 'u-1',
      senderName: 'Alex Rivera',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      type: 'task_assigned',
      title: 'Task Assigned',
      content: 'Alex Rivera assigned you to "Implement drag-and-drop Kanban Board UI"',
      link: { type: 'task', id: 'task-3' },
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    },
    {
      id: 'notif-4',
      recipientId: 'u-2',
      senderId: 'u-1',
      senderName: 'Alex Rivera',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      type: 'dm',
      title: 'Direct Message',
      content: 'Alex Rivera sent you a direct message',
      link: { type: 'dm', id: 'u-1' },
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  ];

  private muteTargets: import('../types/index.js').MuteTarget[] = [];

  getMuteTargets(userId: string): import('../types/index.js').MuteTarget[] {
    const now = Date.now();
    this.muteTargets = this.muteTargets.filter(
      (m) => m.mutedUntil === null || new Date(m.mutedUntil).getTime() > now
    );
    return this.muteTargets.filter((m) => m.userId === userId);
  }

  isTargetMuted(userId: string, targetType: 'channel' | 'dm', targetId: string): boolean {
    const now = Date.now();
    const mute = this.muteTargets.find(
      (m) => m.userId === userId && m.targetType === targetType && m.targetId === targetId
    );
    if (!mute) return false;

    if (mute.mutedUntil === null || new Date(mute.mutedUntil).getTime() > now) {
      return true;
    }

    // Expired, clean up
    this.muteTargets = this.muteTargets.filter((m) => m.id !== mute.id);
    return false;
  }

  muteTarget(
    userId: string,
    targetType: 'channel' | 'dm',
    targetId: string,
    duration: import('../types/index.js').MuteDuration,
    targetName?: string
  ): import('../types/index.js').MuteTarget {
    const now = Date.now();
    let mutedUntil: string | null = null;
    if (duration === '1_day') {
      mutedUntil = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    } else if (duration === '1_week') {
      mutedUntil = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (duration === '1_month') {
      mutedUntil = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (duration === 'forever') {
      mutedUntil = null;
    }

    if (!targetName) {
      if (targetType === 'channel') {
        const ch = dataStore.getChannelById(targetId);
        targetName = ch ? `#${ch.name}` : `#${targetId}`;
      } else {
        const u = dataStore.getUserById(targetId);
        targetName = u ? u.name : targetId;
      }
    }

    // Remove any existing mute for same target
    this.muteTargets = this.muteTargets.filter(
      (m) => !(m.userId === userId && m.targetType === targetType && m.targetId === targetId)
    );

    const newMute: import('../types/index.js').MuteTarget = {
      id: `mute-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      targetType,
      targetId,
      targetName,
      mutedUntil,
      createdAt: new Date().toISOString(),
    };

    this.muteTargets.push(newMute);
    return newMute;
  }

  unmuteTarget(userId: string, targetType: 'channel' | 'dm', targetId: string): boolean {
    const initialLen = this.muteTargets.length;
    this.muteTargets = this.muteTargets.filter(
      (m) => !(m.userId === userId && m.targetType === targetType && m.targetId === targetId)
    );
    return this.muteTargets.length < initialLen;
  }

  getNotifications(userId: string): Notification[] {
    return this.notifications
      .filter((n) => n.recipientId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getUnreadCount(userId: string): number {
    return this.notifications.filter((n) => n.recipientId === userId && !n.isRead).length;
  }

  createNotification(params: {
    recipientId: string;
    senderId?: string;
    senderName?: string;
    senderAvatar?: string;
    type: NotificationType;
    title: string;
    content: string;
    link?: { type: 'channel' | 'dm' | 'task'; id: string };
  }): Notification | null {
    // Check if channel is muted
    if (params.link?.type === 'channel' && this.isTargetMuted(params.recipientId, 'channel', params.link.id)) {
      return null;
    }

    // Check if DM partner is muted
    if (
      (params.type === 'dm' || params.link?.type === 'dm') &&
      ((params.senderId && this.isTargetMuted(params.recipientId, 'dm', params.senderId)) ||
        (params.link?.id && this.isTargetMuted(params.recipientId, 'dm', params.link.id)))
    ) {
      return null;
    }

    let senderName = params.senderName;
    let senderAvatar = params.senderAvatar;

    if (params.senderId && (!senderName || !senderAvatar)) {
      const sender = dataStore.getUserById(params.senderId);
      if (sender) {
        senderName = senderName || sender.name;
        senderAvatar = senderAvatar || sender.avatar;
      }
    }

    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipientId: params.recipientId,
      senderId: params.senderId,
      senderName,
      senderAvatar,
      type: params.type,
      title: params.title,
      content: params.content,
      link: params.link,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(notification);
    // Keep max 200 notifications in memory to prevent leak
    if (this.notifications.length > 200) {
      this.notifications = this.notifications.slice(0, 200);
    }

    prisma.notification
      .create({
        data: {
          id: notification.id,
          recipientId: notification.recipientId,
          senderId: notification.senderId || 'system',
          senderName: notification.senderName || 'System',
          senderAvatar: notification.senderAvatar || null,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          link: (notification.link as any) || undefined,
          isRead: false,
          createdAt: new Date(notification.createdAt),
        },
      })
      .catch((err) => console.warn('Failed to persist notification to PostgreSQL:', err));

    // Emit real-time WebSocket event to recipient
    socketService.emitNewNotification(notification.recipientId, notification);

    return notification;
  }

  markAsRead(notificationId: string, userId: string): boolean {
    const notif = this.notifications.find((n) => n.id === notificationId && n.recipientId === userId);
    if (notif) {
      notif.isRead = true;
      prisma.notification
        .update({
          where: { id: notificationId },
          data: { isRead: true },
        })
        .catch((err) => console.warn('Failed to update notification read status in PostgreSQL:', err));
      return true;
    }
    return false;
  }

  markAllAsRead(userId: string): number {
    let count = 0;
    for (const notif of this.notifications) {
      if (notif.recipientId === userId && !notif.isRead) {
        notif.isRead = true;
        count++;
      }
    }
    if (count > 0) {
      prisma.notification
        .updateMany({
          where: { recipientId: userId, isRead: false },
          data: { isRead: true },
        })
        .catch((err) => console.warn('Failed to update all notifications in PostgreSQL:', err));
    }
    return count;
  }

  deleteNotification(notificationId: string, userId: string): boolean {
    const initialLen = this.notifications.length;
    this.notifications = this.notifications.filter(
      (n) => !(n.id === notificationId && n.recipientId === userId)
    );
    if (this.notifications.length < initialLen) {
      prisma.notification
        .delete({ where: { id: notificationId } })
        .catch((err) => console.warn('Failed to delete notification in PostgreSQL:', err));
      return true;
    }
    return false;
  }
}

export const notificationService = new NotificationService();
