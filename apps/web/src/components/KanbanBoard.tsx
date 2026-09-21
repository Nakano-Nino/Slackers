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
  ChevronDown,
  ChevronUp,
  MessageSquare,
  MessageSquareShare,
  Trash2,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Lock,
  CheckSquare,
  Plus,
  Flame,
  Layers,
  Users,
  Flag,
  X,
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
  onCreateTask?: (taskData: {
    projectId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    storyPoints: number;
    tags: string[];
    dueDate?: string;
    assigneeId?: string;
  }) => Promise<void>;
  selectedProjectId?: string;
  onToggleSubtask?: (taskId: string, subtaskId: string, currentCompleted: boolean) => Promise<void>;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; bgBadge: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'border-neutral-700', bgBadge: 'bg-neutral-800 text-neutral-300' },
  { id: 'todo', title: 'To Do', color: 'border-blue-500/50', bgBadge: 'bg-blue-500/20 text-blue-300' },
  { id: 'in_progress', title: 'In Progress', color: 'border-amber-500/50', bgBadge: 'bg-amber-500/20 text-amber-300' },
  { id: 'in_review', title: 'In Review', color: 'border-purple-500/50', bgBadge: 'bg-purple-500/20 text-purple-300' },
  { id: 'done', title: 'Done', color: 'border-emerald-500/50', bgBadge: 'bg-emerald-500/20 text-emerald-300' },
];

const COLUMN_WIP_LIMITS: Partial<Record<TaskStatus, number>> = {
  in_progress: 4,
  in_review: 3,
};

const PRIORITY_STYLES: Record<TaskPriority, { label: string; badge: string; color: string }> = {
  low: { label: 'Low', badge: 'bg-neutral-800 text-neutral-400 border-neutral-700', color: 'text-neutral-400' },
  medium: { label: 'Medium', badge: 'bg-sky-950/60 text-sky-400 border-sky-800', color: 'text-sky-400' },
  high: { label: 'High', badge: 'bg-amber-950/60 text-amber-400 border-amber-800', color: 'text-amber-400' },
  urgent: { label: 'Urgent', badge: 'bg-rose-950/60 text-rose-400 border-rose-800', color: 'text-rose-400' },
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
  onCreateTask,
  selectedProjectId,
  onToggleSubtask,
}: Props) {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'my_tasks' | 'urgent' | 'due_soon' | 'has_subtasks'>('all');

  // Group By & Swimlanes
  const [groupBy, setGroupBy] = useState<'status' | 'assignee' | 'priority'>('status');
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Record<string, boolean>>({});

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Rapid Inline Task Creation
  const [inlineColumn, setInlineColumn] = useState<TaskStatus | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [isSubmittingInline, setIsSubmittingInline] = useState(false);

  // Subtask quick checklist popover on card
  const [openSubtaskCardId, setOpenSubtaskCardId] = useState<string | null>(null);

  // RBAC permissions
  const canDeleteTasks = currentUserRole === 'admin' || currentUserRole === 'manager';
  const canCreateTasks = currentUserRole !== 'viewer' && !!onCreateTask;

  const canUserMoveTask = (task: Task): boolean => {
    if (!currentUser) return false;
    if (currentUserRole === 'viewer') return false;
    const isAssignee = task.assigneeId === currentUser.id;
    const isCreator = task.creatorId === currentUser.id;
    const isAdminOrManager = currentUserRole === 'admin' || currentUserRole === 'manager';
    return isAssignee || isCreator || isAdminOrManager;
  };

  // Board Health & Velocity Calculations
  const totalIssues = tasks.length;
  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const donePoints = doneTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const inFlightPoints = tasks
    .filter((t) => t.status === 'in_progress' || t.status === 'in_review')
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const urgentCount = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length;
  const percentComplete = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    // Search query
    if (
      searchQuery &&
      !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !task.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(task.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }

    // Assignee dropdown filter
    if (assigneeFilter !== 'all' && task.assigneeId !== assigneeFilter) {
      return false;
    }

    // Priority dropdown filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false;
    }

    // Quick filter chips
    if (quickFilter === 'my_tasks' && task.assigneeId !== currentUser?.id) {
      return false;
    }
    if (quickFilter === 'urgent' && task.priority !== 'urgent') {
      return false;
    }
    if (quickFilter === 'due_soon') {
      if (!task.dueDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(task.dueDate + 'T00:00:00');
      const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 3) return false;
    }
    if (quickFilter === 'has_subtasks' && (!task.subtasks || task.subtasks.length === 0)) {
      return false;
    }

    return true;
  });

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (assigneeFilter !== 'all' ? 1 : 0) +
    (priorityFilter !== 'all' ? 1 : 0) +
    (quickFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery('');
    setAssigneeFilter('all');
    setPriorityFilter('all');
    setQuickFilter('all');
  };

  const toggleSwimlane = (id: string) => {
    setCollapsedSwimlanes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllSwimlanes = (collapse: boolean) => {
    if (groupBy === 'assignee') {
      const state: Record<string, boolean> = { unassigned: collapse };
      users.forEach((u) => {
        state[u.id] = collapse;
      });
      setCollapsedSwimlanes(state);
    } else if (groupBy === 'priority') {
      setCollapsedSwimlanes({
        urgent: collapse,
        high: collapse,
        medium: collapse,
        low: collapse,
      });
    }
  };

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

  // Handle Rapid Inline Task Creation
  const handleInlineSubmit = async (colId: TaskStatus, e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim() || isSubmittingInline || !onCreateTask) return;
    setIsSubmittingInline(true);
    try {
      await onCreateTask({
        projectId: selectedProjectId || 'proj-core',
        title: inlineTitle.trim(),
        description: '',
        status: colId,
        priority: 'medium',
        storyPoints: 1,
        tags: ['Task'],
      });
      setInlineTitle('');
      setInlineColumn(null);
    } catch (err) {
      console.error('Failed to inline create task:', err);
    } finally {
      setIsSubmittingInline(false);
    }
  };

  // Render a Single Task Card
  const renderTaskCard = (task: Task) => {
    const priorityInfo = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
    const prevStatus = getPrevStatus(task.status);
    const nextStatus = getNextStatus(task.status);
    const isMovable = canUserMoveTask(task);
    const isBeingDragged = draggedTaskId === task.id;

    // Subtask metrics
    const subtasks = task.subtasks || [];
    const hasSubtasks = subtasks.length > 0;
    const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
    const subtaskPercent = hasSubtasks ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;
    const isSubtaskPopoverOpen = openSubtaskCardId === task.id;

    return (
      <div
        key={task.id}
        draggable={isMovable}
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('input')) return;
          onSelectTask?.(task);
        }}
        className={`relative bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 rounded-xl p-3.5 shadow-sm transition-all group hover:shadow-md ${
          isBeingDragged ? 'opacity-30 scale-95 border-dashed border-indigo-400' : ''
        } ${isMovable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      >
        {/* Card Top: Priority, Story Points, Due Date, QA */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${priorityInfo.badge}`}>
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

            {/* Subtask Quick Badge */}
            {hasSubtasks && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenSubtaskCardId(isSubtaskPopoverOpen ? null : task.id);
                }}
                title={`Subtasks: ${completedSubtasks}/${subtasks.length} completed`}
                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium transition ${
                  completedSubtasks === subtasks.length
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <CheckSquare className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
                <span className="font-mono">
                  {completedSubtasks}/{subtasks.length}
                </span>
              </button>
            )}

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
          <div className="flex flex-wrap gap-1 mb-2.5">
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

        {/* Subtask Mini Progress Bar */}
        {hasSubtasks && (
          <div className="mb-2.5">
            <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  subtaskPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${subtaskPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Subtask Inline Popover Accordion */}
        {isSubtaskPopoverOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mb-2.5 p-2 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1.5 animate-in fade-in duration-150 text-xs"
          >
            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-semibold uppercase tracking-wider pb-1 border-b border-neutral-800">
              <span>Quick Checklist ({completedSubtasks}/{subtasks.length})</span>
              <button
                onClick={() => setOpenSubtaskCardId(null)}
                className="text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {subtasks.map((sub) => (
                <label
                  key={sub.id}
                  className="flex items-center gap-2 p-1 rounded hover:bg-neutral-900 cursor-pointer text-[11px]"
                >
                  <input
                    type="checkbox"
                    checked={sub.isCompleted}
                    onChange={() => onToggleSubtask?.(task.id, sub.id, sub.isCompleted)}
                    className="rounded border-neutral-700 bg-neutral-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className={sub.isCompleted ? 'line-through text-neutral-500' : 'text-neutral-300'}>
                    {sub.title}
                  </span>
                </label>
              ))}
            </div>
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
                  className={`text-[8px] font-bold uppercase px-1 py-0.2 rounded border shrink-0 ${
                    getUserRoleBadge(task.assignee).class
                  }`}
                >
                  {getUserRoleBadge(task.assignee).shortLabel}
                </span>
              </>
            ) : (
              <span className="text-[11px] text-neutral-600 italic">Unassigned</span>
            )}
          </div>

          {/* Move Controls + Delete */}
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
  };

  // Render a Column with Cards & Inline Add
  const renderColumn = (col: (typeof COLUMNS)[0], columnTasks: Task[], swimlaneKey = 'global') => {
    const totalColumnPoints = columnTasks.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);
    const isColHovered = dragOverColumn === col.id;
    const draggedTask = draggedTaskId ? tasks.find((t) => t.id === draggedTaskId) : null;
    const showDropSlot = isColHovered && draggedTask && draggedTask.status !== col.id;

    // WIP limits
    const wipLimit = COLUMN_WIP_LIMITS[col.id];
    const isWipExceeded = wipLimit !== undefined && columnTasks.length > wipLimit;

    const isInlineOpen = inlineColumn === col.id;

    return (
      <div
        key={`${swimlaneKey}-${col.id}`}
        onDragOver={(e) => handleDragOver(e, col.id)}
        onDragLeave={(e) => handleDragLeave(e, col.id)}
        onDrop={(e) => handleDrop(e, col.id)}
        className={`rounded-xl flex flex-col h-full max-h-full overflow-hidden shadow-sm transition-all duration-200 border ${
          isColHovered
            ? 'ring-2 ring-indigo-500/80 bg-indigo-950/20 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
            : isWipExceeded
            ? 'bg-neutral-950/80 border-amber-500/40 ring-1 ring-amber-500/20'
            : 'bg-neutral-950/70 border-neutral-800/90'
        }`}
      >
        {/* Column Header */}
        <div className={`p-3 border-b ${col.color} flex items-center justify-between bg-neutral-900/40 shrink-0`}>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-xs tracking-wider uppercase text-neutral-200">
              {col.title}
            </h4>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${col.bgBadge}`}>
              {columnTasks.length}
            </span>
            {wipLimit !== undefined && (
              <span
                title={isWipExceeded ? `WIP Limit Exceeded! Max ${wipLimit} recommended` : `WIP Limit: ${wipLimit}`}
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                  isWipExceeded
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                }`}
              >
                {columnTasks.length}/{wipLimit} WIP
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-500 font-medium">{totalColumnPoints} pts</span>
            {canCreateTasks && (
              <button
                type="button"
                onClick={() => {
                  setInlineColumn(isInlineOpen ? null : col.id);
                  setInlineTitle('');
                }}
                title={`Quick add issue to ${col.title}`}
                className="p-1 rounded text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Task Cards Feed */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
          {/* Inline Fast Add Input */}
          {isInlineOpen && (
            <form
              onSubmit={(e) => handleInlineSubmit(col.id, e)}
              className="p-2.5 rounded-xl bg-neutral-900 border border-indigo-500/50 shadow-md space-y-2 animate-in fade-in duration-150"
            >
              <input
                type="text"
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                placeholder="Issue title... (Enter to save, Esc to cancel)"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setInlineColumn(null);
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setInlineColumn(null)}
                  className="text-[10px] px-2 py-1 rounded text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!inlineTitle.trim() || isSubmittingInline}
                  className="text-[10px] px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50"
                >
                  {isSubmittingInline ? 'Saving...' : 'Add Issue'}
                </button>
              </div>
            </form>
          )}

          {showDropSlot && (
            <div className="h-20 border-2 border-dashed border-indigo-500/70 bg-indigo-500/10 rounded-xl flex items-center justify-center text-xs font-semibold text-indigo-400 animate-pulse">
              Drop to move to {col.title}
            </div>
          )}

          {columnTasks.length === 0 && !showDropSlot && !isInlineOpen ? (
            <div className="h-24 border border-dashed border-neutral-800/80 rounded-lg flex flex-col items-center justify-center text-[11px] text-neutral-600">
              <span>Drop tasks here</span>
              {canCreateTasks && (
                <button
                  onClick={() => {
                    setInlineColumn(col.id);
                    setInlineTitle('');
                  }}
                  className="mt-1 text-[10px] text-indigo-400 hover:underline"
                >
                  + Add task
                </button>
              )}
            </div>
          ) : (
            columnTasks.map(renderTaskCard)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Board Velocity & Health Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 shrink-0">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Board Velocity</span>
            <span className="text-xs font-mono font-semibold text-neutral-200 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              {totalIssues} issues · {totalPoints} pts
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <span className="text-xs font-mono text-neutral-300 font-medium">
              {percentComplete}% done ({donePoints} pts)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{inFlightPoints} pts in flight</span>
          </div>

          {urgentCount > 0 && (
            <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <Flame className="w-3.5 h-3.5" />
              <span>{urgentCount} Urgent</span>
            </div>
          )}
        </div>

        {/* Group-by Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-neutral-500" />
            Group by:
          </span>
          <div className="flex items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setGroupBy('status')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                groupBy === 'status' ? 'bg-indigo-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Status
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('assignee')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                groupBy === 'assignee'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Assignee
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('priority')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                groupBy === 'priority'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Priority
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, acceptance criteria, #tags..."
            className="w-full bg-transparent text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
        </div>

        {/* Linear-Style Quick Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setQuickFilter(quickFilter === 'my_tasks' ? 'all' : 'my_tasks')}
            className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium flex items-center gap-1.5 ${
              quickFilter === 'my_tasks'
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/60 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>My Issues</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter(quickFilter === 'urgent' ? 'all' : 'urgent')}
            className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium flex items-center gap-1.5 ${
              quickFilter === 'urgent'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <Flame className="w-3 h-3 text-rose-400" />
            <span>Urgent</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter(quickFilter === 'due_soon' ? 'all' : 'due_soon')}
            className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium flex items-center gap-1.5 ${
              quickFilter === 'due_soon'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>Due Soon (≤3d)</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter(quickFilter === 'has_subtasks' ? 'all' : 'has_subtasks')}
            className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium flex items-center gap-1.5 ${
              quickFilter === 'has_subtasks'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <CheckSquare className="w-3 h-3 text-emerald-400" />
            <span>Has Subtasks</span>
          </button>
        </div>

        {/* Dropdowns & Reset */}
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

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs px-2 py-1 text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800 rounded flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Reset ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Board Content Views */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* VIEW 1: Standard Status Columns */}
        {groupBy === 'status' && (
          <div className="overflow-x-auto h-full">
            <div className="grid grid-flow-col auto-cols-[310px] gap-4 h-full min-h-[550px]">
              {COLUMNS.map((col) => {
                const columnTasks = filteredTasks.filter((t) => t.status === col.id);
                return renderColumn(col, columnTasks, 'standard');
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: Assignee Developer Swimlanes */}
        {groupBy === 'assignee' && (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2 mb-2">
              <button
                type="button"
                onClick={() => toggleAllSwimlanes(false)}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Expand All
              </button>
              <span className="text-neutral-600">•</span>
              <button
                type="button"
                onClick={() => toggleAllSwimlanes(true)}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Collapse All
              </button>
            </div>

            {/* Swimlanes for each user */}
            {users.map((u) => {
              const userTasks = filteredTasks.filter((t) => t.assigneeId === u.id);
              const userPoints = userTasks.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);
              const isCollapsed = !!collapsedSwimlanes[u.id];

              return (
                <div
                  key={u.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/60 overflow-hidden shadow-sm"
                >
                  {/* Swimlane Header */}
                  <div
                    onClick={() => toggleSwimlane(u.id)}
                    className="p-3 bg-neutral-900/60 flex items-center justify-between cursor-pointer hover:bg-neutral-900 transition"
                  >
                    <div className="flex items-center gap-3">
                      <button type="button" className="text-neutral-400">
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-neutral-700"
                      />
                      <span className="font-semibold text-xs text-neutral-200">{u.name}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                          getUserRoleBadge(u).class
                        }`}
                      >
                        {getUserRoleBadge(u).label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="font-mono bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                        {userTasks.length} issues · {userPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* Swimlane Columns Body */}
                  {!isCollapsed && (
                    <div className="p-3 overflow-x-auto">
                      <div className="grid grid-flow-col auto-cols-[290px] gap-3 min-h-[300px]">
                        {COLUMNS.map((col) => {
                          const colTasks = userTasks.filter((t) => t.status === col.id);
                          return renderColumn(col, colTasks, u.id);
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned Swimlane */}
            {(() => {
              const unassignedTasks = filteredTasks.filter((t) => !t.assigneeId);
              const unassignedPoints = unassignedTasks.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);
              const isCollapsed = !!collapsedSwimlanes['unassigned'];

              return (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 overflow-hidden shadow-sm">
                  <div
                    onClick={() => toggleSwimlane('unassigned')}
                    className="p-3 bg-neutral-900/60 flex items-center justify-between cursor-pointer hover:bg-neutral-900 transition"
                  >
                    <div className="flex items-center gap-3">
                      <button type="button" className="text-neutral-400">
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] text-neutral-400 font-bold border border-neutral-700">
                        ?
                      </div>
                      <span className="font-semibold text-xs text-neutral-400 italic">Unassigned Issues</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="font-mono bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                        {unassignedTasks.length} issues · {unassignedPoints} pts
                      </span>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="p-3 overflow-x-auto">
                      <div className="grid grid-flow-col auto-cols-[290px] gap-3 min-h-[300px]">
                        {COLUMNS.map((col) => {
                          const colTasks = unassignedTasks.filter((t) => t.status === col.id);
                          return renderColumn(col, colTasks, 'unassigned');
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* VIEW 3: Priority Swimlanes */}
        {groupBy === 'priority' && (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2 mb-2">
              <button
                type="button"
                onClick={() => toggleAllSwimlanes(false)}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Expand All
              </button>
              <span className="text-neutral-600">•</span>
              <button
                type="button"
                onClick={() => toggleAllSwimlanes(true)}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Collapse All
              </button>
            </div>

            {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => {
              const priorityTasks = filteredTasks.filter((t) => t.priority === p);
              const priorityPoints = priorityTasks.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);
              const isCollapsed = !!collapsedSwimlanes[p];
              const pStyle = PRIORITY_STYLES[p];

              return (
                <div
                  key={p}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/60 overflow-hidden shadow-sm"
                >
                  {/* Swimlane Header */}
                  <div
                    onClick={() => toggleSwimlane(p)}
                    className="p-3 bg-neutral-900/60 flex items-center justify-between cursor-pointer hover:bg-neutral-900 transition"
                  >
                    <div className="flex items-center gap-3">
                      <button type="button" className="text-neutral-400">
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <Flag className={`w-4 h-4 ${pStyle.color}`} />
                      <span className="font-semibold text-xs text-neutral-200 uppercase tracking-wider">
                        {pStyle.label} Priority
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${pStyle.badge}`}>
                        {priorityTasks.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="font-mono bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                        {priorityTasks.length} issues · {priorityPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* Swimlane Columns Body */}
                  {!isCollapsed && (
                    <div className="p-3 overflow-x-auto">
                      <div className="grid grid-flow-col auto-cols-[290px] gap-3 min-h-[300px]">
                        {COLUMNS.map((col) => {
                          const colTasks = priorityTasks.filter((t) => t.status === col.id);
                          return renderColumn(col, colTasks, p);
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

