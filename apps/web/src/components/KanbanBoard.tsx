'use client';

import React, { useState } from 'react';
import {
  Task,
  TaskPriority,
  TaskStatus,
  User as UserType,
  UserRole,
} from '../types';
import { getUserRoleBadge } from '../lib/roles';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  MessageSquareShare,
  Trash2,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Lock,
} from 'lucide-react';

function getDueDateBadge(dueDateStr?: string): { label: string; className: string } | null {
  if (!dueDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr + 'T00:00:00');
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)}d late`,
      className: 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30 font-semibold',
    };
  } else if (diffDays === 0) {
    return {
      label: 'Today',
      className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold',
    };
  } else if (diffDays === 1) {
    return {
      label: 'Tomorrow',
      className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    };
  } else if (diffDays <= 3) {
    return {
      label: `${diffDays}d left`,
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    };
  } else {
    const month = due.toLocaleDateString('en-US', { month: 'short' });
    const day = due.getDate();
    return {
      label: `${month} ${day}`,
      className: 'bg-slate-100 dark:bg-neutral-800/90 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700/80',
    };
  }
}

interface Props {
  tasks: Task[];
  users: UserType[];
  currentUser?: UserType | null;
  currentUserRole?: UserRole;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onDiscussInChat: (task: Task) => void;
  onSelectTask?: (task: Task) => void;
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
  currentUser,
  currentUserRole,
  onUpdateTaskStatus,
  onDeleteTask,
  onDiscussInChat,
  onSelectTask,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // RBAC permissions: Only assignee and creator (or Admin/Manager) can move a card
  const canDeleteTasks = currentUserRole === 'admin' || currentUserRole === 'manager';

  const canUserMoveTask = (task: Task): boolean => {
    if (!currentUser) return false;
    if (currentUserRole === 'viewer') return false;
    const isAssignee = task.assigneeId === currentUser.id;
    const isCreator = task.creatorId === currentUser.id;
    const isAdminOrManager = currentUserRole === 'admin' || currentUserRole === 'manager';
    return isAssignee || isCreator || isAdminOrManager;
  };

  const filteredTasks = tasks.filter((task) => {
    if (
      searchQuery &&
      !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !task.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
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
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (!canUserMoveTask(task)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(task.id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, columnId: TaskStatus) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (task && canUserMoveTask(task) && task.status !== targetStatus) {
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
            placeholder="Search tasks, acceptance criteria..."
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

      {/* Kanban Board Columns */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="grid grid-flow-col auto-cols-[300px] gap-4 h-full min-h-[500px]">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);
            const totalColumnPoints = columnTasks.reduce((acc, curr) => acc + curr.storyPoints, 0);

            const isColHovered = dragOverColumn === col.id;
            const draggedTask = draggedTaskId ? tasks.find((t) => t.id === draggedTaskId) : null;
            const showDropSlot = isColHovered && draggedTask && draggedTask.status !== col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-xl flex flex-col h-full max-h-full overflow-hidden shadow-sm transition-all duration-200 border ${
                  isColHovered
                    ? 'ring-2 ring-indigo-500/80 bg-indigo-950/20 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
                    : 'bg-neutral-950/70 border-neutral-800/90'
                }`}
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

                {/* Task Cards */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {showDropSlot && (
                    <div className="h-20 border-2 border-dashed border-indigo-500/70 bg-indigo-500/10 rounded-xl flex items-center justify-center text-xs font-semibold text-indigo-400 animate-pulse">
                      Drop to move to {col.title}
                    </div>
                  )}

                  {columnTasks.length === 0 && !showDropSlot ? (
                    <div className="h-28 border border-dashed border-neutral-800 rounded-lg flex items-center justify-center text-[11px] text-neutral-600">
                      Drop tasks here
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const priorityInfo = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
                      const prevStatus = getPrevStatus(task.status);
                      const nextStatus = getNextStatus(task.status);
                      const isMovable = canUserMoveTask(task);
                      const isBeingDragged = draggedTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable={isMovable}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('button')) return;
                            onSelectTask?.(task);
                          }}
                          className={`bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 rounded-xl p-3.5 shadow-sm transition-all group hover:shadow-md ${
                            isBeingDragged ? 'opacity-30 scale-95 border-dashed border-indigo-400' : ''
                          } ${
                            isMovable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                          }`}
                        >
                          {/* Card Top: Priority & Points */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${priorityInfo.badge}`}
                              >
                                {priorityInfo.label}
                              </span>
                              <span className="text-[10px] bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-mono px-1.5 py-0.5 rounded">
                                {task.storyPoints} pts
                              </span>
                              {!isMovable && (
                                <span
                                  title="Only assignee or creator can move this task"
                                  className="flex items-center gap-0.5 text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-700"
                                >
                                  <Lock className="w-2.5 h-2.5 text-neutral-400" />
                                  <span>Locked</span>
                                </span>
                              )}
                              {task.dueDate && (() => {
                                const badge = getDueDateBadge(task.dueDate);
                                if (!badge) return null;
                                return (
                                  <span
                                    title={`Due: ${task.dueDate}`}
                                    className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium ${badge.className}`}
                                  >
                                    <Calendar className="w-2.5 h-2.5 shrink-0" />
                                    <span>{badge.label}</span>
                                  </span>
                                );
                              })()}
                              {task.commentCount !== undefined && task.commentCount > 0 && (
                                <span
                                  title={`${task.commentCount} comments`}
                                  className="flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-medium px-1.5 py-0.5 rounded border border-indigo-500/20"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{task.commentCount}</span>
                                </span>
                              )}
                              {task.qaSteps && task.qaSteps.length > 0 && (() => {
                                const passed = task.qaSteps.filter((s) => s.status === 'passed').length;
                                const failed = task.qaSteps.filter((s) => s.status === 'failed').length;
                                const total = task.qaSteps.length;

                                if (failed > 0) {
                                  return (
                                    <span
                                      title={`QA Review: ${failed} failed of ${total} steps`}
                                      className="flex items-center gap-0.5 text-[10px] font-semibold bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/30"
                                    >
                                      <ShieldAlert className="w-2.5 h-2.5" />
                                      <span>QA {failed}✕</span>
                                    </span>
                                  );
                                }
                                if (passed === total) {
                                  return (
                                    <span
                                      title={`QA Review: All ${total} steps passed`}
                                      className="flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30"
                                    >
                                      <ShieldCheck className="w-2.5 h-2.5" />
                                      <span>QA {passed}/{total} ✓</span>
                                    </span>
                                  );
                                }
                                return (
                                  <span
                                    title={`QA Review: ${passed}/${total} passed`}
                                    className="flex items-center gap-0.5 text-[10px] font-medium bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30"
                                  >
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    <span>QA {passed}/{total}</span>
                                  </span>
                                );
                              })()}
                            </div>

                            {/* Discuss in Chat */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDiscussInChat(task);
                              }}
                              title="Discuss in Chat"
                              className="text-neutral-500 hover:text-indigo-400 p-1 rounded hover:bg-neutral-800 transition"
                            >
                              <MessageSquareShare className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Title */}
                          <h5 className="font-semibold text-sm text-slate-800 dark:text-neutral-100 mb-1 leading-snug group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">
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
                            <div className="flex items-center gap-1.5">
                              {task.assignee ? (
                                <>
                                  <img
                                    src={task.assignee.avatar}
                                    alt={task.assignee.name}
                                    className="w-5 h-5 rounded-full object-cover ring-1 ring-neutral-700 shrink-0"
                                  />
                                  <span className="text-[11px] text-neutral-400 truncate max-w-[70px]">
                                    {task.assignee.name.split(' ')[0]}
                                  </span>
                                  <span
                                    title={getUserRoleBadge(task.assignee).label}
                                    className={`text-[8px] font-bold uppercase px-1 py-0.2 rounded border shrink-0 ${getUserRoleBadge(task.assignee).class}`}
                                  >
                                    {getUserRoleBadge(task.assignee).shortLabel}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[11px] text-neutral-600 italic">Unassigned</span>
                              )}
                            </div>

                            {/* Dual-Move Controls (1-Click Move + Delete) */}
                            <div className="flex items-center gap-1">
                              {isMovable && prevStatus && (
                                <button
                                  onClick={() => onUpdateTaskStatus(task.id, prevStatus)}
                                  title={`Move back to ${prevStatus.replace('_', ' ')}`}
                                  className="p-1 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded transition"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {isMovable && nextStatus && (
                                <button
                                  onClick={() => onUpdateTaskStatus(task.id, nextStatus)}
                                  title={`Advance to ${nextStatus.replace('_', ' ')}`}
                                  className="p-1 text-neutral-500 hover:text-indigo-300 hover:bg-neutral-800 rounded transition"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDeleteTasks && (
                                <button
                                  onClick={() => onDeleteTask(task.id)}
                                  title="Delete task (Admin/Manager)"
                                  className="p-1 text-neutral-600 hover:text-rose-400 hover:bg-neutral-800 rounded transition ml-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
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
