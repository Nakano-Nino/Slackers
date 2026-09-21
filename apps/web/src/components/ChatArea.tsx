'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Hash,
  Lock,
  Send,
  Users,
  Sparkles,
  MessageCircle,
  Shield,
  ShieldCheck,
  Info,
  Check,
  CheckCheck,
  Bell,
  BellOff,
  Clock,
  Calendar,
  Infinity as InfinityIcon,
  Volume2,
  Paperclip,
  Download,
  FileText,
  X,
  Pencil,
  Trash2,
  Smile,
  MessageSquare,
  Search,
  ChevronUp,
  ChevronDown,
  Loader2,
  ShieldAlert,
  Flame,
  Timer,
  Copy,
  CheckCircle2,
  QrCode,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';
import { Channel, DirectMessage, Message, MuteDuration, MuteTarget, User } from '../types';
import { getUserRoleBadge } from '../lib/roles';
import { getSocket } from '../lib/socket';
import { api } from '../lib/api';
import { E2EEService } from '../lib/e2ee';
import {
  encryptFileBlob,
  decryptFileBlob,
  formatFileSize,
  FileAttachmentMetadata,
} from '../lib/fileCrypto';
import { formatChatDate, isDifferentDay } from '../lib/dateUtils';

interface Props {
  channel: Channel | null;
  selectedDmUser: User | null;
  messages: Message[];
  directMessages: DirectMessage[];
  decryptedDmMessages: Record<string, string>;
  currentUser: User | null;
  users?: User[];
  onSendMessage: (content: string, options?: { expiresAt?: string }) => Promise<void>;
  onSendDirectMessage: (content: string, options?: { expiresAt?: string }) => Promise<void>;
  onMarkDmAsRead?: (partnerId: string) => void;
  loadingMessages: boolean;
  notificationElement?: React.ReactNode;
  mutedTargets?: MuteTarget[];
  onMuteTarget?: (
    targetType: 'channel' | 'dm',
    targetId: string,
    duration: MuteDuration,
    targetName?: string
  ) => Promise<void>;
  onUnmuteTarget?: (targetType: 'channel' | 'dm', targetId: string) => Promise<void>;
  onOpenThread?: (message: Message | DirectMessage, decryptedContent?: string) => void;
  onToggleReaction?: (messageId: string, emoji: string, isDm: boolean) => Promise<void>;
  onEditMessage?: (messageId: string, newContent: string, isDm: boolean) => Promise<void>;
  onDeleteMessage?: (messageId: string, isDm: boolean) => Promise<void>;
  hasMoreMessages?: boolean;
  loadingOlderMessages?: boolean;
  onLoadOlderMessages?: () => Promise<void>;
}

function EncryptedAttachmentCard({ attachment }: { attachment: FileAttachmentMetadata }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isImage = attachment.mimeType && attachment.mimeType.startsWith('image/');

  useEffect(() => {
    let active = true;
    if (isImage && !blobUrl) {
      setLoading(true);
      api
        .downloadEncryptedFile(attachment.fileId)
        .then(async (encryptedBuffer) => {
          const decryptedBlob = await decryptFileBlob(
            encryptedBuffer,
            attachment.fileKey,
            attachment.fileIv,
            attachment.mimeType
          );
          if (active) {
            const url = URL.createObjectURL(decryptedBlob);
            setBlobUrl(url);
          }
        })
        .catch((err) => {
          if (active) setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [attachment.fileId, attachment.fileIv, attachment.fileKey, attachment.mimeType, isImage, blobUrl]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      let url = blobUrl;
      if (!url) {
        const encryptedBuffer = await api.downloadEncryptedFile(attachment.fileId);
        const decryptedBlob = await decryptFileBlob(
          encryptedBuffer,
          attachment.fileKey,
          attachment.fileIv,
          attachment.mimeType
        );
        url = URL.createObjectURL(decryptedBlob);
      }
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  if (isImage) {
    return (
      <div className="mt-2 max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-slate-100/50 dark:bg-neutral-900/50 shadow-sm">
        {loading ? (
          <div className="h-44 flex flex-col items-center justify-center gap-2 text-xs text-slate-400 dark:text-neutral-500">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading Image...</span>
          </div>
        ) : blobUrl ? (
          <>
            <img
              src={blobUrl}
              alt={attachment.name}
              onClick={() => setLightboxOpen(true)}
              className="max-h-72 w-auto object-cover rounded-t-lg cursor-pointer hover:opacity-95 transition"
            />
            <div className="p-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900/80 border-t border-slate-200 dark:border-neutral-800">
              <span className="truncate max-w-[200px]" title={attachment.name}>
                {attachment.name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span>{formatFileSize(attachment.size)}</span>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="hover:text-indigo-500 transition p-1"
                  title="Download image"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {lightboxOpen && (
              <div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                onClick={() => setLightboxOpen(false)}
              >
                <div className="relative max-w-4xl max-h-[90vh]">
                  <img
                    src={blobUrl}
                    alt={attachment.name}
                    className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
                  />
                  <button
                    onClick={() => setLightboxOpen(false)}
                    className="absolute -top-3 -right-3 bg-neutral-900 text-white p-1.5 rounded-full border border-neutral-700 hover:bg-neutral-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 text-xs text-rose-500">Failed to load image: {error}</div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center justify-between p-3 max-w-md rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/90 dark:bg-neutral-900/70 shadow-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-neutral-100 truncate" title={attachment.name}>
            {attachment.name}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
            <span>{formatFileSize(attachment.size)}</span>
            {attachment.storage === 'minio' && (
              <>
                <span>•</span>
                <span className="text-indigo-500 font-medium font-mono text-[9px] bg-indigo-500/10 px-1 rounded">MinIO S3</span>
              </>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="ml-3 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/30 transition shrink-0 flex items-center gap-1.5"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{downloading ? 'Downloading...' : 'Download'}</span>
      </button>
    </div>
  );
}

function ChatDateDivider({ date }: { date: string }) {
  const label = formatChatDate(date);
  if (!label) return null;

  return (
    <div className="sticky top-0 z-10 flex items-center justify-center my-4 py-1 select-none pointer-events-none">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wide rounded-full bg-slate-200/90 dark:bg-neutral-800/90 text-slate-700 dark:text-neutral-300 shadow-xs border border-slate-300/60 dark:border-neutral-700/60 backdrop-blur-md pointer-events-auto">
        <Calendar className="w-3 h-3 text-slate-500 dark:text-neutral-400" />
        <span>{label}</span>
      </div>
    </div>
  );
}

function highlightMatches(text: string, query?: string) {
  if (!query || !query.trim() || !text) return text;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="bg-amber-300 dark:bg-amber-500/40 text-slate-950 dark:text-amber-100 rounded px-0.5 font-medium"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function extractPlainText(rawContent: string): string {
  if (!rawContent) return '';
  if (rawContent.startsWith('{') && rawContent.endsWith('}')) {
    try {
      const obj = JSON.parse(rawContent);
      if (obj && typeof obj.text === 'string') return obj.text;
    } catch {
      // ignore
    }
  }
  return rawContent;
}

function RenderDecryptedContent({
  content,
  highlightQuery,
}: {
  content: string;
  highlightQuery?: string;
}) {
  let parsed: { text?: string; file?: FileAttachmentMetadata } | null = null;
  if (content && content.startsWith('{') && content.endsWith('}')) {
    try {
      const obj = JSON.parse(content);
      if (obj && (obj.text !== undefined || obj.file)) {
        parsed = obj;
      }
    } catch {
      // plain text
    }
  }

  if (parsed) {
    return (
      <div>
        {parsed.text && (
          <p className="text-sm text-slate-800 dark:text-neutral-300 mt-1 leading-relaxed break-words whitespace-pre-wrap">
            {highlightMatches(parsed.text, highlightQuery)}
          </p>
        )}
        {parsed.file && <EncryptedAttachmentCard attachment={parsed.file} />}
      </div>
    );
  }

  return (
    <p className="text-sm text-slate-800 dark:text-neutral-300 mt-1 leading-relaxed break-words whitespace-pre-wrap">
      {highlightMatches(content, highlightQuery)}
    </p>
  );
}

export function ChatArea({
  channel,
  selectedDmUser,
  messages,
  directMessages,
  decryptedDmMessages,
  currentUser,
  users = [],
  onSendMessage,
  onSendDirectMessage,
  onMarkDmAsRead,
  loadingMessages,
  notificationElement,
  mutedTargets = [],
  onMuteTarget,
  onUnmuteTarget,
  onOpenThread,
  onToggleReaction,
  onEditMessage,
  onDeleteMessage,
  hasMoreMessages = false,
  loadingOlderMessages = false,
  onLoadOlderMessages,
}: Props) {
  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    if (currentUser) map.set(currentUser.id, currentUser);
    return map;
  }, [users, currentUser]);

  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isMuteMenuOpen, setIsMuteMenuOpen] = useState(false);
  const muteDropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSendingRef = useRef(false);

  // Client-Side E2EE Search State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reverse Infinite Scroll State & Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isPrependingRef = useRef<boolean>(false);

  // File Attachment State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentStaging, setAttachmentStaging] = useState<{
    name: string;
    size: string;
    isImage: boolean;
    previewUrl?: string;
  } | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Message Editing State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingIsDm, setEditingIsDm] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const handleStartEdit = (messageId: string, currentContent: string, isDm: boolean) => {
    setEditingMessageId(messageId);
    setEditingText(currentContent);
    setEditingIsDm(isDm);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      if (onEditMessage) {
        await onEditMessage(editingMessageId, editingText.trim(), editingIsDm);
      }
      setEditingMessageId(null);
      setEditingText('');
    } catch (err) {
      console.error('Failed to edit message:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (messageId: string, isDm: boolean) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      if (onDeleteMessage) {
        await onDeleteMessage(messageId, isDm);
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // ==========================================
  // Security & Resilience (Signal / Matrix Standards)
  // ==========================================
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetyData, setSafetyData] = useState<{
    safetyNumber: string;
    blocks: string[];
    myFingerprint: string;
    peerFingerprint: string;
  } | null>(null);
  const [peerKeyStatus, setPeerKeyStatus] = useState<'verified' | 'unverified' | 'key_changed'>('unverified');
  const [dismissKeyWarning, setDismissKeyWarning] = useState(false);

  // Ephemeral / Disappearing Messages State
  const [ephemeralTimer, setEphemeralTimer] = useState<number>(0);
  const [isTimerMenuOpen, setIsTimerMenuOpen] = useState(false);
  const timerMenuRef = useRef<HTMLDivElement>(null);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // 1-second ticker for live disappearing messages countdown and auto-shredding
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync conversation timer from localStorage and evaluate peer verification status
  useEffect(() => {
    let active = true;
    if (selectedDmUser && currentUser) {
      setDismissKeyWarning(false);
      const savedTimer = localStorage.getItem(`slackers_ephemeral_dm_${selectedDmUser.id}`);
      setEphemeralTimer(savedTimer ? parseInt(savedTimer, 10) : 0);

      E2EEService.getPeerPublicKey(selectedDmUser.id, selectedDmUser)
        .then(async (peerPubKey) => {
          if (!active) return;
          const statusResult = await E2EEService.getPeerKeyStatus(
            currentUser.id,
            selectedDmUser.id,
            peerPubKey
          );
          if (!active) return;
          setPeerKeyStatus(statusResult.status);
        })
        .catch((err) => {
          console.warn('Failed to evaluate peer key status:', err);
        });
    } else if (channel) {
      const savedTimer = localStorage.getItem(`slackers_ephemeral_channel_${channel.id}`);
      setEphemeralTimer(savedTimer ? parseInt(savedTimer, 10) : 0);
    }
    return () => {
      active = false;
    };
  }, [selectedDmUser, currentUser, channel]);

  const handleOpenSafetyModal = async () => {
    if (!currentUser || !selectedDmUser) return;
    setSafetyLoading(true);
    setShowSafetyModal(true);
    try {
      const myPub = currentUser.publicKey || localStorage.getItem(`slackers_e2ee_pub_${currentUser.id}`) || '';
      const peerPub = await E2EEService.getPeerPublicKey(selectedDmUser.id, selectedDmUser);
      const res = await E2EEService.computeSafetyNumber(currentUser.id, myPub, selectedDmUser.id, peerPub);
      setSafetyData(res);
      const statusRes = await E2EEService.getPeerKeyStatus(currentUser.id, selectedDmUser.id, peerPub);
      setPeerKeyStatus(statusRes.status);
    } catch (err) {
      console.warn('Error computing safety numbers:', err);
    } finally {
      setSafetyLoading(false);
    }
  };

  const handleToggleVerifyPeer = async () => {
    if (!currentUser || !selectedDmUser) return;
    try {
      const peerPub = await E2EEService.getPeerPublicKey(selectedDmUser.id, selectedDmUser);
      if (peerKeyStatus === 'verified') {
        E2EEService.markPeerAsUnverified(currentUser.id, selectedDmUser.id);
        setPeerKeyStatus('unverified');
      } else {
        await E2EEService.markPeerAsVerified(currentUser.id, selectedDmUser.id, peerPub);
        setPeerKeyStatus('verified');
        setDismissKeyWarning(true);
      }
    } catch (err) {
      console.warn('Failed to update peer verification:', err);
    }
  };

  const handleSelectEphemeralTimer = (seconds: number) => {
    setEphemeralTimer(seconds);
    setIsTimerMenuOpen(false);
    if (selectedDmUser) {
      localStorage.setItem(`slackers_ephemeral_dm_${selectedDmUser.id}`, seconds.toString());
    } else if (channel) {
      localStorage.setItem(`slackers_ephemeral_channel_${channel.id}`, seconds.toString());
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (muteDropdownRef.current && !muteDropdownRef.current.contains(event.target as Node)) {
        setIsMuteMenuOpen(false);
      }
      if (timerMenuRef.current && !timerMenuRef.current.contains(event.target as Node)) {
        setIsTimerMenuOpen(false);
      }
    }
    if (isMuteMenuOpen || isTimerMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMuteMenuOpen, isTimerMenuOpen]);

  // Guarantee strictly unique keys in UI feed and filter out expired disappearing messages
  const uniqueDirectMessages = React.useMemo(() => {
    const seen = new Set<string>();
    const result: DirectMessage[] = [];
    for (const dm of directMessages) {
      if (!seen.has(dm.id)) {
        if (dm.expiresAt && new Date(dm.expiresAt).getTime() <= nowTimestamp) {
          continue; // Ephemerally shredded
        }
        seen.add(dm.id);
        result.push(dm);
      }
    }
    return result;
  }, [directMessages, nowTimestamp]);

  const uniqueMessages = React.useMemo(() => {
    const seen = new Set<string>();
    const result: Message[] = [];
    for (const msg of messages) {
      // Thread replies are only displayed inside the dedicated ThreadPanel
      if (!seen.has(msg.id) && !msg.parentId) {
        if (msg.expiresAt && new Date(msg.expiresAt).getTime() <= nowTimestamp) {
          continue; // Ephemerally shredded
        }
        seen.add(msg.id);
        result.push(msg);
      }
    }
    return result;
  }, [messages, nowTimestamp]);

  const isDmMode = !!selectedDmUser;

  const targetType: 'channel' | 'dm' = isDmMode ? 'dm' : 'channel';
  const targetId = isDmMode ? selectedDmUser?.id : channel?.id;
  const targetName = isDmMode ? selectedDmUser?.name : channel ? `#${channel.name}` : undefined;

  const currentMute = React.useMemo(() => {
    if (!targetId || !mutedTargets) return null;
    return (
      mutedTargets.find(
        (m) =>
          m.targetType === targetType &&
          m.targetId === targetId &&
          (m.mutedUntil === null || new Date(m.mutedUntil).getTime() > Date.now())
      ) || null
    );
  }, [targetType, targetId, mutedTargets]);

  const isMuted = !!currentMute;

  const getMuteDescription = (mute: MuteTarget) => {
    if (!mute.mutedUntil) {
      return 'Muted indefinitely (until you turn it back on)';
    }
    const expiry = new Date(mute.mutedUntil);
    return `Muted until ${expiry.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })} at ${expiry.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const MUTE_OPTIONS: { duration: MuteDuration; label: string; desc: string; icon: typeof Clock }[] = [
    { duration: '1_day', label: 'For 24 hours', desc: 'Mute for 1 day', icon: Clock },
    { duration: '1_week', label: 'For 7 days', desc: 'Mute for 1 week', icon: Calendar },
    { duration: '1_month', label: 'For 30 days', desc: 'Mute for 1 month', icon: Calendar },
    { duration: 'forever', label: 'Forever', desc: 'Until you turn it back on', icon: InfinityIcon },
  ];

  const handleSelectMute = async (duration: MuteDuration) => {
    if (!targetId || !onMuteTarget) return;
    try {
      await onMuteTarget(targetType, targetId, duration, targetName);
      setIsMuteMenuOpen(false);
    } catch (err) {
      console.error('Failed to mute notifications:', err);
    }
  };

  const handleUnmute = async () => {
    if (!targetId || !onUnmuteTarget) return;
    try {
      await onUnmuteTarget(targetType, targetId);
      setIsMuteMenuOpen(false);
    } catch (err) {
      console.error('Failed to unmute notifications:', err);
    }
  };

  // Compute Client-Side E2EE Search Results
  const searchResults = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    if (isDmMode) {
      return uniqueDirectMessages
        .filter((dm) => !dm.isDeleted)
        .map((dm) => {
          const text = extractPlainText(decryptedDmMessages[dm.id] || '');
          const sender = dm.senderId === currentUser?.id ? currentUser : selectedDmUser;
          return {
            id: dm.id,
            text,
            createdAt: dm.createdAt,
            senderName: sender?.name || 'User',
            senderAvatar: sender?.avatar,
          };
        })
        .filter((item) => item.text.toLowerCase().includes(query));
    } else {
      return uniqueMessages
        .filter((m) => !m.parentId && !m.isDeleted)
        .map((m) => {
          const text = extractPlainText(m.decryptedContent || m.content || '');
          const authorUser = !m.isBot ? usersMap.get(m.userId) : null;
          return {
            id: m.id,
            text,
            createdAt: m.createdAt,
            senderName: authorUser?.name || m.userName || 'User',
            senderAvatar: authorUser?.avatar || m.userAvatar,
          };
        })
          .filter((item) => item.text.toLowerCase().includes(query));
      }
    }, [searchQuery, isDmMode, uniqueDirectMessages, decryptedDmMessages, currentUser, selectedDmUser, uniqueMessages, usersMap]);

  const jumpToMatch = (index: number) => {
    if (searchResults.length === 0) return;
    const boundedIndex = (index + searchResults.length) % searchResults.length;
    setCurrentMatchIndex(boundedIndex);
    const target = searchResults[boundedIndex];
    if (target) {
      setHighlightedMessageId(target.id);
      const el = document.getElementById(`msg-${target.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  useEffect(() => {
    if (!highlightedMessageId) return;
    const timer = setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [highlightedMessageId]);

  // Keyboard shortcut: Cmd/Ctrl + F to toggle in-chat search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setSearchOpen((prev) => {
          const next = !prev;
          if (next) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reverse Infinite Scroll: Detect scroll near top
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (
      container.scrollTop <= 60 &&
      hasMoreMessages &&
      !loadingOlderMessages &&
      onLoadOlderMessages
    ) {
      isPrependingRef.current = true;
      prevScrollHeightRef.current = container.scrollHeight;
      onLoadOlderMessages();
    }
  };

  // Scroll Anchoring: Maintain scroll offset after prepending older messages
  React.useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isPrependingRef.current) {
      const heightDifference = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = heightDifference;
      isPrependingRef.current = false;
    }
  }, [uniqueMessages.length, uniqueDirectMessages.length]);

  // Initial scroll to bottom on conversation change
  const activeConvoKey = isDmMode ? selectedDmUser?.id : channel?.id;
  const prevConvoKeyRef = useRef<string | undefined>(activeConvoKey);

  useEffect(() => {
    if (prevConvoKeyRef.current !== activeConvoKey) {
      prevConvoKeyRef.current = activeConvoKey;
      setSearchOpen(false);
      setSearchQuery('');
      setHighlightedMessageId(null);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 60);
    }
  }, [activeConvoKey]);

  // Smooth scroll to bottom on new incoming messages if already near bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (!isPrependingRef.current) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 250;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [uniqueMessages.length, uniqueDirectMessages.length]);

  useEffect(() => {
    if (isDmMode && selectedDmUser && onMarkDmAsRead) {
      onMarkDmAsRead(selectedDmUser.id);
    }
  }, [isDmMode, selectedDmUser?.id, directMessages.length, onMarkDmAsRead]);

  // Real-time typing listeners
  useEffect(() => {
    setTypingUsers([]);
    const socket = getSocket();
    if (!socket) return;

    const handleTypingUpdate = (data: {
      channelId?: string;
      dmPartnerId?: string;
      user: { id: string; name: string };
      isTyping: boolean;
    }) => {
      // Don't show typing for self
      if (data.user.id === currentUser?.id) return;

      const isCurrentChannel = channel && data.channelId === channel.id;
      const isCurrentDm = selectedDmUser && data.dmPartnerId === currentUser?.id && data.user.id === selectedDmUser.id;

      if (isCurrentChannel || isCurrentDm) {
        setTypingUsers((prev) => {
          if (data.isTyping) {
            return prev.includes(data.user.name) ? prev : [...prev, data.user.name];
          } else {
            return prev.filter((name) => name !== data.user.name);
          }
        });
      }
    };

    socket.on('typing:update', handleTypingUpdate);
    return () => {
      socket.off('typing:update', handleTypingUpdate);
    };
  }, [channel?.id, selectedDmUser?.id, currentUser?.id]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const socket = getSocket();
    if (!socket) return;

    if (val.trim()) {
      socket.emit('typing:start', {
        channelId: channel?.id,
        dmPartnerId: selectedDmUser?.id,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', {
          channelId: channel?.id,
          dmPartnerId: selectedDmUser?.id,
        });
      }, 1500);
    } else {
      socket.emit('typing:stop', {
        channelId: channel?.id,
        dmPartnerId: selectedDmUser?.id,
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('File exceeds 50 MB limit.');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

    setSelectedFile(file);
    setAttachmentStaging({
      name: file.name,
      size: formatFileSize(file.size),
      isImage,
      previewUrl,
    });
  };

  const handleRemoveAttachment = () => {
    if (attachmentStaging?.previewUrl) {
      URL.revokeObjectURL(attachmentStaging.previewUrl);
    }
    setSelectedFile(null);
    setAttachmentStaging(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const textToSend = content.trim();
    if ((!textToSend && !selectedFile) || isSendingRef.current || sending || isEncrypting) return;

    isSendingRef.current = true;
    setSending(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    const socket = getSocket();
    socket?.emit('typing:stop', {
      channelId: channel?.id,
      dmPartnerId: selectedDmUser?.id,
    });

    const fileToUpload = selectedFile;
    setContent('');
    setSelectedFile(null);
    setAttachmentStaging(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      let finalPayload = textToSend;

      // If an attachment is included, encrypt zero-knowledge client-side and upload
      if (fileToUpload) {
        setIsEncrypting(true);
        const encrypted = await encryptFileBlob(fileToUpload);
        const uploadRes = await api.uploadEncryptedFile(
          encrypted.encryptedBlob,
          encrypted.originalName,
          encrypted.mimeType
        );

        const structuredPayload = {
          text: textToSend,
          file: {
            fileId: uploadRes.fileId,
            name: encrypted.originalName,
            size: encrypted.size,
            mimeType: encrypted.mimeType,
            fileKey: encrypted.fileKey,
            fileIv: encrypted.fileIv,
            storage: uploadRes.storage,
          },
        };
        finalPayload = JSON.stringify(structuredPayload);
        setIsEncrypting(false);
      }

      const sendOptions =
        ephemeralTimer > 0
          ? { expiresAt: new Date(Date.now() + ephemeralTimer * 1000).toISOString() }
          : undefined;

      if (isDmMode) {
        await onSendDirectMessage(finalPayload, sendOptions);
      } else {
        await onSendMessage(finalPayload, sendOptions);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Restore content on failure
      setContent(textToSend);
      if (fileToUpload) {
        setSelectedFile(fileToUpload);
        setAttachmentStaging({
          name: fileToUpload.name,
          size: formatFileSize(fileToUpload.size),
          isImage: fileToUpload.type.startsWith('image/'),
          previewUrl: fileToUpload.type.startsWith('image/')
            ? URL.createObjectURL(fileToUpload)
            : undefined,
        });
      }
    } finally {
      isSendingRef.current = false;
      setSending(false);
      setIsEncrypting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!channel && !selectedDmUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-neutral-900/50 text-slate-500 dark:text-neutral-400">
        <MessageCircle className="w-12 h-12 text-slate-400 dark:text-neutral-600 mb-3" />
        <p className="text-base font-medium text-slate-700 dark:text-neutral-300">No conversation selected</p>
        <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1">
          Select a channel or teammate from the sidebar to start chatting
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-neutral-900 transition-colors">
      {/* Header */}
      <header className="h-14 px-6 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-white/80 dark:bg-neutral-950/60 backdrop-blur-sm shrink-0 relative z-30">
        {isDmMode ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={selectedDmUser.avatar}
                alt={selectedDmUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/40"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-neutral-950 ${
                  selectedDmUser.status === 'online'
                    ? 'bg-emerald-500'
                    : selectedDmUser.status === 'away'
                    ? 'bg-amber-500'
                    : 'bg-neutral-500'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-neutral-100 text-sm">
                  {selectedDmUser.name}
                </h2>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${getUserRoleBadge(selectedDmUser).class}`}>
                  {getUserRoleBadge(selectedDmUser).label}
                </span>
                <button
                  type="button"
                  onClick={handleOpenSafetyModal}
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                    peerKeyStatus === 'verified'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                      : peerKeyStatus === 'key_changed'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/25 animate-pulse'
                      : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-700'
                  }`}
                  title={
                    peerKeyStatus === 'verified'
                      ? 'Safety numbers verified (Cross-Signed). Click to inspect.'
                      : peerKeyStatus === 'key_changed'
                      ? 'Security Warning: Contact key has changed! Click to verify.'
                      : 'Secure connection. Click to verify safety numbers.'
                  }
                >
                  {peerKeyStatus === 'verified' ? (
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  ) : peerKeyStatus === 'key_changed' ? (
                    <ShieldAlert className="w-3 h-3 text-rose-500" />
                  ) : (
                    <Shield className="w-3 h-3 text-slate-500 dark:text-neutral-400" />
                  )}
                  <span>
                    {peerKeyStatus === 'verified'
                      ? 'Verified'
                      : peerKeyStatus === 'key_changed'
                      ? 'Key Changed'
                      : 'Secure'}
                  </span>
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 truncate max-w-md">
                {selectedDmUser.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-100 dark:bg-neutral-800 rounded-lg text-slate-600 dark:text-neutral-300">
              {channel?.isPrivate ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-neutral-100 text-sm flex items-center gap-1.5">
                  {channel?.name}
                  {channel?.isPrivate && (
                    <span className="text-[10px] bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 px-1.5 py-0.5 rounded">
                      private
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 truncate max-w-md">
                {channel?.description || 'Welcome to the start of this channel!'}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {isDmMode ? (
            <button
              onClick={handleOpenSafetyModal}
              className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                peerKeyStatus === 'verified'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  : peerKeyStatus === 'key_changed'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/25 animate-pulse'
                  : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800'
              }`}
              title="Click to view and verify cryptographic safety numbers"
            >
              {peerKeyStatus === 'verified' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              ) : peerKeyStatus === 'key_changed' ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
              )}
              <span>
                {peerKeyStatus === 'verified'
                  ? 'Safety Numbers Verified'
                  : peerKeyStatus === 'key_changed'
                  ? 'Key Changed (Review)'
                  : 'Verify Numbers'}
              </span>
            </button>
          ) : (
            channel && (
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-neutral-800">
                  <Users className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                  <span>{channel.memberCount} members</span>
                </div>
              </div>
            )
          )}

          {/* Disappearing Messages Timer Dropdown */}
          <div className="relative" ref={timerMenuRef}>
            <button
              onClick={() => setIsTimerMenuOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                ephemeralTimer > 0
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800'
              }`}
              title={
                ephemeralTimer > 0
                  ? `Disappearing messages active: ${
                      ephemeralTimer < 60
                        ? `${ephemeralTimer}s`
                        : ephemeralTimer < 3600
                        ? `${Math.floor(ephemeralTimer / 60)}m`
                        : `${Math.floor(ephemeralTimer / 3600)}h`
                    }`
                  : 'Configure disappearing messages'
              }
            >
              <Timer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {ephemeralTimer === 0
                  ? 'Disappearing'
                  : ephemeralTimer === 30
                  ? '30s'
                  : ephemeralTimer === 300
                  ? '5m'
                  : ephemeralTimer === 3600
                  ? '1h'
                  : ephemeralTimer === 86400
                  ? '24h'
                  : '7d'}
              </span>
            </button>

            {isTimerMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                  Disappearing Messages
                </div>
                {[
                  { label: 'Off', seconds: 0 },
                  { label: '30 seconds', seconds: 30 },
                  { label: '5 minutes', seconds: 300 },
                  { label: '1 hour', seconds: 3600 },
                  { label: '24 hours', seconds: 86400 },
                  { label: '7 days', seconds: 604800 },
                ].map((opt) => (
                  <button
                    key={opt.seconds}
                    onClick={() => handleSelectEphemeralTimer(opt.seconds)}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer ${
                      ephemeralTimer === opt.seconds
                        ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {ephemeralTimer === opt.seconds && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Messages in Conversation */}
          <button
            onClick={() => {
              setSearchOpen((prev) => {
                const next = !prev;
                if (next) {
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                } else {
                  setSearchQuery('');
                  setHighlightedMessageId(null);
                }
                return next;
              });
            }}
            title="Search messages (⌘F / Ctrl+F)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              searchOpen
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline text-[9px] bg-black/10 dark:bg-white/10 px-1 py-0.2 rounded font-mono">
              ⌘F
            </kbd>
          </button>

          {/* Mute Notifications Dropdown */}
          <div className="relative" ref={muteDropdownRef}>
            <button
              onClick={() => setIsMuteMenuOpen((prev) => !prev)}
              title={
                isMuted
                  ? currentMute
                    ? getMuteDescription(currentMute)
                    : 'Notifications muted'
                  : `Turn off notifications for ${targetName || 'this conversation'}`
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                isMuted
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                  : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800'
              }`}
            >
              {isMuted ? (
                <>
                  <BellOff className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span className="hidden sm:inline text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    Muted
                  </span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400" />
                  <span className="hidden sm:inline text-[11px]">Mute</span>
                </>
              )}
            </button>

            {isMuteMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-slate-200 dark:border-neutral-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                {isMuted && currentMute ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                      <BellOff className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                      <div className="text-xs">
                        <p className="font-semibold">Notifications Muted</p>
                        <p className="text-[11px] text-amber-600/90 dark:text-amber-300/80 mt-0.5">
                          {getMuteDescription(currentMute)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleUnmute}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Turn Notifications Back On</span>
                    </button>

                    <div className="pt-2 border-t border-slate-100 dark:border-neutral-800">
                      <p className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 mb-1.5">
                        Change duration:
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {MUTE_OPTIONS.map((opt) => (
                          <button
                            key={opt.duration}
                            onClick={() => handleSelectMute(opt.duration)}
                            className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-neutral-800 text-left text-[11px] text-slate-700 dark:text-neutral-300 transition"
                          >
                            <opt.icon className="w-3 h-3 text-slate-400 dark:text-neutral-500 shrink-0" />
                            <span className="truncate">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 pb-2.5 mb-2 border-b border-slate-100 dark:border-neutral-800">
                      <BellOff className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-neutral-100">
                          Mute {targetName || 'Conversation'}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-neutral-400">
                          Turn off alerts and badges for this conversation
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {MUTE_OPTIONS.map((opt) => (
                        <button
                          key={opt.duration}
                          onClick={() => handleSelectMute(opt.duration)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 text-left transition group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-md bg-slate-100 dark:bg-neutral-800 group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-slate-500 dark:text-neutral-400 transition">
                              <opt.icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-800 dark:text-neutral-200">
                                {opt.label}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-neutral-500">
                                {opt.desc}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {notificationElement}
        </div>
      </header>

      {/* Key Change / MITM Security Warning Banner */}
      {isDmMode && selectedDmUser && peerKeyStatus === 'key_changed' && !dismissKeyWarning && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-3 flex items-center justify-between gap-4 text-amber-900 dark:text-amber-200 animate-in fade-in duration-200 shrink-0">
          <div className="flex items-center gap-2.5 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <span className="font-semibold">Security Credentials Changed:</span> The security credentials for {selectedDmUser.name} have changed. This could indicate they reinstalled Slackers or logged in on a new device.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenSafetyModal}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition cursor-pointer"
            >
              Verify Safety Number
            </button>
            <button
              onClick={() => setDismissKeyWarning(true)}
              className="p-1 rounded text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Collapsible E2EE Search Bar */}
      {searchOpen && (
        <div className="px-6 py-2.5 bg-slate-50/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150 shrink-0">
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentMatchIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) {
                      jumpToMatch(currentMatchIndex - 1);
                    } else {
                      jumpToMatch(currentMatchIndex + 1);
                    }
                  } else if (e.key === 'Escape') {
                    setSearchOpen(false);
                    setSearchQuery('');
                    setHighlightedMessageId(null);
                  }
                }}
                placeholder={
                  isDmMode
                    ? `Search messages with ${selectedDmUser?.name || 'user'}...`
                    : `Search messages in #${channel?.name || 'channel'}...`
                }
                className="w-full pl-9 pr-24 py-1.5 text-xs bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-slate-400 dark:text-neutral-500">
                {searchQuery.trim() ? (
                  <span>
                    {searchResults.length > 0
                      ? `${currentMatchIndex + 1} of ${searchResults.length}`
                      : '0 matches'}
                  </span>
                ) : (
                  <span className="text-[10px] hidden sm:inline">Press ↵</span>
                )}
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => jumpToMatch(currentMatchIndex - 1)}
                  title="Previous match (Shift+Enter)"
                  className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-200 dark:hover:bg-neutral-800 transition"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => jumpToMatch(currentMatchIndex + 1)}
                  title="Next match (Enter)"
                  className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-200 dark:hover:bg-neutral-800 transition"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
                setHighlightedMessageId(null);
              }}
              title="Close search (Esc)"
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-5"
      >
        {/* Reverse Infinite Scroll Top Sentinel & Loading Indicator */}
        <div className="flex flex-col items-center justify-center pt-1 pb-2">
          {loadingOlderMessages ? (
            <div className="flex items-center gap-2 text-xs text-indigo-500 dark:text-indigo-400 py-1.5 px-3 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading older messages...</span>
            </div>
          ) : hasMoreMessages ? (
            <button
              onClick={() => onLoadOlderMessages?.()}
              className="text-xs text-slate-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 px-3 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 transition border border-dashed border-slate-300 dark:border-neutral-700"
            >
              ↑ Load older messages
            </button>
          ) : null}
        </div>

        {isDmMode ? (
          /* DM Banner */
          !hasMoreMessages && (
            <div className="pb-6 border-b border-slate-200 dark:border-neutral-800/80 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                Direct Message with {selectedDmUser.name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1 max-w-lg">
                This is the start of your direct conversation with {selectedDmUser.name}.
              </p>
            </div>
          )
        ) : (
          /* Channel Banner */
          !hasMoreMessages && channel && (
            <div className="pb-6 border-b border-slate-200 dark:border-neutral-800/80 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
                {channel.isPrivate ? <Lock className="w-6 h-6" /> : <Hash className="w-6 h-6" />}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                Welcome to #{channel.name}!
              </h3>
              <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1 max-w-lg">
                This is the start of the #{channel.name} channel.
              </p>
            </div>
          )
        )}

        {loadingMessages ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : isDmMode ? (
          /* DM Messages list */
          uniqueDirectMessages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-neutral-500">
              <Shield className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs text-slate-400 dark:text-neutral-600 mt-1">Send a message to start the conversation!</p>
            </div>
          ) : (
            uniqueDirectMessages.map((dm, idx) => {
              const isMe = currentUser?.id === dm.senderId;
              const sender = dm.sender || (isMe ? currentUser : selectedDmUser);
              const timeFormatted = new Date(dm.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const decryptedText = decryptedDmMessages[dm.id] || '[Loading message...]';
              const prevDm = idx > 0 ? uniqueDirectMessages[idx - 1] : null;
              const showDateHeader = !prevDm || isDifferentDay(prevDm.createdAt, dm.createdAt);

              return (
                <React.Fragment key={dm.id}>
                  {showDateHeader && <ChatDateDivider date={dm.createdAt} />}
                  <div
                    id={`msg-${dm.id}`}
                    className={`flex items-start gap-3.5 group hover:bg-slate-100 dark:hover:bg-neutral-800/20 -mx-3 px-3 py-2 rounded-lg transition relative ${
                      highlightedMessageId === dm.id
                        ? 'ring-2 ring-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20'
                        : ''
                    }`}
                  >
                  {/* Floating Action Bar */}
                  {!dm.isDeleted && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 -top-2.5 z-10 flex items-center gap-0.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-md px-1 py-0.5">
                      {['👍', '❤️', '🚀', '🎉', '👀'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => onToggleReaction?.(dm.id, emoji, true)}
                          className="text-xs hover:scale-125 transition-transform p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800"
                          title={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}

                      <button
                        onClick={() => onOpenThread?.(dm, decryptedText)}
                        className="p-1 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
                        title="Reply in thread"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      {isMe && (
                        <button
                          onClick={() => handleStartEdit(dm.id, decryptedText, true)}
                          className="p-1 text-slate-500 hover:text-amber-500 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
                          title="Edit message"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(isMe || currentUser?.role === 'admin') && (
                        <button
                          onClick={() => handleDelete(dm.id, true)}
                          className="p-1 text-slate-500 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <img
                    src={sender?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={sender?.name || 'User'}
                    className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-neutral-700/50 mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-neutral-200">
                        {sender?.name || 'User'}
                      </span>
                      {isMe && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium px-1 rounded border border-indigo-500/30">
                          YOU
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                        {timeFormatted}
                      </span>
                      {dm.expiresAt && (() => {
                        const diffMs = new Date(dm.expiresAt).getTime() - nowTimestamp;
                        const seconds = Math.max(0, Math.floor(diffMs / 1000));
                        const isUrgent = seconds < 60;
                        const formatted =
                          seconds > 3600 * 24
                            ? `${Math.floor(seconds / 86400)}d`
                            : seconds > 3600
                            ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
                            : seconds > 60
                            ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
                            : `${seconds}s`;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                              isUrgent
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                            title={`Disappearing message expires in ${formatted}`}
                          >
                            <Flame className="w-2.5 h-2.5 shrink-0" />
                            <span>{formatted}</span>
                          </span>
                        );
                      })()}
                      {dm.isEdited && (
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 italic">
                          (edited)
                        </span>
                      )}
                      {isMe && (
                        <span className="inline-flex items-center gap-1 text-[11px] ml-auto">
                          {dm.isRead ? (
                            <span
                              title={
                                dm.readAt
                                  ? `Read at ${new Date(dm.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                  : 'Read by recipient'
                              }
                              className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.2 rounded"
                            >
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-[10px]">Read</span>
                            </span>
                          ) : (
                            <span
                              title="Delivered to recipient"
                              className="inline-flex items-center gap-0.5 text-slate-400 dark:text-neutral-500 bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded"
                            >
                              <Check className="w-3 h-3 text-slate-400 dark:text-neutral-400" />
                              <span className="text-[10px]">Delivered</span>
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Content or Inline Editor */}
                    {editingMessageId === dm.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg bg-white dark:bg-neutral-950 border border-indigo-500 text-slate-900 dark:text-neutral-100 focus:outline-none"
                          rows={2}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={savingEdit || !editingText.trim()}
                            className="text-[11px] px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"
                          >
                            {savingEdit ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-[11px] px-2.5 py-1 rounded bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-medium hover:bg-slate-300 dark:hover:bg-neutral-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : dm.isDeleted ? (
                      <p className="text-xs text-slate-400 dark:text-neutral-500 italic mt-1">
                        This message was deleted
                      </p>
                    ) : (
                      <RenderDecryptedContent content={decryptedText} highlightQuery={searchQuery} />
                    )}

                    {/* Reaction Badges */}
                    {dm.reactions && Object.keys(dm.reactions).length > 0 && !dm.isDeleted && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(dm.reactions).map(([emoji, userIds]) => {
                          const hasReacted = currentUser && userIds.includes(currentUser.id);
                          return (
                            <button
                              key={emoji}
                              onClick={() => onToggleReaction?.(dm.id, emoji, true)}
                              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition ${
                                hasReacted
                                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-600 dark:text-indigo-300 font-semibold'
                                  : 'bg-slate-100 dark:bg-neutral-800/80 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:border-slate-300 dark:hover:border-neutral-600'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span>{userIds.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Thread Preview Badge */}
                    {dm.replyCount !== undefined && dm.replyCount > 0 && !dm.isDeleted && (
                      <button
                        onClick={() => onOpenThread?.(dm, decryptedText)}
                        className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1.5 font-medium"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>
                          {dm.replyCount} {dm.replyCount === 1 ? 'reply' : 'replies'}
                        </span>
                        {dm.lastReplyAt && (
                          <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                            Last reply {new Date(dm.lastReplyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
            })
          )
        ) : (
          /* Channel Messages list */
          uniqueMessages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-neutral-500">
              <p className="text-sm">No messages yet. Be the first to start the conversation!</p>
            </div>
          ) : (
            uniqueMessages.map((msg, idx) => {
              const isMe = currentUser?.id === msg.userId;
              const authorUser = !msg.isBot ? usersMap.get(msg.userId) : null;
              const avatarSrc =
                authorUser?.avatar ||
                msg.userAvatar ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
              const authorName = authorUser?.name || msg.userName;
              const timeFormatted = new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const displayContent = msg.decryptedContent || msg.content || '[Loading message...]';
              const prevMsg = idx > 0 ? uniqueMessages[idx - 1] : null;
              const showDateHeader = !prevMsg || isDifferentDay(prevMsg.createdAt, msg.createdAt);

              return (
                <React.Fragment key={msg.id}>
                  {showDateHeader && <ChatDateDivider date={msg.createdAt} />}
                  <div
                    id={`msg-${msg.id}`}
                    className={`flex items-start gap-3.5 group hover:bg-slate-100 dark:hover:bg-neutral-800/20 -mx-3 px-3 py-1.5 rounded-lg transition relative ${
                      highlightedMessageId === msg.id
                        ? 'ring-2 ring-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20'
                        : ''
                    }`}
                  >
                  {/* Floating Action Bar */}
                  {!msg.isDeleted && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 -top-2.5 z-10 flex items-center gap-0.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-md px-1 py-0.5">
                      {['👍', '❤️', '🚀', '🎉', '👀'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => onToggleReaction?.(msg.id, emoji, false)}
                          className="text-xs hover:scale-125 transition-transform p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800"
                          title={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}

                      <button
                        onClick={() => onOpenThread?.(msg, displayContent)}
                        className="p-1 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
                        title="Reply in thread"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      {isMe && (
                        <button
                          onClick={() => handleStartEdit(msg.id, displayContent, false)}
                          className="p-1 text-slate-500 hover:text-amber-500 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
                          title="Edit message"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(isMe || currentUser?.role === 'admin') && (
                        <button
                          onClick={() => handleDelete(msg.id, false)}
                          className="p-1 text-slate-500 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <img
                    src={avatarSrc}
                    alt={authorName}
                    className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-neutral-700/50 mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-neutral-200">
                        {authorName}
                      </span>
                      {isMe && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium px-1 rounded border border-indigo-500/30">
                          YOU
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                        {timeFormatted}
                      </span>
                      {msg.expiresAt && (() => {
                        const diffMs = new Date(msg.expiresAt).getTime() - nowTimestamp;
                        const seconds = Math.max(0, Math.floor(diffMs / 1000));
                        const isUrgent = seconds < 60;
                        const formatted =
                          seconds > 3600 * 24
                            ? `${Math.floor(seconds / 86400)}d`
                            : seconds > 3600
                            ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
                            : seconds > 60
                            ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
                            : `${seconds}s`;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                              isUrgent
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                            title={`Disappearing message expires in ${formatted}`}
                          >
                            <Flame className="w-2.5 h-2.5 shrink-0" />
                            <span>{formatted}</span>
                          </span>
                        );
                      })()}
                      {msg.isEdited && (
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 italic">
                          (edited)
                        </span>
                      )}
                    </div>

                    {/* Content or Inline Editor */}
                    {editingMessageId === msg.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg bg-white dark:bg-neutral-950 border border-indigo-500 text-slate-900 dark:text-neutral-100 focus:outline-none"
                          rows={2}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={savingEdit || !editingText.trim()}
                            className="text-[11px] px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"
                          >
                            {savingEdit ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-[11px] px-2.5 py-1 rounded bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-medium hover:bg-slate-300 dark:hover:bg-neutral-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : msg.isDeleted ? (
                      <p className="text-xs text-slate-400 dark:text-neutral-500 italic mt-1">
                        This message was deleted
                      </p>
                    ) : (
                      <RenderDecryptedContent content={displayContent} highlightQuery={searchQuery} />
                    )}

                    {/* Reaction Badges */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && !msg.isDeleted && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                          const hasReacted = currentUser && userIds.includes(currentUser.id);
                          return (
                            <button
                              key={emoji}
                              onClick={() => onToggleReaction?.(msg.id, emoji, false)}
                              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition ${
                                hasReacted
                                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-600 dark:text-indigo-300 font-semibold'
                                  : 'bg-slate-100 dark:bg-neutral-800/80 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:border-slate-300 dark:hover:border-neutral-600'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span>{userIds.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Thread Preview Badge */}
                    {msg.replyCount !== undefined && msg.replyCount > 0 && !msg.isDeleted && (
                      <button
                        onClick={() => onOpenThread?.(msg, displayContent)}
                        className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1.5 font-medium"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>
                          {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}
                        </span>
                        {msg.lastReplyAt && (
                          <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                            Last reply {new Date(msg.lastReplyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
            })
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 bg-slate-100/70 dark:bg-neutral-900/70 border-t border-slate-200/60 dark:border-neutral-800/60 animate-in fade-in duration-150 shrink-0">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
          </div>
          <span className="font-medium text-[11px]">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.join(', ')} are typing...`}
          </span>
        </div>
      )}

      {/* Message Input Bar */}
      <div className="p-4 border-t border-slate-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/80">
        <form
          onSubmit={handleSubmit}
          className="bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 rounded-xl p-2 transition shadow-sm dark:shadow-lg"
        >
          {/* File Attachment Staging Preview */}
          {attachmentStaging && (
            <div className="mb-2 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-between text-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 min-w-0">
                {attachmentStaging.previewUrl ? (
                  <img
                    src={attachmentStaging.previewUrl}
                    alt="Preview"
                    className="w-10 h-10 rounded object-cover border border-indigo-500/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded bg-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-neutral-100 truncate max-w-xs">
                    {attachmentStaging.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    {attachmentStaging.size}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveAttachment}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <textarea
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isDmMode
                ? `Message @${selectedDmUser.name}`
                : `Message #${channel?.name || 'channel'}`
            }
            rows={2}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none resize-none px-2 py-1"
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.txt,.doc,.docx,.zip,.tar,.gz,.json,.csv"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-neutral-800/60 px-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-slate-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-neutral-800 rounded-lg transition flex items-center gap-1 text-xs"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
                <span className="text-[11px] font-medium hidden sm:inline">Attach</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={sending || isEncrypting || (!content.trim() && !selectedFile)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:hover:bg-indigo-600 disabled:opacity-40 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
            >
              {isEncrypting || sending ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Interactive Safety Numbers Modal */}
      {showSafetyModal && selectedDmUser && (
        <SafetyNumberModal
          isOpen={showSafetyModal}
          onClose={() => setShowSafetyModal(false)}
          currentUser={currentUser}
          selectedDmUser={selectedDmUser}
          safetyData={safetyData}
          loading={safetyLoading}
          peerKeyStatus={peerKeyStatus}
          onToggleVerify={handleToggleVerifyPeer}
        />
      )}
    </div>
  );
}

function SafetyNumberMatrix({ blocks }: { blocks: string[] }) {
  const digits = blocks.join('');
  const size = 8;
  const cells: boolean[][] = [];

  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      const isCornerTL = r <= 1 && c <= 1;
      const isCornerTR = r <= 1 && c >= size - 2;
      const isCornerBL = r >= size - 2 && c <= 1;
      if (isCornerTL || isCornerTR || isCornerBL) {
        row.push(true);
      } else {
        const charCode = digits.charCodeAt((r * size + c) % digits.length);
        row.push(charCode % 2 === 0);
      }
    }
    cells.push(row);
  }

  return (
    <svg
      viewBox="0 0 80 80"
      className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white dark:bg-neutral-950 p-2 shadow-inner border border-slate-200 dark:border-neutral-800 shrink-0"
    >
      {cells.map((row, r) =>
        row.map((active, c) =>
          active ? (
            <rect
              key={`${r}-${c}`}
              x={c * 10}
              y={r * 10}
              width={9}
              height={9}
              rx={1.5}
              className="fill-slate-900 dark:fill-neutral-100"
            />
          ) : null
        )
      )}
    </svg>
  );
}

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  selectedDmUser: User;
  safetyData: {
    safetyNumber: string;
    blocks: string[];
    myFingerprint: string;
    peerFingerprint: string;
  } | null;
  loading: boolean;
  peerKeyStatus: 'verified' | 'unverified' | 'key_changed';
  onToggleVerify: () => Promise<void>;
}

function SafetyNumberModal({
  isOpen,
  onClose,
  currentUser,
  selectedDmUser,
  safetyData,
  loading,
  peerKeyStatus,
  onToggleVerify,
}: SafetyModalProps) {
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!safetyData) return;
    navigator.clipboard.writeText(safetyData.safetyNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = async () => {
    setToggling(true);
    try {
      await onToggleVerify();
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-neutral-100 text-sm sm:text-base">
                Verify Safety Numbers
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Signal & Matrix Cross-Signing Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs text-slate-400 dark:text-neutral-500">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Computing safety numbers...</span>
            </div>
          ) : safetyData ? (
            <>
              {/* Visual Matrix & Instructions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-neutral-950 p-4 rounded-xl border border-slate-200/80 dark:border-neutral-800/80">
                <SafetyNumberMatrix blocks={safetyData.blocks} />
                <div className="space-y-1 text-xs text-slate-600 dark:text-neutral-300">
                  <p className="font-medium text-slate-900 dark:text-neutral-100">
                    Safety Check
                  </p>
                  <p className="leading-relaxed text-slate-500 dark:text-neutral-400">
                    Compare this 60-digit safety number or visual pattern with {selectedDmUser.name}&apos;s device in person or via a secure audio call to verify that no third party is intercepting your messages.
                  </p>
                </div>
              </div>

              {/* 60-Digit Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                    60-Digit Safety Number
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Digits</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-slate-100/70 dark:bg-neutral-950/70 p-3 rounded-xl border border-slate-200 dark:border-neutral-800 font-mono text-center text-xs sm:text-sm font-semibold text-slate-800 dark:text-neutral-200 tracking-wider">
                  {safetyData.blocks.map((block, i) => (
                    <div
                      key={i}
                      className="py-1.5 px-2 bg-white dark:bg-neutral-900 rounded-lg border border-slate-200/60 dark:border-neutral-800/60 shadow-2xs"
                    >
                      {block}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Fingerprints */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-neutral-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">Your Identity Fingerprint:</span>
                  <code className="font-mono text-[11px] text-slate-700 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                    {safetyData.myFingerprint}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">{selectedDmUser.name}&apos;s Fingerprint:</span>
                  <code className="font-mono text-[11px] text-slate-700 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                    {safetyData.peerFingerprint}
                  </code>
                </div>
              </div>

              {/* Status Alert */}
              {peerKeyStatus === 'key_changed' ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs flex items-start gap-2.5 text-rose-800 dark:text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Security Alert:</span> The key for {selectedDmUser.name} differs from your previously recorded verification. Confirm their safety numbers carefully before marking as verified.
                  </div>
                </div>
              ) : peerKeyStatus === 'verified' ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-semibold">Verified Contact:</span> You have cryptographically verified safety numbers for {selectedDmUser.name}.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-100 dark:bg-neutral-800 rounded-xl text-xs flex items-center gap-2.5 text-slate-600 dark:text-neutral-400">
                  <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="font-semibold">Unverified:</span> You haven&apos;t verified {selectedDmUser.name}&apos;s safety number yet.
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-xs text-rose-500">
              Unable to load cryptographic keys for safety number verification.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-slate-50/50 dark:bg-neutral-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 transition"
          >
            Close
          </button>

          <button
            onClick={handleAction}
            disabled={toggling || !safetyData}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
              peerKeyStatus === 'verified'
                ? 'bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-300 dark:hover:bg-neutral-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {peerKeyStatus === 'verified' ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Unmark as Verified</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Mark as Verified (Cross-Signed)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
