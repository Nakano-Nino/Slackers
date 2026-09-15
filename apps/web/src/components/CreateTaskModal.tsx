'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckSquare, User, Flag, Hash, Folder } from 'lucide-react';
import { Project, TaskPriority, TaskStatus, User as UserType } from '../types';

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
    assigneeId?: string;
  }) => Promise<void>;
  projects: Project[];
  defaultProjectId: string;
  users: UserType[];
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onCreate,
  projects,
  defaultProjectId,
  users,
}: Props) {
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [storyPoints, setStoryPoints] = useState<number>(3);
  const [tagsInput, setTagsInput] = useState('Frontend, Feature');
  const [assigneeId, setAssigneeId] = useState<string>('');
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

      await onCreate({
        projectId: projectId || projects[0]?.id || 'proj-core',
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        storyPoints: Number(storyPoints) || 1,
        tags: tags.length ? tags : ['Task'],
        assigneeId: assigneeId || undefined,
      });

      setTitle('');
      setDescription('');
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
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

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
                    {u.name} ({u.role})
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
