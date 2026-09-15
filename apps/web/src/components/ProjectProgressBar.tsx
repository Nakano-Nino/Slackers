'use client';

import React from 'react';
import { Project, ProjectStats, UserRole } from '../types';
import {
  FolderKanban,
  Plus,
  TrendingUp,
  CheckCircle,
  Lock,
  Globe,
  FolderPlus,
  ChevronDown,
} from 'lucide-react';

interface Props {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (projectId: string) => void;
  stats: ProjectStats | null;
  currentUserRole?: UserRole;
  onOpenCreateTask: () => void;
  onOpenCreateProject: () => void;
}

export function ProjectProgressBar({
  projects,
  activeProject,
  onSelectProject,
  stats,
  currentUserRole,
  onOpenCreateTask,
  onOpenCreateProject,
}: Props) {
  const canManageProjects = currentUserRole === 'admin' || currentUserRole === 'manager';
  const canCreateTasks = currentUserRole !== 'viewer';

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-md mb-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Project Selector & Overview */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Project Switcher Dropdown */}
            <div className="relative inline-block">
              <select
                value={activeProject?.id || ''}
                onChange={(e) => onSelectProject(e.target.value)}
                className="appearance-none bg-neutral-950 border border-neutral-700 hover:border-indigo-500 rounded-lg pl-3 pr-8 py-1.5 text-sm font-bold text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key}] {p.name} {p.isPrivate ? '🔒' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Privacy Badge */}
            {activeProject?.isPrivate ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Lock className="w-3 h-3" />
                Private
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Globe className="w-3 h-3" />
                Team-Wide
              </span>
            )}
          </div>

          <p className="text-xs text-neutral-400 line-clamp-1 max-w-xl">
            {activeProject?.description || 'Track deliverables, assignees, and workflow status for this project.'}
          </p>

          {stats && (
            <div className="flex items-center gap-4 text-xs text-neutral-400 pt-0.5">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Points Done: <strong>{stats.completedPoints}</strong> / {stats.totalPoints} pts</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>{stats.tasksByStatus.done} of {stats.totalTasks} tasks completed</span>
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {stats && (
            <div className="w-44 sm:w-56">
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-neutral-400">Project Progress</span>
                <span className="text-indigo-300 font-bold">{stats.progressPercentage}%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {canManageProjects && (
              <button
                onClick={onOpenCreateProject}
                title="Create a new Project (Admin/Manager)"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700 transition"
              >
                <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
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
    </div>
  );
}
