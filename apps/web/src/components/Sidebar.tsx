'use client';

import React from 'react';
import {
  Hash,
  Lock,
  Plus,
  Users,
  MessageSquare,
  KanbanSquare,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Channel, User } from '../types';

interface Props {
  channels: Channel[];
  selectedChannelId: string;
  onSelectChannel: (id: string) => void;
  onOpenCreateChannel: () => void;
  users: User[];
  currentUser: User | null;
  activeView: 'chat' | 'kanban';
  onSelectView: (view: 'chat' | 'kanban') => void;
  taskCount: number;
}

export function Sidebar({
  channels,
  selectedChannelId,
  onSelectChannel,
  onOpenCreateChannel,
  users,
  currentUser,
  activeView,
  onSelectView,
  taskCount,
}: Props) {
  return (
    <aside className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col h-full select-none">
      {/* Workspace Header */}
      <div className="h-14 px-4 border-b border-neutral-800 flex items-center justify-between hover:bg-neutral-900/50 cursor-pointer transition">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-sm text-sm">
            S
          </div>
          <div>
            <h1 className="font-semibold text-sm text-neutral-100 flex items-center gap-1">
              Slackers HQ
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </h1>
            <p className="text-[11px] text-neutral-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Postgres + Prisma + Mongo
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace Navigation Switcher (Chat vs Kanban) */}
      <div className="p-3 border-b border-neutral-800/80 space-y-1">
        <button
          onClick={() => onSelectView('chat')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
            activeView === 'chat'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Chat & Channels</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeView === 'chat' ? 'bg-indigo-700/80 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {channels.length}
          </span>
        </button>

        <button
          onClick={() => onSelectView('kanban')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
            activeView === 'kanban'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <KanbanSquare className="w-4 h-4" />
            <span>Sprint Kanban</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeView === 'kanban' ? 'bg-indigo-700/80 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {taskCount}
          </span>
        </button>
      </div>

      {/* Scrollable Channels & Teammates List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {/* Channels Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Channels
            </span>
            <button
              onClick={onOpenCreateChannel}
              title="Add Channel"
              className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {channels.map((channel) => {
              const isActive = activeView === 'chat' && channel.id === selectedChannelId;
              return (
                <button
                  key={channel.id}
                  onClick={() => {
                    onSelectChannel(channel.id);
                    onSelectView('chat');
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition group ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {channel.isPrivate ? (
                      <Lock className="w-4 h-4 text-neutral-500 group-hover:text-neutral-400 shrink-0" />
                    ) : (
                      <Hash className="w-4 h-4 text-neutral-500 group-hover:text-neutral-400 shrink-0" />
                    )}
                    <span className="truncate">{channel.name}</span>
                  </div>
                  {channel.memberCount > 0 && (
                    <span className="text-[11px] text-neutral-600 group-hover:text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-900">
                      {channel.memberCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Messages / Teammates */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Teammates
            </span>
            <span className="text-[11px] text-neutral-500 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {users.length}
            </span>
          </div>

          <div className="space-y-1">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 cursor-pointer transition"
              >
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-neutral-950 ${
                      user.status === 'online'
                        ? 'bg-emerald-500'
                        : user.status === 'away'
                        ? 'bg-amber-500'
                        : 'bg-neutral-500'
                    }`}
                  />
                </div>
                <div className="truncate flex-1">
                  <span className="truncate block leading-tight">{user.name}</span>
                  <span className="text-[10px] text-neutral-500 block leading-none">
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current User Bar */}
      {currentUser && (
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-neutral-700"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-neutral-950" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-200 truncate">{currentUser.name}</p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                Active now
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
