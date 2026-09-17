'use client';

import React from 'react';
import { Project, ProjectStats, UserRole } from '../types';
import {
  FolderKanban,
  Plus,
  Lock,
  Globe,
  FolderPlus,
  ChevronDown,
  Users,
} from 'lucide-react';

interface Props {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (projectId: string) => void;
  stats: ProjectStats | null;
  currentUserRole?: UserRole;
  currentUserId?: string;
  onOpenCreateTask: () => void;
  onOpenCreateProject: () => void;
  onOpenManageMembers?: () => void;
}

export function ProjectProgressBar({
  projects,
  activeProject,
  onSelectProject,
  stats,
  currentUserRole,
  currentUserId,
  onOpenCreateTask,
  onOpenCreateProject,
  onOpenManageMembers,
}: Props) {
  const canManageProjects = currentUserRole === 'admin' || currentUserRole === 'manager';
  const canCreateTasks = currentUserRole === 'admin' || currentUserRole === 'manager';
  const canManageMembers =
    activeProject?.isPrivate &&
    (currentUserRole === 'admin' ||
      currentUserRole === 'manager' ||
      (currentUserId && activeProject.ownerId === currentUserId));

  const memberCount = activeProject?.isPrivate
    ? activeProject.memberIds?.length || activeProject.memberCount || 1
    : activeProject?.memberCount || 'All';

  return (
    <div className="bg-white dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm mb-5 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Project Selector & Overview */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Project Switcher Dropdown */}
            <div className="relative inline-block">
              <select
                value={activeProject?.id || ''}
                onChange={(e) => onSelectProject(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 hover:border-indigo-500 rounded-lg pl-3 pr-8 py-1.5 text-sm font-bold text-slate-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key}] {p.name} {p.isPrivate ? '🔒' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Privacy Badge */}
            {activeProject?.isPrivate ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                <Lock className="w-3 h-3" />
                Restricted ({memberCount} members)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Globe className="w-3 h-3" />
                Team-Wide
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-1 max-w-xl">
            {activeProject?.description || 'Track deliverables, assignees, and workflow status for this project.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {canManageMembers && onOpenManageMembers && (
            <button
              onClick={onOpenManageMembers}
              title="Manage Project Member Access"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-neutral-700 transition"
            >
              <Users className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Members ({memberCount})</span>
            </button>
          )}

          {canManageProjects && (
            <button
              onClick={onOpenCreateProject}
              title="Create a new Project (Admin/Manager)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-neutral-700 transition"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>New Project</span>
            </button>
          )}

          {canCreateTasks && (
            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
