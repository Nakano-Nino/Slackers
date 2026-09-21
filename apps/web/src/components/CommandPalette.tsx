'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Hash,
  MessageCircle,
  CheckSquare,
  FolderKanban,
  Sparkles,
  Plus,
  Bug,
  Settings,
  ArrowRight,
  X,
  Command,
  UserPlus,
} from 'lucide-react';
import { Channel, Project, Task, User } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  users: User[];
  tasks: Task[];
  projects: Project[];
  onSelectChannel: (channelId: string) => void;
  onSelectDmUser: (user: User) => void;
  onSelectTask: (task: Task) => void;
  onSelectProject: (projectId: string) => void;
  onOpenCreateTask?: () => void;
  onOpenReportBug: () => void;
  onOpenSettings: () => void;
  onOpenInviteMember?: () => void;
}

interface PaletteItem {
  id: string;
  type: 'channel' | 'dm' | 'task' | 'project' | 'action';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  channels,
  users,
  tasks,
  projects,
  onSelectChannel,
  onSelectDmUser,
  onSelectTask,
  onSelectProject,
  onOpenCreateTask,
  onOpenReportBug,
  onOpenSettings,
  onOpenInviteMember,
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable items
  const items: PaletteItem[] = [];

  // Actions
  if (onOpenCreateTask) {
    items.push({
      id: 'action-create-task',
      type: 'action',
      title: 'Create New Task',
      subtitle: 'Add a new work item to Kanban board',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onClose();
        onOpenCreateTask();
      },
    });
  }

  items.push(
    {
      id: 'action-report-bug',
      type: 'action',
      title: 'Report a Bug',
      subtitle: 'Log a bug with severity and reproduction steps',
      icon: <Bug className="w-4 h-4 text-rose-400" />,
      action: () => {
        onClose();
        onOpenReportBug();
      },
    },
    {
      id: 'action-settings',
      type: 'action',
      title: 'Open Settings',
      subtitle: 'Manage devices, profile, security & notifications',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      action: () => {
        onClose();
        onOpenSettings();
      },
    }
  );

  if (onOpenInviteMember) {
    items.push({
      id: 'action-invite-member',
      type: 'action',
      title: 'Invite / Add Teammate',
      subtitle: 'Directly add member or generate shareable invite link',
      icon: <UserPlus className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onClose();
        onOpenInviteMember();
      },
    });
  }

  // Channels
  for (const ch of channels) {
    items.push({
      id: `channel-${ch.id}`,
      type: 'channel',
      title: `#${ch.name}`,
      subtitle: ch.description || 'Channel',
      icon: <Hash className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onClose();
        onSelectChannel(ch.id);
      },
    });
  }

  // Direct Messages / Users
  for (const u of users) {
    items.push({
      id: `user-${u.id}`,
      type: 'dm',
      title: u.name,
      subtitle: u.email,
      icon: (
        <img
          src={u.avatar}
          alt={u.name}
          className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-700"
        />
      ),
      action: () => {
        onClose();
        onSelectDmUser(u);
      },
    });
  }

  // Projects
  for (const p of projects) {
    items.push({
      id: `proj-${p.id}`,
      type: 'project',
      title: p.name,
      subtitle: `[${p.key}] ${p.description || ''}`,
      icon: <FolderKanban className="w-4 h-4 text-amber-400" />,
      action: () => {
        onClose();
        onSelectProject(p.id);
      },
    });
  }

  // Tasks
  for (const t of tasks) {
    items.push({
      id: `task-${t.id}`,
      type: 'task',
      title: t.title,
      subtitle: `${t.status.replace('_', ' ').toUpperCase()} · ${t.priority.toUpperCase()} · ${t.storyPoints} pts`,
      icon: <CheckSquare className="w-4 h-4 text-sky-400" />,
      action: () => {
        onClose();
        onSelectTask(t);
      },
    });
  }

  // Filter items based on query
  const filtered = items.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search channels, teammates, tasks, projects, actions..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
            <span>ESC to close</span>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No results found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-600/20 text-white border border-indigo-500/40'
                      : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected ? 'bg-indigo-500/20' : 'bg-slate-800/80'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate text-slate-100">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-400">
                      {item.type}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">↓</kbd> to
              navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">↵</kbd> to
              select
            </span>
          </div>
          <span className="text-[10px]">Quick Switcher</span>
        </div>
      </div>
    </div>
  );
}
