'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Hash, Lock, Send, Users, Sparkles, MessageCircle, Info } from 'lucide-react';
import { Channel, Message, User } from '../types';
import { BackendStatus } from './BackendStatus';

interface Props {
  channel: Channel | null;
  messages: Message[];
  currentUser: User | null;
  onSendMessage: (content: string) => Promise<void>;
  loadingMessages: boolean;
}

export function ChatArea({
  channel,
  messages,
  currentUser,
  onSendMessage,
  loadingMessages,
}: Props) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(content.trim());
      setContent('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-900/50 text-neutral-400">
        <MessageCircle className="w-12 h-12 text-neutral-600 mb-3" />
        <p className="text-base font-medium text-neutral-300">No channel selected</p>
        <p className="text-xs text-neutral-500 mt-1">Select a channel from the sidebar to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-900">
      {/* Channel Header */}
      <header className="h-14 px-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-neutral-800 rounded-lg text-neutral-300">
            {channel.isPrivate ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="font-semibold text-neutral-100 text-sm flex items-center gap-2">
              {channel.name}
              {channel.isPrivate && (
                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                  private
                </span>
              )}
            </h2>
            <p className="text-xs text-neutral-400 truncate max-w-md">
              {channel.description || 'Welcome to the start of this channel!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800">
            <Users className="w-3.5 h-3.5 text-neutral-500" />
            <span>{channel.memberCount} members</span>
          </div>
          <BackendStatus />
        </div>
      </header>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Channel Banner */}
        <div className="pb-6 border-b border-neutral-800/80 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
            {channel.isPrivate ? <Lock className="w-6 h-6" /> : <Hash className="w-6 h-6" />}
          </div>
          <h3 className="text-xl font-bold text-neutral-100">
            Welcome to #{channel.name}!
          </h3>
          <p className="text-sm text-neutral-400 mt-1 max-w-lg">
            This is the start of the #{channel.name} channel. Send messages in real-time to test the Next.js frontend to Node.js backend integration.
          </p>
        </div>

        {loadingMessages ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">No messages yet. Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUser?.id === msg.userId;
            const timeFormatted = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={msg.id} className="flex items-start gap-3.5 group hover:bg-neutral-800/20 -mx-3 px-3 py-1.5 rounded-lg transition">
                <img
                  src={msg.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt={msg.userName}
                  className="w-9 h-9 rounded-lg object-cover ring-1 ring-neutral-700/50 mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm text-neutral-200">
                      {msg.userName}
                    </span>
                    {isMe && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-medium px-1 rounded border border-indigo-500/30">
                        YOU
                      </span>
                    )}
                    <span className="text-[11px] text-neutral-500">
                      {timeFormatted}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-300 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-950/80">
        <form
          onSubmit={handleSubmit}
          className="bg-neutral-900 border border-neutral-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 rounded-xl p-2 transition shadow-lg"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channel.name} (Press Enter to send)`}
            rows={2}
            className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none px-2 py-1"
          />
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 px-2">
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Shift + Enter for new line</span>
            </div>
            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
            >
              <Send className="w-3 h-3" />
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
