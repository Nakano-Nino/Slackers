'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Lock, Globe, Key } from 'lucide-react';
import { Project } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: {
    name: string;
    key: string;
    description: string;
    isPrivate: boolean;
  }) => Promise<Project | void>;
}

export function CreateProjectModal({ isOpen, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key.length <= 4) {
      // Auto-generate key from first letters of words
      const words = val.trim().split(/\s+/);
      const generated = words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
      if (generated) setKey(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await onCreate({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim(),
        isPrivate,
      });
      setName('');
      setKey('');
      setDescription('');
      setIsPrivate(false);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-indigo-400" />
            Create New Project
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
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Payments & Checkout"
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Project Key <span className="text-neutral-500 font-normal">(short prefix for tasks)</span>
            </label>
            <div className="relative flex items-center">
              <Key className="absolute left-3 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="PAY"
                maxLength={6}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are the goals and deliverables for this project?"
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Access toggle: Private vs Team-wide */}
          <div className="p-3.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
              Project Visibility
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPrivate ? (
                  <Lock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Globe className="w-4 h-4 text-emerald-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    {isPrivate ? 'Private Project' : 'Team-Wide Project'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {isPrivate
                      ? 'Only Admins, Managers, and assigned members have access'
                      : 'All members across the workspace can view and track tasks'}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !key.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition shadow-sm"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
