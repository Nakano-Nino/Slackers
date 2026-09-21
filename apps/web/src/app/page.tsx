'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api, authStorage } from '../lib/api';
import {
  Bug,
  BugEnvironment,
  BugSeverity,
  BugStatus,
  Channel,
  DirectMessage,
  Message,
  MuteDuration,
  MuteTarget,
  Notification,
  Project,
  ProjectStats,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from '../types';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { KanbanBoard } from '../components/KanbanBoard';
import { BugTracker } from '../components/BugTracker';
import { ProjectProgressBar } from '../components/ProjectProgressBar';
import { CreateChannelModal } from '../components/CreateChannelModal';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { ProjectMembersModal } from '../components/ProjectMembersModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { ReportBugModal } from '../components/ReportBugModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { AuthModal } from '../components/AuthModal';
import { SettingsModal } from '../components/SettingsModal';
import { NotificationCenter } from '../components/NotificationCenter';
import { ThreadPanel } from '../components/ThreadPanel';
import { CommandPalette } from '../components/CommandPalette';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { E2EEService } from '../lib/e2ee';
import { Bell, X } from 'lucide-react';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App navigation & state
  const [activeView, setActiveView] = useState<'chat' | 'kanban' | 'bugs'>('chat');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-core');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Direct Messaging (E2EE) state
  const [selectedDmUser, setSelectedDmUser] = useState<User | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [decryptedDmMessages, setDecryptedDmMessages] = useState<Record<string, string>>({});
  const [unreadDms, setUnreadDms] = useState<Record<string, number>>({});
  const [myKeyPair, setMyKeyPair] = useState<{
    publicKeyJwk: string;
    privateKey: CryptoKey;
    publicKey: CryptoKey;
  } | null>(null);

  // Project tasks, detail & stats
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);

  // Bug tracking state
  const [bugs, setBugs] = useState<Bug[]>([]);

  // In-app Notifications & Mutes
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);
  const [mutedTargets, setMutedTargets] = useState<MuteTarget[]>([]);

  // Modals
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isProjectMembersModalOpen, setIsProjectMembersModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isReportBugModalOpen, setIsReportBugModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  // Command Palette & Thread Panel state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [threadParentMessage, setThreadParentMessage] = useState<Message | DirectMessage | null>(null);
  const [threadDecryptedContent, setThreadDecryptedContent] = useState<string>('');

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

  // Check URL for invite token on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('invite');
      if (token) {
        setInviteToken(token);
      }
    }
  }, []);

  // Check existing session
  useEffect(() => {
    const checkSession = async () => {
      const token = authStorage.getToken();
      if (!token) {
        setIsAuthChecking(false);
        return;
      }

      try {
        const user = await api.getMe();
        setCurrentUser(user);
      } catch (err) {
        console.warn('Session expired or invalid, please log in:', err);
        authStorage.clearToken();
        setCurrentUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkSession();
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
      setUnreadNotificationCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [currentUser]);

  // Load workspace data when authenticated
  const loadUnreadDms = useCallback(async () => {
    if (!currentUser) return;
    try {
      const counts = await api.getDmUnreadCounts();
      setUnreadDms(counts);
    } catch (err) {
      console.error('Failed to fetch DM unread counts:', err);
    }
  }, [currentUser]);

  const loadMutedTargets = useCallback(async () => {
    if (!currentUser) return;
    try {
      const mutes = await api.getMutedTargets();
      setMutedTargets(mutes);
    } catch (err) {
      console.error('Failed to load muted targets:', err);
    }
  }, [currentUser]);

  const loadWorkspaceData = useCallback(async () => {
    if (!currentUser) return;

    try {
      const [fetchedProjects, fetchedChannels, fetchedUsers, fetchedBugs, unreadCounts, fetchedMutes] = await Promise.all([
        api.getProjects(),
        api.getChannels(),
        api.getUsers(),
        api.getBugs(),
        api.getDmUnreadCounts(),
        api.getMutedTargets(),
      ]);

      setProjects(fetchedProjects);
      setChannels(fetchedChannels);
      setUsers(fetchedUsers);
      setBugs(fetchedBugs);
      setUnreadDms(unreadCounts);
      setMutedTargets(fetchedMutes);
      await loadNotifications();

      const initialProjectId = fetchedProjects.length > 0 ? fetchedProjects[0].id : 'proj-core';
      setSelectedProjectId(initialProjectId);

      if (fetchedChannels.length > 0 && !fetchedChannels.some((c) => c.id === selectedChannelId)) {
        setSelectedChannelId(fetchedChannels[0].id);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  }, [currentUser, loadNotifications]);

  useEffect(() => {
    if (currentUser) {
      loadWorkspaceData();
      // Gentle 30s background sync fallback; real-time socket events provide instantaneous push updates
      const interval = setInterval(() => {
        loadNotifications();
        loadUnreadDms();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, loadWorkspaceData, loadNotifications, loadUnreadDms]);

  // Load tasks & stats whenever selected project changes
  const loadProjectTasksAndStats = useCallback(async (projectId: string) => {
    if (!projectId || !currentUser) return;
    try {
      const [fetchedTasks, fetchedStats, fetchedBugs] = await Promise.all([
        api.getTasks({ projectId }),
        api.getProjectStats(projectId),
        api.getBugs({ projectId }),
      ]);
      setTasks(fetchedTasks);
      setProjectStats(fetchedStats);
      setBugs(fetchedBugs);
    } catch (err) {
      console.error(`Failed to load project details for ${projectId}:`, err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedProjectId && currentUser) {
      loadProjectTasksAndStats(selectedProjectId);
    }
  }, [selectedProjectId, currentUser, loadProjectTasksAndStats]);

  // Load messages whenever selected channel changes
  const loadMessages = useCallback(async (channelId: string) => {
    if (!channelId || !currentUser) return;
    setLoadingMessages(true);
    try {
      const res = await api.getMessages(channelId, { limit: 50 });
      const fetchedMessages = res.messages;
      setHasMoreMessages(res.hasMore);
      const channelKey = await E2EEService.getChannelKey(channelId);
      const decryptedMessages = await Promise.all(
        fetchedMessages.map(async (msg) => {
          if (msg.ciphertext && msg.iv) {
            try {
              const dec = await E2EEService.decrypt(msg.ciphertext, msg.iv, channelKey);
              return { ...msg, decryptedContent: dec };
            } catch {
              return { ...msg, decryptedContent: msg.content || '[Message unavailable]' };
            }
          }
          return { ...msg, decryptedContent: msg.content };
        })
      );
      setMessages(decryptedMessages);
    } catch (err) {
      console.error(`Failed to load messages for channel ${channelId}:`, err);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUser]);

  const loadOlderMessages = useCallback(async () => {
    if (!selectedChannelId || !currentUser || loadingOlderMessages || !hasMoreMessages) return;
    const oldest = messages[0];
    if (!oldest) return;

    setLoadingOlderMessages(true);
    try {
      const res = await api.getMessages(selectedChannelId, { before: oldest.id, limit: 30 });
      const channelKey = await E2EEService.getChannelKey(selectedChannelId);
      const decryptedOlder = await Promise.all(
        res.messages.map(async (msg) => {
          if (msg.ciphertext && msg.iv) {
            try {
              const dec = await E2EEService.decrypt(msg.ciphertext, msg.iv, channelKey);
              return { ...msg, decryptedContent: dec };
            } catch {
              return { ...msg, decryptedContent: msg.content || '[Message unavailable]' };
            }
          }
          return { ...msg, decryptedContent: msg.content };
        })
      );
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const filtered = decryptedOlder.filter((m) => !existingIds.has(m.id));
        return [...filtered, ...prev];
      });
      setHasMoreMessages(res.hasMore);
    } catch (err) {
      console.error('Failed to load older channel messages:', err);
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [selectedChannelId, currentUser, loadingOlderMessages, hasMoreMessages, messages]);

  useEffect(() => {
    if (selectedChannelId && activeView === 'chat' && !selectedDmUser && currentUser) {
      loadMessages(selectedChannelId);
    }
  }, [selectedChannelId, activeView, selectedDmUser, currentUser, loadMessages]);

  // Initialize E2EE KeyPair for current user
  useEffect(() => {
    const initKeyPair = async () => {
      if (!currentUser || myKeyPair) return;
      try {
        const remoteVault = await api.getKeyVault();
        const keyPair = await E2EEService.getOrCreateUserKeyPair(
          currentUser.id,
          undefined,
          remoteVault || undefined
        );
        setMyKeyPair(keyPair);

        if (keyPair.newVaultToSave) {
          await api.saveKeyVault(keyPair.newVaultToSave);
        }

        // If public key is not registered on backend, register it
        if (!currentUser.publicKey || currentUser.publicKey !== keyPair.publicKeyJwk) {
          await api.registerPublicKey(keyPair.publicKeyJwk);
          setCurrentUser((prev) => (prev ? { ...prev, publicKey: keyPair.publicKeyJwk } : prev));
        }
      } catch (err) {
        console.error('Failed to initialize E2EE keypair:', err);
      }
    };

    initKeyPair();
  }, [currentUser?.id, myKeyPair]);

  // Load & Decrypt Direct Messages
  const loadDirectMessages = useCallback(
    async (peerUser: User) => {
      if (!currentUser || !myKeyPair) return;
      setLoadingMessages(true);
      try {
        const res = await api.getDirectMessages(peerUser.id, { limit: 50 });
        const dms = res.messages;
        setDirectMessages(dms);
        setHasMoreMessages(res.hasMore);

        // Fetch legitimate peer public key
        const peerPubKeyStr = await E2EEService.getPeerPublicKey(peerUser.id, peerUser);
        const peerCryptoKey = await E2EEService.importPeerPublicKey(peerPubKeyStr);
        const sharedKey = await E2EEService.getSharedKey(
          currentUser.id,
          peerUser.id,
          myKeyPair.privateKey,
          peerCryptoKey
        );

        const decryptedMap: Record<string, string> = {};
        for (const dm of dms) {
          decryptedMap[dm.id] = await E2EEService.decrypt(dm.ciphertext, dm.iv, sharedKey);
        }
        setDecryptedDmMessages(decryptedMap);
      } catch (err) {
        console.error(`Failed to load direct messages with ${peerUser.name}:`, err);
      } finally {
        setLoadingMessages(false);
      }
    },
    [currentUser, myKeyPair]
  );

  const loadOlderDirectMessages = useCallback(async () => {
    if (!selectedDmUser || !currentUser || !myKeyPair || loadingOlderMessages || !hasMoreMessages) return;
    const oldest = directMessages[0];
    if (!oldest) return;

    setLoadingOlderMessages(true);
    try {
      const res = await api.getDirectMessages(selectedDmUser.id, { before: oldest.id, limit: 30 });
      const peerPubKeyStr = await E2EEService.getPeerPublicKey(selectedDmUser.id, selectedDmUser);
      const peerCryptoKey = await E2EEService.importPeerPublicKey(peerPubKeyStr);
      const sharedKey = await E2EEService.getSharedKey(
        currentUser.id,
        selectedDmUser.id,
        myKeyPair.privateKey,
        peerCryptoKey
      );

      const decryptedMap: Record<string, string> = {};
      for (const dm of res.messages) {
        decryptedMap[dm.id] = await E2EEService.decrypt(dm.ciphertext, dm.iv, sharedKey);
      }
      setDecryptedDmMessages((prev) => ({ ...prev, ...decryptedMap }));
      setDirectMessages((prev) => {
        const existingIds = new Set(prev.map((d) => d.id));
        const filtered = res.messages.filter((d) => !existingIds.has(d.id));
        return [...filtered, ...prev];
      });
      setHasMoreMessages(res.hasMore);
    } catch (err) {
      console.error('Failed to load older direct messages:', err);
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [selectedDmUser, currentUser, myKeyPair, loadingOlderMessages, hasMoreMessages, directMessages]);

  useEffect(() => {
    if (selectedDmUser && activeView === 'chat' && currentUser && myKeyPair) {
      loadDirectMessages(selectedDmUser);
    }
  }, [selectedDmUser, activeView, currentUser, myKeyPair, loadDirectMessages]);

  const handleSendDirectMessage = async (
    content: string,
    options?: { expiresAt?: string }
  ) => {
    if (!currentUser || !selectedDmUser || !myKeyPair) return;

    try {
      const peerPubKeyStr = await E2EEService.getPeerPublicKey(selectedDmUser.id, selectedDmUser);
      const peerCryptoKey = await E2EEService.importPeerPublicKey(peerPubKeyStr);
      const sharedKey = await E2EEService.getSharedKey(
        currentUser.id,
        selectedDmUser.id,
        myKeyPair.privateKey,
        peerCryptoKey
      );

      const { ciphertext, iv } = await E2EEService.encrypt(content, sharedKey);
      const newDm = await api.sendDirectMessage({
        receiverId: selectedDmUser.id,
        ciphertext,
        iv,
        expiresAt: options?.expiresAt,
        clientTimestamp: Date.now(),
      });

      setDecryptedDmMessages((prev) => ({
        ...prev,
        [newDm.id]: content,
      }));

      setDirectMessages((prev) => {
        if (prev.some((d) => d.id === newDm.id)) {
          return prev.map((d) => (d.id === newDm.id ? { ...d, ...newDm } : d));
        }
        return [...prev, { ...newDm, isRead: false, readAt: null }];
      });
    } catch (err) {
      console.error('Failed to send encrypted direct message:', err);
      throw err;
    }
  };

  const handleMarkDmAsRead = useCallback(
    async (partnerId: string) => {
      if (!currentUser) return;
      try {
        await api.markDirectMessagesAsRead(partnerId);
        setUnreadDms((prev) => ({ ...prev, [partnerId]: 0 }));
        setDirectMessages((prev) =>
          prev.map((dm) =>
            dm.senderId === partnerId && dm.receiverId === currentUser.id
              ? { ...dm, isRead: true, readAt: new Date().toISOString() }
              : dm
          )
        );
      } catch (err) {
        console.error('Failed to mark DMs as read:', err);
      }
    },
    [currentUser]
  );

  const refreshCurrentProject = useCallback(async () => {
    if (selectedProjectIdRef.current) {
      await loadProjectTasksAndStats(selectedProjectIdRef.current);
    }
  }, [loadProjectTasksAndStats]);

  // Keep latest refs to avoid stale closures in socket event handlers
  const selectedChannelIdRef = useRef(selectedChannelId);
  selectedChannelIdRef.current = selectedChannelId;

  const selectedDmUserRef = useRef(selectedDmUser);
  selectedDmUserRef.current = selectedDmUser;

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const myKeyPairRef = useRef(myKeyPair);
  myKeyPairRef.current = myKeyPair;

  const selectedProjectIdRef = useRef(selectedProjectId);
  selectedProjectIdRef.current = selectedProjectId;

  const selectedTaskForDetailRef = useRef(selectedTaskForDetail);
  selectedTaskForDetailRef.current = selectedTaskForDetail;

  const decryptedDmMessagesRef = useRef(decryptedDmMessages);
  decryptedDmMessagesRef.current = decryptedDmMessages;

  const activeViewRef = useRef(activeView);
  activeViewRef.current = activeView;

  const mutedTargetsRef = useRef(mutedTargets);
  mutedTargetsRef.current = mutedTargets;

  const threadParentMessageRef = useRef(threadParentMessage);
  threadParentMessageRef.current = threadParentMessage;

  // Global Cmd+K / Ctrl+K keyboard shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time socket event handlers
  const handleIncomingMessage = useCallback(async (msg: Message) => {
    if (msg.channelId === selectedChannelIdRef.current) {
      let decryptedContent = msg.decryptedContent || msg.content;
      if (msg.ciphertext && msg.iv && !decryptedContent) {
        try {
          const channelKey = await E2EEService.getChannelKey(msg.channelId);
          decryptedContent = await E2EEService.decrypt(msg.ciphertext, msg.iv, channelKey);
        } catch {
          decryptedContent = msg.content || '[Message unavailable]';
        }
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          return prev.map((m) =>
            m.id === msg.id
              ? { ...m, ...msg, decryptedContent: m.decryptedContent || decryptedContent }
              : m
          );
        }
        return [...prev, { ...msg, decryptedContent: decryptedContent || msg.content }];
      });
    }
  }, []);

  const handleIncomingDirectMessage = useCallback(
    async (dm: DirectMessage) => {
      const curr = currentUserRef.current;
      const activeDm = selectedDmUserRef.current;
      const keyPair = myKeyPairRef.current;
      if (!curr) return;

      const isWithActiveDm =
        activeDm &&
        ((dm.senderId === activeDm.id && dm.receiverId === curr.id) ||
          (dm.senderId === curr.id && dm.receiverId === activeDm.id));

      if (isWithActiveDm) {
        let decrypted = decryptedDmMessagesRef.current[dm.id];
        if (!decrypted && keyPair) {
          try {
            const peerPubKeyStr = await E2EEService.getPeerPublicKey(activeDm.id, activeDm);
            const peerCryptoKey = await E2EEService.importPeerPublicKey(peerPubKeyStr);
            const sharedKey = await E2EEService.getSharedKey(
              curr.id,
              activeDm.id,
              keyPair.privateKey,
              peerCryptoKey
            );

            decrypted = await E2EEService.decrypt(dm.ciphertext, dm.iv, sharedKey);
            setDecryptedDmMessages((prev) => ({
              ...prev,
              [dm.id]: decrypted,
            }));
          } catch (err) {
            console.error('Failed to decrypt real-time direct message:', err);
            decrypted = '[Message unavailable]';
            setDecryptedDmMessages((prev) => ({
              ...prev,
              [dm.id]: decrypted,
            }));
          }
        } else if (!decrypted) {
          decrypted = '[Message unavailable]';
          setDecryptedDmMessages((prev) => ({
            ...prev,
            [dm.id]: decrypted,
          }));
        }

        setDirectMessages((prev) => {
          if (prev.some((d) => d.id === dm.id)) {
            return prev.map((d) => (d.id === dm.id ? { ...d, ...dm } : d));
          }
          return [...prev, dm];
        });

        if (dm.senderId === activeDm.id) {
          handleMarkDmAsRead(activeDm.id);
        }
      } else if (dm.receiverId === curr.id) {
        setUnreadDms((prev) => ({
          ...prev,
          [dm.senderId]: (prev[dm.senderId] || 0) + 1,
        }));
      }
    },
    [handleMarkDmAsRead]
  );

  const handleIncomingDmRead = useCallback((data: { partnerId: string; readAt: string }) => {
    const activeDm = selectedDmUserRef.current;
    if (activeDm && activeDm.id === data.partnerId) {
      setDirectMessages((prev) =>
        prev.map((dm) =>
          dm.receiverId === data.partnerId && !dm.isRead
            ? { ...dm, isRead: true, readAt: data.readAt }
            : dm
        )
      );
    }
  }, []);

  const handleIncomingNotification = useCallback((notif: Notification) => {
    // Check if target is muted by the user
    const now = Date.now();
    const isTargetMuted = mutedTargetsRef.current.some((m) => {
      const isStillActive = m.mutedUntil === null || new Date(m.mutedUntil).getTime() > now;
      if (!isStillActive) return false;

      if (notif.type === 'message' && m.targetType === 'channel') {
        return m.targetId === notif.link?.id;
      }
      if (notif.type === 'dm' && m.targetType === 'dm') {
        return m.targetId === notif.senderId || m.targetId === notif.link?.id;
      }
      return false;
    });

    if (isTargetMuted) {
      // Target is muted by user: completely suppress toast and unread badge
      return;
    }

    // Suppress popup toast notification if user is already actively viewing this chat window
    const isViewingThisChat =
      activeViewRef.current === 'chat' &&
      ((notif.type === 'dm' && selectedDmUserRef.current?.id === notif.senderId) ||
        (notif.link?.type === 'dm' && selectedDmUserRef.current?.id === notif.link.id) ||
        (notif.type === 'message' && !selectedDmUserRef.current && selectedChannelIdRef.current === notif.link?.id));

    if (isViewingThisChat) {
      // User is already reading this chat window: add to notifications as read, DO NOT show popup toast
      setNotifications((prev) => [
        { ...notif, isRead: true },
        ...prev.filter((n) => n.id !== notif.id),
      ]);
      api.markNotificationAsRead(notif.id).catch(() => {});
      return;
    }

    setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
    setUnreadNotificationCount((prev) => prev + 1);
    setToastNotification(notif);
  }, []);

  const handleIncomingTaskCreated = useCallback(
    (task: Task) => {
      if (task.projectId === selectedProjectIdRef.current) {
        setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [...prev, task]));
        refreshCurrentProject();
      }
    },
    [refreshCurrentProject]
  );

  const handleIncomingTaskUpdated = useCallback(
    (task: Task) => {
      if (task.projectId === selectedProjectIdRef.current) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        if (selectedTaskForDetailRef.current?.id === task.id) {
          setSelectedTaskForDetail(task);
        }
        refreshCurrentProject();
      }
    },
    [refreshCurrentProject]
  );

  const handleIncomingTaskDeleted = useCallback(
    (data: { taskId: string; projectId: string }) => {
      if (data.projectId === selectedProjectIdRef.current) {
        setTasks((prev) => prev.filter((t) => t.id !== data.taskId));
        if (selectedTaskForDetailRef.current?.id === data.taskId) {
          setSelectedTaskForDetail(null);
        }
        refreshCurrentProject();
      }
    },
    [refreshCurrentProject]
  );

  const handleIncomingPresence = useCallback((data: { userId: string; status: 'online' | 'offline' }) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === data.userId ? { ...u, status: data.status } : u))
    );
  }, []);

  const handleIncomingUserCreated = useCallback((newUser: User) => {
    setUsers((prev) => {
      if (prev.some((u) => u.id === newUser.id)) {
        return prev.map((u) => (u.id === newUser.id ? { ...u, ...newUser } : u));
      }
      return [...prev, newUser];
    });
  }, []);

  const handleIncomingMessageReaction = useCallback(
    (data: { channelId: string; messageId: string; reactions: Record<string, string[]> }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m))
      );
      if (threadParentMessageRef.current?.id === data.messageId) {
        setThreadParentMessage((prev) => (prev ? { ...prev, reactions: data.reactions } : prev));
      }
    },
    []
  );

  const handleIncomingMessageEdited = useCallback(
    async (data: { channelId: string; message: Message }) => {
      let dec = data.message.content;
      if (data.message.ciphertext && data.message.iv) {
        try {
          const channelKey = await E2EEService.getChannelKey(data.message.channelId);
          dec = await E2EEService.decrypt(data.message.ciphertext, data.message.iv, channelKey);
        } catch {
          dec = data.message.content;
        }
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === data.message.id ? { ...data.message, decryptedContent: dec } : m))
      );
      if (threadParentMessageRef.current?.id === data.message.id) {
        setThreadParentMessage((prev) => (prev ? { ...data.message, decryptedContent: dec } : prev));
      }
    },
    []
  );

  const handleIncomingMessageDeleted = useCallback(
    (data: { channelId: string; messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, isDeleted: true, ciphertext: '', iv: '', decryptedContent: 'This message was deleted.' }
            : m
        )
      );
      if (threadParentMessageRef.current?.id === data.messageId) {
        setThreadParentMessage((prev) =>
          prev
            ? { ...prev, isDeleted: true, ciphertext: '', iv: '', decryptedContent: 'This message was deleted.' }
            : prev
        );
      }
    },
    []
  );

  const handleIncomingThreadReply = useCallback(
    (data: { channelId: string; parentId: string; reply: Message }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.parentId
            ? {
                ...m,
                replyCount: (m.replyCount || 0) + 1,
                lastReplyAt: data.reply.createdAt,
              }
            : m
        )
      );
      if (threadParentMessageRef.current?.id === data.parentId) {
        setThreadParentMessage((prev) =>
          prev
            ? {
                ...prev,
                replyCount: (prev.replyCount || 0) + 1,
                lastReplyAt: data.reply.createdAt,
              }
            : prev
        );
      }
    },
    []
  );

  const handleIncomingDmReaction = useCallback(
    (data: { messageId: string; reactions: Record<string, string[]> }) => {
      setDirectMessages((prev) =>
        prev.map((dm) => (dm.id === data.messageId ? { ...dm, reactions: data.reactions } : dm))
      );
    },
    []
  );

  const handleIncomingDmEdited = useCallback(
    async (data: { message: DirectMessage }) => {
      const activeDm = selectedDmUserRef.current;
      const curr = currentUserRef.current;
      const keyPair = myKeyPairRef.current;
      if (activeDm && curr && keyPair) {
        try {
          const peerPubKeyStr = await E2EEService.getPeerPublicKey(activeDm.id, activeDm);
          const peerCryptoKey = await E2EEService.importPeerPublicKey(peerPubKeyStr);
          const sharedKey = await E2EEService.getSharedKey(
            curr.id,
            activeDm.id,
            keyPair.privateKey,
            peerCryptoKey
          );
          const dec = await E2EEService.decrypt(data.message.ciphertext, data.message.iv, sharedKey);
          setDecryptedDmMessages((prev) => ({ ...prev, [data.message.id]: dec }));
        } catch (err) {
          console.error('Failed to decrypt real-time edited DM:', err);
        }
      }
      setDirectMessages((prev) =>
        prev.map((dm) => (dm.id === data.message.id ? { ...dm, ...data.message } : dm))
      );
    },
    []
  );

  const handleIncomingDmDeleted = useCallback(
    (data: { messageId: string }) => {
      setDirectMessages((prev) =>
        prev.map((dm) =>
          dm.id === data.messageId
            ? { ...dm, isDeleted: true, ciphertext: '', iv: '' }
            : dm
        )
      );
      setDecryptedDmMessages((prev) => ({
        ...prev,
        [data.messageId]: 'This message was deleted.',
      }));
    },
    []
  );

  const handleLogout = useCallback(async () => {
    disconnectSocket();
    await api.logout();
    setCurrentUser(null);
    setMyKeyPair(null);
    setSelectedDmUser(null);
    setDirectMessages([]);
    setDecryptedDmMessages({});
    setUnreadDms({});
    setNotifications([]);
    setUnreadNotificationCount(0);
    setToastNotification(null);
    setMutedTargets([]);
    setSelectedTaskForDetail(null);
    setProjects([]);
    setTasks([]);
    setBugs([]);
    setMessages([]);
  }, []);

  const handleIncomingSessionRevoked = useCallback(
    (data?: { sessionId?: string }) => {
      const currentSessionId = authStorage.getSessionId();
      // Only destroy current session if event targets this session or 'all-others'
      if (!data?.sessionId || data.sessionId === 'all-others' || data.sessionId === currentSessionId) {
        console.warn('🔒 Current session revoked by server, logging out...');
        handleLogout();
      } else {
        console.log('ℹ️ Remote session revoked, current session unaffected:', data.sessionId);
      }
    },
    [handleLogout]
  );

  // Connect socket and bind real-time event listeners
  useEffect(() => {
    if (!currentUser) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();
    if (!socket) return;

    // Room subscription handler on connect/reconnect
    const handleConnect = () => {
      console.log('⚡ WebSocket connected/reconnected: Joining active channel and project rooms');
      if (selectedChannelIdRef.current) {
        socket.emit('channel:join', selectedChannelIdRef.current);
      }
      if (selectedProjectIdRef.current) {
        socket.emit('project:join', selectedProjectIdRef.current);
      }
    };

    socket.on('connect', handleConnect);
    // If socket connected synchronously
    if (socket.connected) {
      handleConnect();
    }

    socket.on('message:new', handleIncomingMessage);
    socket.on('message:reaction', handleIncomingMessageReaction);
    socket.on('message:edited', handleIncomingMessageEdited);
    socket.on('message:deleted', handleIncomingMessageDeleted);
    socket.on('thread:reply', handleIncomingThreadReply);

    socket.on('dm:new', handleIncomingDirectMessage);
    socket.on('dm:read', handleIncomingDmRead);
    socket.on('dm:reaction', handleIncomingDmReaction);
    socket.on('dm:edited', handleIncomingDmEdited);
    socket.on('dm:deleted', handleIncomingDmDeleted);

    socket.on('notification:new', handleIncomingNotification);
    socket.on('task:created', handleIncomingTaskCreated);
    socket.on('task:updated', handleIncomingTaskUpdated);
    socket.on('task:deleted', handleIncomingTaskDeleted);
    socket.on('presence:update', handleIncomingPresence);
    socket.on('user:created', handleIncomingUserCreated);
    socket.on('session:revoked', handleIncomingSessionRevoked);

    return () => {
      socket.off('connect', handleConnect);

      socket.off('message:new', handleIncomingMessage);
      socket.off('message:reaction', handleIncomingMessageReaction);
      socket.off('message:edited', handleIncomingMessageEdited);
      socket.off('message:deleted', handleIncomingMessageDeleted);
      socket.off('thread:reply', handleIncomingThreadReply);

      socket.off('dm:new', handleIncomingDirectMessage);
      socket.off('dm:read', handleIncomingDmRead);
      socket.off('dm:reaction', handleIncomingDmReaction);
      socket.off('dm:edited', handleIncomingDmEdited);
      socket.off('dm:deleted', handleIncomingDmDeleted);

      socket.off('notification:new', handleIncomingNotification);
      socket.off('task:created', handleIncomingTaskCreated);
      socket.off('task:updated', handleIncomingTaskUpdated);
      socket.off('task:deleted', handleIncomingTaskDeleted);
      socket.off('presence:update', handleIncomingPresence);
      socket.off('user:created', handleIncomingUserCreated);
      socket.off('session:revoked', handleIncomingSessionRevoked);
    };
  }, [
    currentUser,
    handleIncomingMessage,
    handleIncomingMessageReaction,
    handleIncomingMessageEdited,
    handleIncomingMessageDeleted,
    handleIncomingThreadReply,
    handleIncomingDirectMessage,
    handleIncomingDmRead,
    handleIncomingDmReaction,
    handleIncomingDmEdited,
    handleIncomingDmDeleted,
    handleIncomingNotification,
    handleIncomingTaskCreated,
    handleIncomingTaskUpdated,
    handleIncomingTaskDeleted,
    handleIncomingPresence,
    handleIncomingUserCreated,
    handleIncomingSessionRevoked,
  ]);

  // Manage Channel room subscription
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedChannelId) return;

    socket.emit('channel:join', selectedChannelId);
    return () => {
      socket.emit('channel:leave', selectedChannelId);
    };
  }, [selectedChannelId, currentUser]);

  // Manage Project room subscription
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedProjectId) return;

    socket.emit('project:join', selectedProjectId);
    return () => {
      socket.emit('project:leave', selectedProjectId);
    };
  }, [selectedProjectId, currentUser]);

  // Auto-dismiss floating toast notification after 6 seconds
  useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => {
      setToastNotification(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toastNotification]);


  const handleMuteTarget = async (
    targetType: 'channel' | 'dm',
    targetId: string,
    duration: MuteDuration,
    targetName?: string
  ) => {
    try {
      const newMute = await api.muteTarget(targetType, targetId, duration, targetName);
      if (newMute) {
        setMutedTargets((prev) => [
          newMute,
          ...prev.filter((m) => !(m.targetType === targetType && m.targetId === targetId)),
        ]);
      }
    } catch (err) {
      console.error('Failed to mute target:', err);
      throw err;
    }
  };

  const handleUnmuteTarget = async (targetType: 'channel' | 'dm', targetId: string) => {
    try {
      await api.unmuteTarget(targetType, targetId);
      setMutedTargets((prev) =>
        prev.filter((m) => !(m.targetType === targetType && m.targetId === targetId))
      );
    } catch (err) {
      console.error('Failed to unmute target:', err);
      throw err;
    }
  };

  const handleCreateChannel = async (channelData: {
    name: string;
    description: string;
    isPrivate: boolean;
  }) => {
    const newChannel = await api.createChannel(channelData);
    setChannels((prev) => [...prev, newChannel]);
    setSelectedChannelId(newChannel.id);
  };

  const handleCreateProject = async (projectData: {
    name: string;
    key: string;
    description: string;
    isPrivate: boolean;
    memberIds?: string[];
  }) => {
    const newProject = await api.createProject(projectData);
    setProjects((prev) => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
  };

  const handleUpdateProjectMembers = async (projectId: string, memberIds: string[]) => {
    const updated = await api.updateProject(projectId, { memberIds });
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, ...updated } : p)));
  };

  const handleSendMessage = async (
    content: string,
    options?: { expiresAt?: string }
  ) => {
    if (!selectedChannelId) return;
    try {
      const channelKey = await E2EEService.getChannelKey(selectedChannelId);
      const { ciphertext, iv } = await E2EEService.encrypt(content, channelKey);
      const newMessage = await api.sendMessage({
        channelId: selectedChannelId,
        ciphertext,
        iv,
        userId: currentUser?.id,
        expiresAt: options?.expiresAt,
        clientTimestamp: Date.now(),
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev.map((m) =>
            m.id === newMessage.id ? { ...m, ...newMessage, decryptedContent: content } : m
          );
        }
        return [...prev, { ...newMessage, decryptedContent: content }];
      });
    } catch (err) {
      console.error('Failed to send encrypted channel message:', err);
      throw err;
    }
  };

  const handleOpenThread = (msg: Message | DirectMessage, decryptedContent?: string) => {
    setThreadParentMessage(msg);
    setThreadDecryptedContent(decryptedContent || '');
    setIsThreadOpen(true);
  };

  const handleSendThreadReply = async (parentId: string, content: string) => {
    if (!selectedChannelId || !currentUser) return;
    try {
      const channelKey = await E2EEService.getChannelKey(selectedChannelId);
      const { ciphertext, iv } = await E2EEService.encrypt(content, channelKey);
      await api.sendMessage({
        channelId: selectedChannelId,
        ciphertext,
        iv,
        userId: currentUser.id,
        parentId,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === parentId
            ? {
                ...m,
                replyCount: (m.replyCount || 0) + 1,
                lastReplyAt: new Date().toISOString(),
              }
            : m
        )
      );
      if (threadParentMessage?.id === parentId) {
        setThreadParentMessage((prev) =>
          prev
            ? {
                ...prev,
                replyCount: (prev.replyCount || 0) + 1,
                lastReplyAt: new Date().toISOString(),
              }
            : prev
        );
      }
    } catch (err) {
      console.error('Failed to send thread reply:', err);
      throw err;
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string, isDm: boolean) => {
    try {
      if (isDm) {
        const res = await api.toggleDmReaction(messageId, emoji);
        setDirectMessages((prev) =>
          prev.map((dm) => (dm.id === messageId ? { ...dm, reactions: res.reactions } : dm))
        );
      } else {
        const res = await api.toggleMessageReaction(messageId, emoji);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: res.reactions } : m))
        );
        if (threadParentMessage?.id === messageId) {
          setThreadParentMessage((prev) => (prev ? { ...prev, reactions: res.reactions } : prev));
        }
      }
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  const handleToggleThreadReaction = async (messageId: string, emoji: string) => {
    await handleToggleReaction(messageId, emoji, false);
  };

  const handleEditMessage = async (messageId: string, newContent: string, isDm: boolean) => {
    try {
      if (isDm) {
        if (!selectedDmUser || !myKeyPair || !currentUser) return;
        const peerPubKeyStr = await E2EEService.getPeerPublicKey(selectedDmUser.id, selectedDmUser);
        const peerCryptoKey = await E2EEService.importPeerPublicKey(peerPubKeyStr);
        const sharedKey = await E2EEService.getSharedKey(
          currentUser.id,
          selectedDmUser.id,
          myKeyPair.privateKey,
          peerCryptoKey
        );
        const { ciphertext, iv } = await E2EEService.encrypt(newContent, sharedKey);
        const res = await api.editDirectMessage(messageId, ciphertext, iv);
        setDirectMessages((prev) =>
          prev.map((dm) => (dm.id === messageId ? { ...dm, ...res } : dm))
        );
        setDecryptedDmMessages((prev) => ({ ...prev, [messageId]: newContent }));
      } else {
        if (!selectedChannelId) return;
        const channelKey = await E2EEService.getChannelKey(selectedChannelId);
        const { ciphertext, iv } = await E2EEService.encrypt(newContent, channelKey);
        const res = await api.editMessage(messageId, ciphertext, iv);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, ...res, decryptedContent: newContent } : m))
        );
        if (threadParentMessage?.id === messageId) {
          setThreadParentMessage((prev) =>
            prev ? { ...prev, ...res, decryptedContent: newContent } : prev
          );
        }
      }
    } catch (err) {
      console.error('Failed to edit message:', err);
      throw err;
    }
  };

  const handleDeleteMessage = async (messageId: string, isDm: boolean) => {
    try {
      if (isDm) {
        await api.deleteDirectMessage(messageId);
        setDirectMessages((prev) =>
          prev.map((dm) =>
            dm.id === messageId ? { ...dm, isDeleted: true, ciphertext: '', iv: '' } : dm
          )
        );
        setDecryptedDmMessages((prev) => ({ ...prev, [messageId]: 'This message was deleted.' }));
      } else {
        await api.deleteMessage(messageId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, ciphertext: '', iv: '', decryptedContent: 'This message was deleted.' }
              : m
          )
        );
        if (threadParentMessage?.id === messageId) {
          setThreadParentMessage((prev) =>
            prev
              ? { ...prev, isDeleted: true, ciphertext: '', iv: '', decryptedContent: 'This message was deleted.' }
              : prev
          );
        }
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      throw err;
    }
  };

  const handleNavigateChannel = (channelId: string) => {
    setSelectedDmUser(null);
    setSelectedChannelId(channelId);
    setActiveView('chat');
  };

  const handleNavigateDM = (partnerId: string) => {
    const partner = users.find((u) => u.id === partnerId);
    if (partner) {
      setSelectedDmUser(partner);
      setActiveView('chat');
    }
  };

  const handleNavigateTask = async (taskId: string) => {
    const existing = tasks.find((t) => t.id === taskId);
    if (existing) {
      setSelectedProjectId(existing.projectId);
      setSelectedTaskForDetail(existing);
      setActiveView('kanban');
    } else {
      try {
        const allTasks = await api.getTasks();
        const found = allTasks.find((t) => t.id === taskId);
        if (found) {
          setSelectedProjectId(found.projectId);
          setSelectedTaskForDetail(found);
          setActiveView('kanban');
        }
      } catch (err) {
        console.error('Failed to locate task from notification:', err);
      }
    }
  };

  const handleCreateTask = async (taskData: {
    projectId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    storyPoints: number;
    tags: string[];
    dueDate?: string;
    assigneeId?: string;
    qaSteps?: Array<{ title: string; description?: string }>;
  }) => {
    const newTask = await api.createTask(taskData);
    if (newTask.projectId === selectedProjectId) {
      setTasks((prev) => [...prev, newTask]);
    }
    await refreshCurrentProject();
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail((prev) => (prev ? { ...prev, status: newStatus } : prev));
    }

    try {
      await api.updateTask(taskId, { status: newStatus });
      await refreshCurrentProject();
    } catch (err) {
      console.error('Failed to update task status:', err);
      await refreshCurrentProject();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail(null);
    }
    try {
      await api.deleteTask(taskId);
      await refreshCurrentProject();
    } catch (err) {
      console.error('Failed to delete task:', err);
      await refreshCurrentProject();
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updated = await api.updateTask(taskId, updates);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (selectedTaskForDetail?.id === taskId) {
        setSelectedTaskForDetail(updated);
      }
      await refreshCurrentProject();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleTaskCommentCountChange = (taskId: string, count: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, commentCount: count } : t))
    );
    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail((prev) =>
        prev ? { ...prev, commentCount: count } : prev
      );
    }
  };

  // Bug Handlers
  const handleCreateBug = async (bugData: {
    projectId: string;
    title: string;
    description: string;
    severity: BugSeverity;
    environment: BugEnvironment;
    reproductionSteps?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    assignedToId?: string;
  }) => {
    const newBug = await api.createBug(bugData);
    setBugs((prev) => [newBug, ...prev]);
    await refreshCurrentProject();
  };

  const handleUpdateBugStatus = async (bugId: string, newStatus: BugStatus) => {
    setBugs((prev) =>
      prev.map((b) => (b.id === bugId ? { ...b, status: newStatus } : b))
    );

    try {
      await api.updateBug(bugId, { status: newStatus });
    } catch (err) {
      console.error('Failed to update bug status:', err);
      await refreshCurrentProject();
    }
  };

  const handleDeleteBug = async (bugId: string) => {
    setBugs((prev) => prev.filter((b) => b.id !== bugId));
    try {
      await api.deleteBug(bugId);
    } catch (err) {
      console.error('Failed to delete bug:', err);
      await refreshCurrentProject();
    }
  };

  const handleConvertBugToTask = async (bugId: string) => {
    try {
      const result = await api.convertBugToTask(bugId);
      // Update bug state with linked task and in_progress status
      setBugs((prev) =>
        prev.map((b) => (b.id === bugId ? result.bug : b))
      );
      // Add created task into tasks state
      if (result.task.projectId === selectedProjectId) {
        setTasks((prev) => [...prev, result.task]);
      }
      await refreshCurrentProject();
    } catch (err) {
      console.error('Failed to convert bug to task:', err);
    }
  };

  const handleDiscussInChat = async (task: Task) => {
    const targetChannel = channels.find((c) => c.name === 'engineering') || channels[0];
    const channelId = targetChannel ? targetChannel.id : selectedChannelId;

    setSelectedChannelId(channelId);
    setActiveView('chat');

    const discussionMessage = `📋 **Task Discussion**: [${task.projectName || 'Project'}] ${task.title}\n> ${task.description || 'No description provided.'}\n* **Status**: \`${task.status.replace('_', ' ').toUpperCase()}\`\n* **Priority**: \`${task.priority.toUpperCase()}\`\n* **Story Points**: ${task.storyPoints} pts\n* **Assignee**: ${task.assignee?.name || 'Unassigned'}`;

    try {
      const channelKey = await E2EEService.getChannelKey(channelId);
      const { ciphertext, iv } = await E2EEService.encrypt(discussionMessage, channelKey);
      const newMsg = await api.sendMessage({
        channelId,
        ciphertext,
        iv,
        userId: currentUser?.id,
        taskId: task.id,
      });
      setMessages((prev) => [...prev, { ...newMsg, decryptedContent: discussionMessage }]);
    } catch (err) {
      console.error('Failed to send task discussion to chat:', err);
    }
  };

  const handleDiscussBugInChat = async (bug: Bug) => {
    const targetChannel = channels.find((c) => c.name === 'engineering') || channels[0];
    const channelId = targetChannel ? targetChannel.id : selectedChannelId;

    setSelectedChannelId(channelId);
    setActiveView('chat');

    const bugMessage = `🚨 **Bug Ticket Alert**: [${bug.severity.toUpperCase()} / ${bug.environment.toUpperCase()}] ${bug.title}\n> ${bug.description}\n* **Status**: \`${bug.status.toUpperCase()}\`\n* **Reported By**: ${bug.reportedBy?.name || 'Anonymous'}\n* **Assignee**: ${bug.assignedTo?.name || 'Unassigned'}\n* **Reproduction**: \`${bug.reproductionSteps || 'See defect card'}\``;

    try {
      const channelKey = await E2EEService.getChannelKey(channelId);
      const { ciphertext, iv } = await E2EEService.encrypt(bugMessage, channelKey);
      const newMsg = await api.sendMessage({
        channelId,
        ciphertext,
        iv,
        userId: currentUser?.id,
        bugId: bug.id,
      });
      setMessages((prev) => [...prev, { ...newMsg, decryptedContent: bugMessage }]);
    } catch (err) {
      console.error('Failed to send bug discussion to chat:', err);
    }
  };

  const handleAuthSuccess = async (user: User, password?: string) => {
    try {
      const remoteVault = await api.getKeyVault();
      const keyPair = await E2EEService.getOrCreateUserKeyPair(
        user.id,
        password,
        remoteVault || undefined
      );
      setMyKeyPair(keyPair);

      if (keyPair.newVaultToSave) {
        await api.saveKeyVault(keyPair.newVaultToSave);
      }

      if (!user.publicKey || user.publicKey !== keyPair.publicKeyJwk) {
        await api.registerPublicKey(keyPair.publicKeyJwk);
        user.publicKey = keyPair.publicKeyJwk;
      }
    } catch (err) {
      console.error('Failed to initialize E2EE keypair on login:', err);
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('invite')) {
        url.searchParams.delete('invite');
        window.history.replaceState({}, '', url.pathname);
      }
    }
    setInviteToken(null);
    setCurrentUser(user);
  };

  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-neutral-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg text-lg animate-pulse">
            S
          </div>
          <p className="text-sm font-medium text-neutral-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Authentication Guard
  if (!currentUser) {
    return (
      <AuthModal
        onSuccess={handleAuthSuccess}
        inviteToken={inviteToken}
        onClearInviteToken={() => {
          setInviteToken(null);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('invite');
            window.history.replaceState({}, '', url.pathname);
          }
        }}
      />
    );
  }

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null;
  const criticalBugCount = bugs.filter((b) => b.severity === 'critical' && b.status !== 'closed' && b.status !== 'resolved').length;

  const notificationElement = (
    <NotificationCenter
      notifications={notifications}
      unreadCount={unreadNotificationCount}
      onRefresh={loadNotifications}
      onNavigateChannel={handleNavigateChannel}
      onNavigateDM={handleNavigateDM}
      onNavigateTask={handleNavigateTask}
    />
  );

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-neutral-950 font-sans text-slate-900 dark:text-neutral-100 transition-colors">
      <Sidebar
        channels={channels}
        selectedChannelId={selectedDmUser ? '' : selectedChannelId}
        onSelectChannel={(id) => {
          setSelectedDmUser(null);
          setSelectedChannelId(id);
        }}
        onOpenCreateChannel={() => setIsChannelModalOpen(true)}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        users={users}
        currentUser={currentUser}
        activeView={activeView}
        onSelectView={setActiveView}
        taskCount={tasks.length}
        bugCount={bugs.length}
        criticalBugCount={criticalBugCount}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        selectedDmUserId={selectedDmUser?.id}
        onSelectDmUser={(user) => {
          setSelectedDmUser(user);
          setActiveView('chat');
        }}
        unreadDms={unreadDms}
        mutedTargets={mutedTargets}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenInviteMember={() => setIsInviteMemberModalOpen(true)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-neutral-900 transition-colors">
        {activeView === 'chat' ? (
          <ChatArea
            channel={selectedDmUser ? null : selectedChannel}
            selectedDmUser={selectedDmUser}
            messages={messages}
            directMessages={directMessages}
            decryptedDmMessages={decryptedDmMessages}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
            onSendDirectMessage={handleSendDirectMessage}
            onMarkDmAsRead={handleMarkDmAsRead}
            loadingMessages={loadingMessages}
            notificationElement={notificationElement}
            mutedTargets={mutedTargets}
            onMuteTarget={handleMuteTarget}
            onUnmuteTarget={handleUnmuteTarget}
            onOpenThread={handleOpenThread}
            onToggleReaction={handleToggleReaction}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            hasMoreMessages={hasMoreMessages}
            loadingOlderMessages={loadingOlderMessages}
            onLoadOlderMessages={selectedDmUser ? loadOlderDirectMessages : loadOlderMessages}
          />
        ) : activeView === 'kanban' ? (
          <div className="flex-1 flex flex-col h-full p-6 overflow-hidden">
            {/* Header with Title & Backend Status */}
            <div className="flex items-center justify-between mb-4 shrink-0 relative z-30">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                  Project Kanban Board
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Manage deliverables, assignees, priorities, and workflow progress across projects.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {notificationElement}
              </div>
            </div>

            {/* Project Progress Bar */}
            <ProjectProgressBar
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setSelectedProjectId}
              stats={projectStats}
              currentUserRole={currentUser.role}
              currentUserId={currentUser.id}
              onOpenCreateTask={() => setIsTaskModalOpen(true)}
              onOpenCreateProject={() => setIsProjectModalOpen(true)}
              onOpenManageMembers={() => setIsProjectMembersModalOpen(true)}
            />

            {/* Kanban Board */}
            <KanbanBoard
              tasks={tasks}
              users={users}
              currentUser={currentUser}
              currentUserRole={currentUser.role}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onDeleteTask={handleDeleteTask}
              onDiscussInChat={handleDiscussInChat}
              onSelectTask={(task) => setSelectedTaskForDetail(task)}
              onCreateTask={(currentUser.role === 'admin' || currentUser.role === 'manager') ? handleCreateTask : undefined}
              selectedProjectId={selectedProjectId}
              onToggleSubtask={async (taskId, subtaskId, currentCompleted) => {
                const updated = await api.updateSubtask(taskId, subtaskId, {
                  isCompleted: !currentCompleted,
                });
                setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
                if (selectedTaskForDetail?.id === taskId) {
                  setSelectedTaskForDetail(updated);
                }
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full p-6 overflow-hidden">
            {/* Bug Tracker View Header */}
            <div className="flex items-center justify-between mb-4 shrink-0 relative z-30">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                  Bug & Defect Tracker
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Log, triage, and resolve software defects with cross-team chat alerts and Kanban conversion.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {notificationElement}
              </div>
            </div>

            {/* Bug Tracker Component */}
            <BugTracker
              bugs={bugs}
              projects={projects}
              users={users}
              currentUserRole={currentUser.role}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onOpenReportBug={() => setIsReportBugModalOpen(true)}
              onUpdateBugStatus={handleUpdateBugStatus}
              onDeleteBug={handleDeleteBug}
              onConvertToTask={handleConvertBugToTask}
              onDiscussInChat={handleDiscussBugInChat}
            />
          </div>
        )}
      </div>

      <CreateChannelModal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        onCreate={handleCreateChannel}
      />

      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreate={handleCreateProject}
        users={users}
        currentUser={currentUser}
      />

      {activeProject && (
        <ProjectMembersModal
          isOpen={isProjectMembersModalOpen}
          project={activeProject}
          users={users}
          currentUser={currentUser}
          onClose={() => setIsProjectMembersModalOpen(false)}
          onUpdateMembers={handleUpdateProjectMembers}
        />
      )}

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreate={handleCreateTask}
        projects={projects}
        defaultProjectId={selectedProjectId}
        users={users}
        currentUser={currentUser}
      />

      <ReportBugModal
        isOpen={isReportBugModalOpen}
        onClose={() => setIsReportBugModalOpen(false)}
        onCreate={handleCreateBug}
        projects={projects}
        defaultProjectId={selectedProjectId}
        users={users}
      />

      {selectedTaskForDetail && (
        <TaskDetailModal
          isOpen={!!selectedTaskForDetail}
          task={selectedTaskForDetail}
          projects={projects}
          users={users}
          currentUser={currentUser}
          onClose={() => setSelectedTaskForDetail(null)}
          onUpdateStatus={handleUpdateTaskStatus}
          onUpdateTask={handleUpdateTask}
          onTaskUpdated={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setSelectedTaskForDetail(updated);
          }}
          onDeleteTask={handleDeleteTask}
          onDiscussInChat={handleDiscussInChat}
          onCommentCountChange={handleTaskCommentCountChange}
        />
      )}

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updatedUser, passwordChanged) => {
          setCurrentUser(updatedUser);
          setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)));
          if (passwordChanged) {
            setToastNotification({
              id: `pwd-changed-${Date.now()}`,
              recipientId: updatedUser.id,
              senderId: 'system',
              senderName: 'Slackers Security',
              type: 'message',
              title: 'Password Changed Successfully',
              content: 'Your account password has been updated and your account has been secured.',
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }
        }}
        mutedTargets={mutedTargets}
        onUnmuteTarget={handleUnmuteTarget}
      />

      {/* Slide-out Thread Panel */}
      <ThreadPanel
        isOpen={isThreadOpen}
        onClose={() => {
          setIsThreadOpen(false);
          setThreadParentMessage(null);
          setThreadDecryptedContent('');
        }}
        parentMessage={threadParentMessage}
        parentDecryptedContent={threadDecryptedContent}
        channel={selectedDmUser ? null : selectedChannel}
        selectedDmUser={selectedDmUser}
        currentUser={currentUser}
        onSendReply={handleSendThreadReply}
        onToggleReaction={handleToggleThreadReaction}
      />

      {/* Global Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        channels={channels}
        users={users}
        projects={projects}
        tasks={tasks}
        onSelectChannel={handleNavigateChannel}
        onSelectDmUser={(user) => {
          setSelectedDmUser(user);
          setActiveView('chat');
        }}
        onSelectTask={(task) => {
          handleNavigateTask(task.id);
        }}
        onSelectProject={(projId) => {
          setSelectedProjectId(projId);
          setActiveView('kanban');
        }}
        onOpenCreateTask={(currentUser?.role === 'admin' || currentUser?.role === 'manager') ? () => setIsTaskModalOpen(true) : undefined}
        onOpenReportBug={() => setIsReportBugModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenInviteMember={() => setIsInviteMemberModalOpen(true)}
      />

      {/* Invite / Add Member Modal */}
      <InviteMemberModal
        isOpen={isInviteMemberModalOpen}
        onClose={() => setIsInviteMemberModalOpen(false)}
        currentUser={currentUser}
        onMemberAdded={(newMember) => {
          setUsers((prev) => (prev.some((u) => u.id === newMember.id) ? prev : [...prev, newMember]));
        }}
      />

      {/* Real-Time Floating Notification Toast */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-neutral-900/95 border border-neutral-700/80 rounded-xl shadow-2xl p-4 flex items-start space-x-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200 transition-all">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-200 truncate">
                {toastNotification.title}
              </h4>
              <button
                onClick={() => setToastNotification(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-md transition"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
              {toastNotification.content}
            </p>
            {toastNotification.link && (
              <button
                onClick={() => {
                  if (toastNotification.link?.type === 'channel') {
                    handleNavigateChannel(toastNotification.link.id);
                  } else if (toastNotification.link?.type === 'dm') {
                    handleNavigateDM(toastNotification.link.id);
                  } else if (toastNotification.link?.type === 'task') {
                    handleNavigateTask(toastNotification.link.id);
                  }
                  setToastNotification(null);
                }}
                className="mt-2.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <span>Open item</span>
                <span>&rarr;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
