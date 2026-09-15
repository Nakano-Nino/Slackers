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
  FolderKanban,
  LogOut,
  Shield,
} from 'lucide-react';
import { Channel, Project, User } from '../types';

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
  activeView: 'chat' | 'kanban';
  onSelectView: (view: 'chat' | 'kanban') => void;
  taskCount: number;
  onLogout: () => void;
}

const ROLE_BADGES: Record<string, { label: string; class: string }> = {
  admin: { label: 'Admin', class: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  manager: { label: 'Manager', class: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  member: { label: 'Member', class: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  viewer: { label: 'Viewer', class: 'bg-neutral-800 text-neutral-400 border-neutral-700' },
};

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
  onLogout,
}: Props) {
  const roleInfo = currentUser?.role ? ROLE_BADGES[currentUser.role] : ROLE_BADGES.member;

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
              {projects.length} Active Projects
            </p>
          </div>
        </div>
      </div>

      {/* Primary Navigation Switcher (Chat vs Project Kanban) */}
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
              {projects.length}
            </span>
          </div>

          <div className="space-y-0.5">
            {projects.map((project) => {
              const isActive = project.id === selectedProjectId;
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    onSelectProject(project.id);
                    onSelectView('kanban');
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

        {/* Teammates */}
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
                <div className="truncate flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate block leading-tight text-xs font-medium">
                      {user.name}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-neutral-500">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile & Logout Bar */}
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

          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
