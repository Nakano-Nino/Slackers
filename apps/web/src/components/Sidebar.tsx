'use client';

import React, { useState } from 'react';
import {
  Hash,
  Lock,
  Plus,
  Users,
  MessageSquare,
  KanbanSquare,
  ChevronDown,
  FolderKanban,
  LogOut,
  Bug,
  Flame,
  Shield,
  Search,
  Settings,
  BellOff,
  UserPlus,
} from 'lucide-react';
import { Channel, MuteTarget, Project, User } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  channels: Channel[];
  selectedChannelId: string;
  onSelectChannel: (id: string) => void;
  onOpenCreateChannel: () => void;
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  users: User[];
  currentUser: User | null;
  activeView: 'chat' | 'kanban' | 'bugs';
  onSelectView: (view: 'chat' | 'kanban' | 'bugs') => void;
  taskCount: number;
  bugCount: number;
  criticalBugCount: number;
  onLogout: () => void;
  onOpenSettings?: () => void;
  selectedDmUserId?: string | null;
  onSelectDmUser?: (user: User) => void;
  unreadDms?: Record<string, number>;
  unreadChannels?: Record<string, boolean>;
  mutedTargets?: MuteTarget[];
  onOpenCommandPalette?: () => void;
  onOpenInviteMember?: () => void;
}

import { getUserRoleBadge } from '../lib/roles';

export function Sidebar({
  channels,
  selectedChannelId,
  onSelectChannel,
  onOpenCreateChannel,
  projects,
  selectedProjectId,
  onSelectProject,
  users,
  currentUser,
  activeView,
  onSelectView,
  taskCount,
  bugCount,
  criticalBugCount,
  onLogout,
  onOpenSettings,
  selectedDmUserId,
  onSelectDmUser,
  unreadDms = {},
  unreadChannels = {},
  mutedTargets = [],
  onOpenCommandPalette,
  onOpenInviteMember,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const roleInfo = getUserRoleBadge(currentUser);
  const canCreateChannel = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const canManageMembers = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const totalDmUnread = Object.values(unreadDms || {}).reduce((sum, count) => sum + count, 0);

  const query = searchQuery.toLowerCase().trim();
  const filteredProjects = projects.filter(
    (p) => !query || p.name.toLowerCase().includes(query) || p.key.toLowerCase().includes(query)
  );
  const filteredChannels = channels.filter(
    (c) => !query || c.name.toLowerCase().includes(query)
  );
  const filteredUsers = users
    .filter((u) => u.id !== currentUser?.id)
    .filter((u) => !query || u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query));

  return (
    <aside className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col h-full select-none shrink-0">
      {/* Workspace Header with Theme Toggle */}
      <div className="h-14 px-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-sm text-sm shrink-0">
            S
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm text-neutral-100 flex items-center gap-1 truncate">
              Slackers HQ
            </h1>
            <p className="text-[11px] text-neutral-500 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              {projects.length} Active Projects
            </p>
          </div>
        </div>

        {/* Theme Toggle in Header */}
        <ThemeToggle />
      </div>

      {/* Primary Navigation Switcher (Chat vs Project Kanban vs Bug Tracker) */}
      <div className="p-3 border-b border-neutral-800/80 space-y-1">
        {/* Chat Button */}
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

        {/* Kanban Button */}
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
            <span>Project Kanban</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeView === 'kanban' ? 'bg-indigo-700/80 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {taskCount}
          </span>
        </button>

        {/* Bug Tracker Button */}
        <button
          onClick={() => onSelectView('bugs')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
            activeView === 'bugs'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            <span>Bug Tracker</span>
          </div>
          <div className="flex items-center gap-1">
            {criticalBugCount > 0 && (
              <span className="text-[9px] bg-rose-950 text-rose-300 font-bold px-1.5 py-0.2 rounded-full border border-rose-500/40 animate-pulse">
                {criticalBugCount} critical
              </span>
            )}
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeView === 'bugs' ? 'bg-rose-700/80 text-white' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {bugCount}
            </span>
          </div>
        </button>
      </div>

      {/* Quick Search Filter across channels, projects, and users */}
      <div className="px-3 pt-2 pb-1 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={onOpenCommandPalette ? 'Search or press ⌘K...' : 'Search project, channel, user...'}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-11 py-1 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500/70 transition"
          />
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="absolute right-1.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-400 bg-neutral-800 hover:text-neutral-200 hover:bg-neutral-700 rounded border border-neutral-700 transition"
              title="Global Command Palette (Cmd+K / Ctrl+K)"
            >
              ⌘K
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Section: Projects & Channels */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {/* Projects Quick Jump */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <FolderKanban className="w-3.5 h-3.5 text-neutral-500" />
              Projects
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              {filteredProjects.length}
            </span>
          </div>

          <div className="space-y-0.5">
            {filteredProjects.map((project) => {
              const isActive = project.id === selectedProjectId;
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    onSelectProject(project.id);
                    if (activeView === 'chat') {
                      onSelectView('kanban');
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition group ${
                    isActive
                      ? 'bg-neutral-800/90 text-indigo-300 font-medium border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[10px] px-1 py-0.2 bg-neutral-950 rounded text-neutral-400 border border-neutral-800">
                      {project.key}
                    </span>
                    <span className="truncate">{project.name}</span>
                  </div>
                  {project.isPrivate && (
                    <Lock className="w-3 h-3 text-amber-500/80 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Channels Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Channels
            </span>
            {canCreateChannel && (
              <button
                onClick={onOpenCreateChannel}
                title="Add Channel (Admin/Manager)"
                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            {filteredChannels.map((channel) => {
              const isActive = activeView === 'chat' && !selectedDmUserId && channel.id === selectedChannelId;
              const isUnread = !isActive && !!unreadChannels?.[channel.id];
              const isChannelMuted = mutedTargets.some(
                (m) =>
                  m.targetType === 'channel' &&
                  m.targetId === channel.id &&
                  (m.mutedUntil === null || new Date(m.mutedUntil).getTime() > Date.now())
              );

              return (
                <button
                  key={channel.id}
                  onClick={() => {
                    onSelectChannel(channel.id);
                    onSelectView('chat');
                  }}
                  className={`relative w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition group ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30'
                      : isUnread
                      ? 'text-white font-bold bg-neutral-900/60 hover:bg-neutral-900'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  {/* Discord-style unread left indicator pill */}
                  {isUnread && (
                    <span
                      className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-2 rounded-r-full bg-white shadow-xs"
                      title="Unread messages"
                    />
                  )}
                  <div className="flex items-center gap-2 truncate">
                    {channel.isPrivate ? (
                      <Lock
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isUnread ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-400'
                        }`}
                      />
                    ) : (
                      <Hash
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isUnread ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-400'
                        }`}
                      />
                    )}
                    <span
                      className={`truncate transition-colors ${
                        isUnread ? 'font-bold text-white tracking-tight' : ''
                      }`}
                    >
                      {channel.name}
                    </span>
                    {isChannelMuted && (
                      <BellOff className="w-3 h-3 text-amber-400/80 shrink-0" title="Notifications muted" />
                    )}
                  </div>
                  {channel.memberCount > 0 && (
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                        isUnread
                          ? 'text-neutral-200 font-semibold bg-neutral-800'
                          : 'text-neutral-600 group-hover:text-neutral-500 bg-neutral-900'
                      }`}
                    >
                      {channel.memberCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Messages (End-to-End Encrypted) Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Direct Messages
            </span>
            <div className="flex items-center gap-1.5">
              {totalDmUnread > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-500 text-white shadow-sm animate-pulse">
                  {totalDmUnread}
                </span>
              )}
              {canManageMembers && onOpenInviteMember && (
                <button
                  onClick={onOpenInviteMember}
                  title="Invite or add teammate"
                  className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 transition"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            {filteredUsers.map((user) => {
              const isActive = activeView === 'chat' && selectedDmUserId === user.id;
              const unreadCount = unreadDms?.[user.id] || 0;
              const userRoleBadge = getUserRoleBadge(user);
              const isUserMuted = mutedTargets.some(
                (m) =>
                  m.targetType === 'dm' &&
                  m.targetId === user.id &&
                  (m.mutedUntil === null || new Date(m.mutedUntil).getTime() > Date.now())
              );

              return (
                <button
                  key={user.id}
                  onClick={() => {
                    if (onSelectDmUser) {
                      onSelectDmUser(user);
                      onSelectView('chat');
                    }
                  }}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition group ${
                    isActive
                      ? 'bg-neutral-800 text-neutral-100 font-medium'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="relative shrink-0">
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
                  <div className="truncate flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`truncate flex items-center gap-1.5 leading-tight text-xs ${unreadCount > 0 ? 'font-bold text-neutral-100' : 'font-medium'}`}>
                        <span className="truncate">{user.name}</span>
                        {isUserMuted && (
                          <BellOff className="w-3 h-3 text-amber-400/80 shrink-0" title="Notifications muted" />
                        )}
                      </span>
                      {unreadCount > 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white shrink-0 shadow-sm animate-pulse">
                          {unreadCount}
                        </span>
                      ) : (
                        <span className={`text-[8px] font-bold uppercase px-1 py-0.2 rounded border shrink-0 ${userRoleBadge.class}`}>
                          {userRoleBadge.shortLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {canManageMembers && onOpenInviteMember && (
              <button
                onClick={onOpenInviteMember}
                className="w-full mt-2 flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg border border-dashed border-neutral-800 hover:border-indigo-500/50 text-neutral-400 hover:text-indigo-400 hover:bg-indigo-500/5 transition text-xs font-medium group"
              >
                <UserPlus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Invite or Add Teammates</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      {currentUser && (
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
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
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-neutral-200 truncate">
                  {currentUser.name.split(' ')[0]}
                </p>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${roleInfo.class}`}>
                  {roleInfo.label}
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 truncate">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenSettings}
              title="User & Account Settings"
              className="p-1.5 text-neutral-500 hover:text-indigo-400 hover:bg-neutral-800 rounded-lg transition"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
