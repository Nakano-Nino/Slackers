'use client';

import React from 'react';
import { SprintStats } from '../types';
import { Sparkles, Plus, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface Props {
  stats: SprintStats | null;
  onOpenCreateTask: () => void;
}

export function SprintProgressBar({ stats, onOpenCreateTask }: Props) {
  if (!stats) return null;

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-md mb-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Sprint Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3 h-3" />
              Active Sprint
            </span>
            <h3 className="text-base font-bold text-neutral-100">{stats.sprintName}</h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Velocity: <strong>{stats.completedPoints}</strong> / {stats.totalPoints} pts</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>{stats.tasksByStatus.done} of {stats.totalTasks} tasks finished</span>
            </span>
          </div>
        </div>

        {/* Progress bar + Action Button */}
        <div className="flex items-center gap-4">
          <div className="w-48 sm:w-60">
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-neutral-400">Sprint Completion</span>
              <span className="text-indigo-300">{stats.progressPercentage}%</span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.progressPercentage}%` }}
              />
            </div>
          </div>

          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>
    </div>
  );
}
