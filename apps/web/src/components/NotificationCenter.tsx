'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  CheckSquare,
  MessageSquare,
  Lock,
  MessageCircle,
  X,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';
import { Notification, NotificationType } from '../types';

interface Props {
  notifications: Notification[];
  unreadCount: number;
  onRefresh: () => Promise<void>;
  onNavigateChannel?: (channelId: string) => void;
  onNavigateDM?: (partnerId: string) => void;
  onNavigateTask?: (taskId: string) => void;
}

export function NotificationCenter({
  notifications,
  unreadCount,
  onRefresh,
  onNavigateChannel,
  onNavigateDM,
  onNavigateTask,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'tasks' | 'messages'>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.markAllNotificationsAsRead();
      await onRefresh();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await api.markNotificationAsRead(notif.id);
        await onRefresh();
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    setIsOpen(false);

    if (notif.link) {
      if (notif.link.type === 'channel' && onNavigateChannel) {
        onNavigateChannel(notif.link.id);
      } else if (notif.link.type === 'dm' && onNavigateDM) {
        onNavigateDM(notif.link.id);
      } else if (notif.link.type === 'task' && onNavigateTask) {
        onNavigateTask(notif.link.id);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      await onRefresh();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'tasks') return n.type === 'task_assigned' || n.type === 'task_comment';
    if (filter === 'messages') return n.type === 'message' || n.type === 'dm';
    return true;
  });

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    return `${diffDay}d ago`;
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'task_assigned':
        return <CheckSquare className="w-4 h-4 text-indigo-400" />;
      case 'task_comment':
        return <MessageCircle className="w-4 h-4 text-amber-400" />;
      case 'dm':
        return <Lock className="w-4 h-4 text-purple-400" />;
      case 'message':
      default:
        return <MessageSquare className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className={`relative p-2 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition ${
          isOpen ? 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200' : ''
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-rose-500 text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-neutral-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center px-3 pt-2 pb-1 gap-1 border-b border-slate-100 dark:border-neutral-800/60 text-xs">
            {(['all', 'unread', 'tasks', 'messages'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition ${
                  filter === tab
                    ? 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 dark:bg-neutral-800/60 flex items-center justify-center text-slate-400 dark:text-neutral-500">
                  <Bell className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-neutral-400">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
                  You'll see alerts when someone mentions you or assigns a task.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 text-left transition flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800/50 group ${
                    !notif.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  {/* Sender Avatar or Icon */}
                  <div className="relative shrink-0 mt-0.5">
                    {notif.senderAvatar ? (
                      <img
                        src={notif.senderAvatar}
                        alt={notif.senderName || 'Sender'}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-neutral-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
                        {getIconForType(notif.type)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white dark:bg-neutral-900 ring-1 ring-slate-200 dark:ring-neutral-800">
                      {getIconForType(notif.type)}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-semibold text-slate-800 dark:text-neutral-200 truncate">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-neutral-500 shrink-0">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {notif.content}
                    </p>
                  </div>

                  {/* Actions / Read Dot */}
                  <div className="shrink-0 flex flex-col items-end justify-between h-full pt-1">
                    {!notif.isRead ? (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                    ) : (
                      <span className="w-2 h-2"></span>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, notif.id)}
                      title="Dismiss"
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 rounded transition mt-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
