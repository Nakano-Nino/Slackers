import { DirectMessage, User } from '../types/index.js';
import { dataStore } from './dataStore.js';
import { mongoLogger } from './mongoLogger.js';
import { prisma } from './db.js';

class DmService {
  async initFromDb(): Promise<void> {
    try {
      const dbDMs = await prisma.directMessage.findMany({
        orderBy: { createdAt: 'asc' },
      });
      if (dbDMs.length > 0) {
        this.messages = dbDMs.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          receiverId: m.receiverId,
          ciphertext: m.ciphertext,
          iv: m.iv,
          senderCopy: m.senderCopy || undefined,
          isRead: m.isRead,
          readAt: m.readAt ? m.readAt.toISOString() : null,
          isEdited: m.isEdited,
          isDeleted: m.isDeleted,
          editedAt: m.editedAt ? m.editedAt.toISOString() : undefined,
          reactions: (m.reactions as any) || undefined,
          createdAt: m.createdAt.toISOString(),
        }));
      }
      console.log(`📦 DmService synchronized with PostgreSQL: ${this.messages.length} direct messages.`);
    } catch (err: unknown) {
      console.warn('⚠️  DmService could not load from PostgreSQL:', err instanceof Error ? err.message : err);
    }
  }

  private messages: DirectMessage[] = [
    {
      id: 'dm-seed-1',
      senderId: 'u-1', // Sarah Connor (Admin)
      receiverId: 'u-3', // Jordan Lee (Member)
      ciphertext: 'U2FsdGVkX1+m108/eXpY+seedEncryptedPayloadArchitectureReview==',
      iv: '4bW1jP2PZk91Z3lF',
      isRead: true,
      readAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'dm-seed-2',
      senderId: 'u-3', // Jordan Lee
      receiverId: 'u-1', // Sarah Connor
      ciphertext: 'U2FsdGVkX18m9102XpQ+seedEncryptedPayloadConfirmingReviewStatus==',
      iv: '9lZ3lF4bW1jP2PZk',
      isRead: true,
      readAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'dm-seed-3',
      senderId: 'u-3', // Jordan Lee -> Sarah Connor (UNREAD)
      receiverId: 'u-1',
      ciphertext: 'U2FsdGVkX17m3012XpQ+seedEncryptedPRReviewRequestForSarah==',
      iv: '2lZ3lF4bW1jP2PZk',
      isRead: false,
      readAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'dm-seed-4',
      senderId: 'u-5', // Morgan Vance -> Sarah Connor (UNREAD 1)
      receiverId: 'u-1',
      ciphertext: 'U2FsdGVkX1+morganEncryptedKeyVaultAuditSummaryReady==',
      iv: '3aB1jP2PZk91Z3lF',
      isRead: false,
      readAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    },
    {
      id: 'dm-seed-5',
      senderId: 'u-5', // Morgan Vance -> Sarah Connor (UNREAD 2)
      receiverId: 'u-1',
      ciphertext: 'U2FsdGVkX1+morganEncryptedZeroTrustKeyRotationPolicy==',
      iv: '8cB1jP2PZk91Z3lF',
      isRead: false,
      readAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 'dm-seed-6',
      senderId: 'u-7', // Marcus Chen -> Sarah Connor (UNREAD)
      receiverId: 'u-1',
      ciphertext: 'U2FsdGVkX1+marcusFrontendTokensMergedCleanSlateUI==',
      iv: '7dB1jP2PZk91Z3lF',
      isRead: false,
      readAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 'dm-seed-7',
      senderId: 'u-6', // Elena Rostova -> Sarah Connor (READ)
      receiverId: 'u-1',
      ciphertext: 'U2FsdGVkX1+elenaNewFigmaTokensUpdatedForKanbanCards==',
      iv: '6eB1jP2PZk91Z3lF',
      isRead: true,
      readAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    },
    {
      id: 'dm-seed-8',
      senderId: 'u-2', // Alex Rivera -> Jordan Lee (UNREAD)
      receiverId: 'u-3',
      ciphertext: 'U2FsdGVkX1+alexManagerDirectTaskAssignmentNotification==',
      iv: '5fB1jP2PZk91Z3lF',
      isRead: false,
      readAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
  ];

  private enrichMessage(msg: DirectMessage): DirectMessage {
    const sender = dataStore.getUserById(msg.senderId);
    const receiver = dataStore.getUserById(msg.receiverId);
    return {
      ...msg,
      sender: sender ? { id: sender.id, name: sender.name, email: sender.email, avatar: sender.avatar, status: sender.status, role: sender.role, developerRole: sender.developerRole } : undefined,
      receiver: receiver ? { id: receiver.id, name: receiver.name, email: receiver.email, avatar: receiver.avatar, status: receiver.status, role: receiver.role, developerRole: receiver.developerRole } : undefined,
    };
  }

  getConversation(userAId: string, userBId: string): DirectMessage[] {
    return this.messages
      .filter(
        (m) =>
          (m.senderId === userAId && m.receiverId === userBId) ||
          (m.senderId === userBId && m.receiverId === userAId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((m) => this.enrichMessage(m));
  }

  async sendEncryptedMessage(
    senderId: string,
    receiverId: string,
    ciphertext: string,
    iv: string,
    senderCopy?: string
  ): Promise<DirectMessage> {
    const sender = dataStore.getUserById(senderId);
    const receiver = dataStore.getUserById(receiverId);

    if (!receiver) {
      throw new Error(`Recipient user with id "${receiverId}" does not exist.`);
    }

    const newMsg: DirectMessage = {
      id: `dm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId,
      receiverId,
      ciphertext,
      iv,
      senderCopy,
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    this.messages.push(newMsg);

    await prisma.directMessage
      .create({
        data: {
          id: newMsg.id,
          senderId: newMsg.senderId,
          receiverId: newMsg.receiverId,
          ciphertext: newMsg.ciphertext,
          iv: newMsg.iv,
          senderCopy: newMsg.senderCopy || null,
          isRead: false,
          createdAt: new Date(newMsg.createdAt),
        },
      })
      .catch((err) => console.warn('Failed to persist directMessage to PostgreSQL:', err));

    if (sender) {
      await mongoLogger.log(
        'DM_SENT',
        {
          messageId: newMsg.id,
          senderId,
          receiverId,
          receiverName: receiver.name,
          encrypted: true,
          algorithm: 'AES-GCM-256',
        },
        sender
      );
    }

    return this.enrichMessage(newMsg);
  }

  getUnreadCounts(userId: string): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const msg of this.messages) {
      if (msg.receiverId === userId && !msg.isRead) {
        counts[msg.senderId] = (counts[msg.senderId] || 0) + 1;
      }
    }
    return counts;
  }

  markConversationAsRead(userId: string, partnerId: string): number {
    let markedCount = 0;
    const now = new Date().toISOString();
    for (const msg of this.messages) {
      if (msg.receiverId === userId && msg.senderId === partnerId && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = now;
        markedCount++;
      }
    }

    if (markedCount > 0) {
      prisma.directMessage
        .updateMany({
          where: {
            receiverId: userId,
            senderId: partnerId,
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: new Date(now),
          },
        })
        .catch((err) => console.warn('Failed to update directMessage read status in PostgreSQL:', err));
    }

    return markedCount;
  }

  getRecentConversations(userId: string): { user: User; lastMessage: DirectMessage; unreadCount: number }[] {
    const partnerMap = new Map<string, DirectMessage>();

    // Process from newest to oldest
    const userMessages = this.messages
      .filter((m) => m.senderId === userId || m.receiverId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    for (const msg of userMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, msg);
      }
    }

    const unreadCounts = this.getUnreadCounts(userId);
    const conversations: { user: User; lastMessage: DirectMessage; unreadCount: number }[] = [];
    for (const [partnerId, lastMsg] of partnerMap.entries()) {
      const partner = dataStore.getUserById(partnerId);
      if (partner) {
        conversations.push({
          user: partner,
          lastMessage: this.enrichMessage(lastMsg),
          unreadCount: unreadCounts[partnerId] || 0,
        });
      }
    }

    return conversations;
  }

  getMessageById(id: string): DirectMessage | undefined {
    const msg = this.messages.find((m) => m.id === id);
    return msg ? this.enrichMessage(msg) : undefined;
  }

  toggleReaction(messageId: string, emoji: string, userId: string): DirectMessage | null {
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

    prisma.directMessage
      .update({
        where: { id: messageId },
        data: { reactions: message.reactions },
      })
      .catch((err) => console.warn('Failed to update directMessage reactions in PostgreSQL:', err));

    return this.enrichMessage(message);
  }

  editDirectMessage(
    messageId: string,
    ciphertext: string,
    iv: string,
    userId: string,
    senderCopy?: string
  ): DirectMessage | null {
    const message = this.messages.find((m) => m.id === messageId);
    if (!message) return null;

    if (message.senderId !== userId) {
      throw new Error('Permission denied: Only the sender can edit their message');
    }

    message.ciphertext = ciphertext;
    message.iv = iv;
    if (senderCopy) message.senderCopy = senderCopy;
    message.isEdited = true;
    message.editedAt = new Date().toISOString();

    prisma.directMessage
      .update({
        where: { id: messageId },
        data: {
          ciphertext: message.ciphertext,
          iv: message.iv,
          senderCopy: message.senderCopy || null,
          isEdited: true,
          editedAt: new Date(message.editedAt),
        },
      })
      .catch((err) => console.warn('Failed to persist directMessage edit to PostgreSQL:', err));

    return this.enrichMessage(message);
  }

  deleteDirectMessage(messageId: string, userId: string, isAdmin: boolean): DirectMessage | null {
    const message = this.messages.find((m) => m.id === messageId);
    if (!message) return null;

    if (message.senderId !== userId && !isAdmin) {
      throw new Error('Permission denied: You can only delete your own messages');
    }

    message.isDeleted = true;
    message.ciphertext = '';
    message.senderCopy = '';

    prisma.directMessage
      .update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          ciphertext: '',
          senderCopy: '',
        },
      })
      .catch((err) => console.warn('Failed to persist directMessage delete to PostgreSQL:', err));

    return this.enrichMessage(message);
  }
}

export const dmService = new DmService();
