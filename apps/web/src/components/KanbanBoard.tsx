'use client';

import React, { useState } from 'react';
import {
  Task,
  TaskPriority,
  TaskStatus,
  User as UserType,
} from '../types';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareShare,
  Trash2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface Props {
  tasks: Task[];
  users: UserType[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onDiscussInChat: (task: Task) => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; bgBadge: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'border-neutral-700', bgBadge: 'bg-neutral-800 text-neutral-300' },
  { id: 'todo', title: 'To Do', color: 'border-blue-500/50', bgBadge: 'bg-blue-500/20 text-blue-300' },
  { id: 'in_progress', title: 'In Progress', color: 'border-amber-500/50', bgBadge: 'bg-amber-500/20 text-amber-300' },
  { id: 'in_review', title: 'In Review', color: 'border-purple-500/50', bgBadge: 'bg-purple-500/20 text-purple-300' },
  { id: 'done', title: 'Done', color: 'border-emerald-500/50', bgBadge: 'bg-emerald-500/20 text-emerald-300' },
];

const PRIORITY_STYLES: Record<TaskPriority, { label: string; badge: string }> = {
  low: { label: 'Low', badge: 'bg-neutral-800 text-neutral-400 border-neutral-700' },
  medium: { label: 'Medium', badge: 'bg-sky-950/60 text-sky-400 border-sky-800' },
  high: { label: 'High', badge: 'bg-amber-950/60 text-amber-400 border-amber-800' },
  urgent: { label: 'Urgent', badge: 'bg-rose-950/60 text-rose-400 border-rose-800' },
};

export function KanbanBoard({
  tasks,
  users,
  onUpdateTaskStatus,
  onDeleteTask,
  onDiscussInChat,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const filteredTasks = tasks.filter((task) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (assigneeFilter !== 'all' && task.assigneeId !== assigneeFilter) {
      return false;
    }
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    const order: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];
    const idx = order.indexOf(current);
    return idx < order.length - 1 ? order[idx + 1] : null;
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    const order: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];
    const idx = order.indexOf(current);
    return idx > 0 ? order[idx - 1] : null;
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    setDraggedTaskId(null);
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== targetStatus) {
      await onUpdateTaskStatus(taskId, targetStatus);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, descriptions..."
            className="w-full bg-transparent text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <span>Assignee:</span>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none"
            >
              <option value="all">All Teammates</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="grid grid-flow-col auto-cols-[300px] gap-4 h-full min-h-[500px]">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);
            const totalColumnPoints = columnTasks.reduce((acc, curr) => acc + curr.storyPoints, 0);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="bg-neutral-950/70 border border-neutral-800/90 rounded-xl flex flex-col h-full max-h-full overflow-hidden shadow-sm"
              >
                {/* Column Header */}
                <div className={`p-3 border-b ${col.color} flex items-center justify-between bg-neutral-900/40`}>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-xs tracking-wider uppercase text-neutral-200">
                      {col.title}
                    </h4>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${col.bgBadge}`}>
                      {columnTasks.length}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    {totalColumnPoints} pts
                  </span>
                </div>

                {/* Task Cards Feed */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {columnTasks.length === 0 ? (
                    <div className="h-28 border border-dashed border-neutral-800 rounded-lg flex items-center justify-center text-[11px] text-neutral-600">
                      Drop tasks here
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const priorityInfo = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
                      const prevStatus = getPrevStatus(task.status);
                      const nextStatus = getNextStatus(task.status);

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className="bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 rounded-xl p-3.5 shadow-sm transition group cursor-grab active:cursor-grabbing hover:shadow-md"
                        >
                          {/* Card Top: Priority & Story points */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${priorityInfo.badge}`}
                              >
                                {priorityInfo.label}
                              </span>
                              <span className="text-[10px] bg-neutral-800 text-neutral-400 font-mono px-1.5 py-0.5 rounded">
                                {task.storyPoints} pts
                              </span>
                            </div>

                            {/* Discuss in Chat button */}
                            <button
                              onClick={() => onDiscussInChat(task)}
                              title="Discuss in Chat channel"
                              className="text-neutral-500 hover:text-indigo-400 p-1 rounded hover:bg-neutral-800 transition"
                            >
                              <MessageSquareShare className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Title */}
                          <h5 className="font-semibold text-sm text-neutral-100 mb-1 leading-snug">
                            {task.title}
                          </h5>

                          {/* Description */}
                          {task.description && (
                            <p className="text-xs text-neutral-400 line-clamp-2 mb-2.5 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {task.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] bg-neutral-800/70 text-neutral-400 px-1.5 py-0.2 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer: Assignee & Action Controls */}
                          <div className="pt-2 border-t border-neutral-800/70 flex items-center justify-between">
                            {/* Assignee */}
                            <div className="flex items-center gap-1.5">
                              {task.assignee ? (
                                <>
                                  <img
                                    src={task.assignee.avatar}
                                    alt={task.assignee.name}
                                    className="w-5 h-5 rounded-full object-cover ring-1 ring-neutral-700"
                                  />
                                  <span className="text-[11px] text-neutral-400 truncate max-w-[90px]">
                                    {task.assignee.name.split(' ')[0]}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[11px] text-neutral-600 italic">Unassigned</span>
                              )}
                            </div>

                            {/* Dual-Mode Controls: 1-Click Move Buttons */}
                            <div className="flex items-center gap-1">
                              {prevStatus && (
                                <button
                                  onClick={() => onUpdateTaskStatus(task.id, prevStatus)}
                                  title={`Move back to ${prevStatus.replace('_', ' ')}`}
                                  className="p-1 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded transition"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {nextStatus && (
                                <button
                                  onClick={() => onUpdateTaskStatus(task.id, nextStatus)}
                                  title={`Advance to ${nextStatus.replace('_', ' ')}`}
                                  className="p-1 text-neutral-500 hover:text-indigo-300 hover:bg-neutral-800 rounded transition"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => onDeleteTask(task.id)}
                                title="Delete task"
                                className="p-1 text-neutral-600 hover:text-rose-400 hover:bg-neutral-800 rounded transition ml-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
