'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Sparkles,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Channel, DirectMessage, Message, User } from '../types';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import {
  encryptFileBlob,
  formatFileSize,
  FileAttachmentMetadata,
} from '../lib/fileCrypto';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parentMessage: Message | DirectMessage | null;
  parentDecryptedContent?: string;
  channel: Channel | null;
  selectedDmUser: User | null;
  currentUser: User | null;
  onSendReply: (parentId: string, content: string) => Promise<void>;
  onToggleReaction: (messageId: string, emoji: string) => Promise<void>;
  channelKey?: CryptoKey | null;
}

const COMMON_REACTIONS = ['👍', '❤️', '🚀', '🎉', '👀', '😂'];

export function ThreadPanel({
  isOpen,
  onClose,
  parentMessage,
  parentDecryptedContent,
  channel,
  selectedDmUser,
  currentUser,
  onSendReply,
  onToggleReaction,
}: Props) {
  const [replies, setReplies] = useState<Message[]>([]);
  const [decryptedReplies, setDecryptedReplies] = useState<Record<string, string>>({});
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Staged attachment
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const repliesEndRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load thread replies when parent message changes
  useEffect(() => {
    if (!isOpen || !parentMessage) return;

    let active = true;
    setLoading(true);

    api
      .getThreadReplies(parentMessage.id)
      .then((data) => {
        if (active) {
          setReplies(data);
          const decryptedMap: Record<string, string> = {};
          for (const rep of data) {
            decryptedMap[rep.id] = rep.content || rep.decryptedContent || rep.ciphertext;
          }
          setDecryptedReplies(decryptedMap);
        }
      })
      .catch((err) => console.error('Failed to load thread replies:', err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, parentMessage]);

  // Real-time socket listener for incoming thread replies
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !parentMessage) return;

    const handleThreadReply = (data: {
      channelId: string;
      parentId: string;
      reply: Message;
    }) => {
      if (data.parentId === parentMessage.id) {
        setReplies((prev) => {
          if (prev.some((r) => r.id === data.reply.id)) return prev;
          return [...prev, data.reply];
        });
        setDecryptedReplies((prev) => ({
          ...prev,
          [data.reply.id]: data.reply.content || data.reply.ciphertext,
        }));
      }
    };

    const handleMessageReaction = (data: {
      messageId: string;
      reactions: Record<string, string[]>;
    }) => {
      setReplies((prev) =>
        prev.map((r) => (r.id === data.messageId ? { ...r, reactions: data.reactions } : r))
      );
    };

    socket.on('thread:reply', handleThreadReply);
    socket.on('message:reaction', handleMessageReaction);

    return () => {
      socket.off('thread:reply', handleThreadReply);
      socket.off('message:reaction', handleMessageReaction);
    };
  }, [parentMessage]);

  // Auto scroll to bottom
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!replyText.trim() && !stagedFile) || sending || !parentMessage) return;

    setSending(true);
    try {
      let finalContent = replyText.trim();

      if (stagedFile) {
        setUploadingFile(true);
        const { encryptedBlob, fileKey, fileIv } = await encryptFileBlob(stagedFile);
        const uploaded = await api.uploadEncryptedFile(
          encryptedBlob,
          stagedFile.name,
          stagedFile.type || 'application/octet-stream'
        );

        const attachmentPayload = {
          text: finalContent,
          file: {
            fileId: uploaded.fileId,
            name: uploaded.originalName,
            size: uploaded.size,
            mimeType: uploaded.mimeType,
            fileKey,
            fileIv,
          } as FileAttachmentMetadata,
        };
        finalContent = JSON.stringify(attachmentPayload);
        setStagedFile(null);
      }

      await onSendReply(parentMessage.id, finalContent);
      setReplyText('');
    } catch (err) {
      console.error('Failed to post thread reply:', err);
    } finally {
      setSending(false);
      setUploadingFile(false);
    }
  };

  if (!isOpen || !parentMessage) return null;

  const parentAuthor =
    'userName' in parentMessage ? parentMessage.userName : parentMessage.sender?.name || 'Unknown';
  const parentAvatar =
    'userAvatar' in parentMessage
      ? parentMessage.userAvatar
      : parentMessage.sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] md:w-[460px] bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Thread Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 backdrop-blur">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Thread</h3>
            <span className="text-[11px] text-slate-400">
              {channel ? `#${channel.name}` : selectedDmUser ? `@${selectedDmUser.name}` : ''}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Thread Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Pinned Parent Message */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 shadow-sm relative">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={parentAvatar}
              alt={parentAuthor}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-700"
            />
            <span className="text-xs font-semibold text-white">{parentAuthor}</span>
            <span className="text-[10px] text-slate-500">
              {new Date(parentMessage.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-medium ml-auto">
              Root Message
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed break-words whitespace-pre-wrap">
            {parentDecryptedContent || ('content' in parentMessage ? parentMessage.content : parentMessage.ciphertext)}
          </p>

          {/* Root Message Reactions */}
          {parentMessage.reactions && Object.keys(parentMessage.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-800/80">
              {Object.entries(parentMessage.reactions).map(([emoji, userIds]) => {
                const hasReacted = currentUser && userIds.includes(currentUser.id);
                return (
                  <button
                    key={emoji}
                    onClick={() => onToggleReaction(parentMessage.id, emoji)}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition ${
                      hasReacted
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="font-semibold">{userIds.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Separator / Reply count */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Reply List */}
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading replies...</div>
        ) : replies.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 italic">
            No replies yet. Start the conversation below!
          </div>
        ) : (
          replies.map((reply) => {
            const replyDecrypted = decryptedReplies[reply.id] || reply.content || reply.ciphertext;

            return (
              <div
                key={reply.id}
                className={`group flex items-start gap-2.5 p-2 rounded-xl transition hover:bg-slate-950/40 relative`}
              >
                <img
                  src={reply.userAvatar}
                  alt={reply.userName}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-800 shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-slate-200">{reply.userName}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(reply.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {reply.isEdited && (
                      <span className="text-[9px] text-slate-500 italic">(edited)</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                    {reply.isDeleted ? (
                      <span className="italic text-slate-500">This message was deleted</span>
                    ) : (
                      replyDecrypted
                    )}
                  </p>

                  {/* Reaction Badges */}
                  {reply.reactions && Object.keys(reply.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Object.entries(reply.reactions).map(([emoji, userIds]) => {
                        const hasReacted = currentUser && userIds.includes(currentUser.id);
                        return (
                          <button
                            key={emoji}
                            onClick={() => onToggleReaction(reply.id, emoji)}
                            className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border transition ${
                              hasReacted
                                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="font-semibold">{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Reaction Button on Hover */}
                {!reply.isDeleted && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg shadow-lg">
                    {COMMON_REACTIONS.slice(0, 3).map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => onToggleReaction(reply.id, emoji)}
                        className="text-xs hover:scale-125 transition-transform p-0.5"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={repliesEndRef} />
      </div>

      {/* Staged Attachment Preview */}
      {stagedFile && (
        <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-400">
          <div className="flex items-center gap-1.5 truncate">
            <Paperclip className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{stagedFile.name}</span>
            <span className="text-[10px] text-slate-500">({formatFileSize(stagedFile.size)})</span>
          </div>
          <button
            onClick={() => setStagedFile(null)}
            className="text-slate-500 hover:text-white p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Thread Reply Composer */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/80">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setStagedFile(file);
          }}
        />

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 focus-within:border-indigo-500/80 transition">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Encrypted File"
            className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply in thread..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none px-1"
          />

          <button
            type="submit"
            disabled={(!replyText.trim() && !stagedFile) || sending}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
