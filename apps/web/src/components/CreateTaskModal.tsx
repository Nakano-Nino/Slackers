'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckSquare, User, Flag, Hash, Folder, Calendar, ShieldCheck } from 'lucide-react';
import { Project, TaskPriority, TaskStatus, User as UserType } from '../types';
import { formatUserRole } from '../lib/roles';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: {
    projectId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    storyPoints: number;
    tags: string[];
    dueDate?: string;
    assigneeId?: string;
    qaSteps?: Array<{ title: string; description?: string }>;
  }) => Promise<void>;
  projects: Project[];
  defaultProjectId: string;
  users: UserType[];
  currentUser?: UserType | null;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onCreate,
  projects,
  defaultProjectId,
  users,
  currentUser,
}: Props) {
  const isQAEngineer = currentUser?.developerRole === 'qa_engineer';
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [qaStepsInput, setQaStepsInput] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [storyPoints, setStoryPoints] = useState<number>(3);
  const [tagsInput, setTagsInput] = useState('Frontend, Feature');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const qaSteps = isQAEngineer
        ? qaStepsInput
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((title) => ({ title }))
        : [];

      await onCreate({
        projectId: projectId || projects[0]?.id || 'proj-core',
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        storyPoints: Number(storyPoints) || 1,
        tags: tags.length ? tags : ['Task'],
        dueDate: dueDate || undefined,
        assigneeId: assigneeId || undefined,
        qaSteps: qaSteps.length > 0 ? qaSteps : undefined,
      });

      setTitle('');
      setDescription('');
      setQaStepsInput('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            Create Project Task
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Target Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.key}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build authentication gateway"
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Acceptance criteria, architecture notes, or details..."
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {isQAEngineer && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  QA Review Steps (Optional)
                </span>
                <span className="text-[10px] text-neutral-500 font-normal lowercase">1 test step per line</span>
              </label>
              <textarea
                value={qaStepsInput}
                onChange={(e) => setQaStepsInput(e.target.value)}
                placeholder="e.g. Verify happy path with valid inputs&#10;Verify validation error when required field is empty&#10;Verify responsive rendering on mobile"
                rows={2}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Column / Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {formatUserRole(u)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Story Points (Fibonacci)
              </label>
              <select
                value={storyPoints}
                onChange={(e) => setStoryPoints(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="1">1 pt (trivial)</option>
                <option value="2">2 pts (small)</option>
                <option value="3">3 pts (medium)</option>
                <option value="5">5 pts (standard)</option>
                <option value="8">8 pts (large)</option>
                <option value="13">13 pts (complex)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Due Date
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(Date.now() + 7 * 86400000);
                    setDueDate(d.toISOString().split('T')[0]);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition"
                >
                  +1 Week
                </button>
                <span className="text-neutral-600">·</span>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(Date.now() + 14 * 86400000);
                    setDueDate(d.toISOString().split('T')[0]);
                  }}
                  className="text-neutral-400 hover:text-neutral-200 transition"
                >
                  +2 Weeks
                </button>
                <span className="text-neutral-600">·</span>
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-neutral-500 hover:text-neutral-300 transition"
                >
                  Clear
                </button>
              </div>
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Tags <span className="text-neutral-600 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Backend, API, Postgres"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition shadow-sm"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
