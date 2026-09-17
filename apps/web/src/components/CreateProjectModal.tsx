'use client';

import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Lock, Globe, Key, Users, Search, Shield } from 'lucide-react';
import { Project, User } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: {
    name: string;
    key: string;
    description: string;
    isPrivate: boolean;
    memberIds?: string[];
  }) => Promise<Project | void>;
  users?: User[];
  currentUser?: User | null;
}

export function CreateProjectModal({ isOpen, onClose, onCreate, users = [], currentUser }: Props) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (currentUser && !selectedMemberIds.includes(currentUser.id)) {
        setSelectedMemberIds([currentUser.id]);
      }
    }
  }, [isOpen, currentUser]);

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

  const handleTogglePrivate = (checked: boolean) => {
    setIsPrivate(checked);
    if (checked && selectedMemberIds.length === 0 && currentUser) {
      setSelectedMemberIds([currentUser.id]);
    }
  };

  const toggleMember = (userId: string) => {
    // Current user / creator cannot be unchecked
    if (currentUser && userId === currentUser.id) return;
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedMemberIds(users.map((u) => u.id));
  };

  const handleClearNonOwners = () => {
    if (currentUser) {
      setSelectedMemberIds([currentUser.id]);
    } else {
      setSelectedMemberIds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    setLoading(true);
    setError(null);
    try {
      let finalMemberIds: string[] | undefined = undefined;
      if (isPrivate) {
        finalMemberIds = [...selectedMemberIds];
        if (currentUser && !finalMemberIds.includes(currentUser.id)) {
          finalMemberIds.push(currentUser.id);
        }
      }

      await onCreate({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim(),
        isPrivate,
        memberIds: finalMemberIds,
      });
      setName('');
      setKey('');
      setDescription('');
      setIsPrivate(false);
      setSelectedMemberIds(currentUser ? [currentUser.id] : []);
      setMemberSearch('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = memberSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.developerRole && u.developerRole.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
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
          <div className="mt-4 p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-sm shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
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
          <div className="p-3.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPrivate ? (
                  <Lock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Globe className="w-4 h-4 text-emerald-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    {isPrivate ? 'Private / Restricted Project' : 'Team-Wide Project'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {isPrivate
                      ? 'Only selected members, workspace admins, and managers have access'
                      : 'All members across the workspace can view and track tasks'}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => handleTogglePrivate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* Member Selection Drawer when Private is Selected */}
            {isPrivate && (
              <div className="pt-3 border-t border-neutral-800/80 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Select Allowed Members ({selectedMemberIds.length})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearNonOwners}
                      className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Filter members..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto divide-y divide-neutral-800/50 border border-neutral-800 rounded-lg bg-neutral-900/60">
                  {filteredUsers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-neutral-500">
                      No members found
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedMemberIds.includes(user.id);
                      const isCreator = Boolean(currentUser && user.id === currentUser.id);
                      const isAdminOrManager = user.role === 'admin' || user.role === 'manager';

                      return (
                        <div
                          key={user.id}
                          onClick={() => toggleMember(user.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 text-xs transition cursor-pointer select-none hover:bg-neutral-800/50 ${
                            isSelected ? 'bg-indigo-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-5 h-5 rounded-full object-cover border border-neutral-700 shrink-0"
                            />
                            <span className="truncate font-medium text-neutral-200 text-xs">
                              {user.name}
                            </span>
                            {isCreator && (
                              <span className="text-[10px] px-1 rounded bg-indigo-500/20 text-indigo-300">
                                Creator
                              </span>
                            )}
                            {isAdminOrManager && !isCreator && (
                              <span className="text-[10px] px-1 rounded bg-neutral-800 text-neutral-400">
                                {user.role}
                              </span>
                            )}
                          </div>

                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isCreator}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded text-indigo-600 bg-neutral-900 border-neutral-700 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                          />
                        </div>
                      );
                    })
                  )}
                </div>

                <p className="text-[11px] text-neutral-500 flex items-center gap-1 pt-1">
                  <Shield className="w-3 h-3 text-indigo-400 shrink-0" />
                  Workspace Admins and Managers always retain access across all projects.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800 shrink-0">
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
