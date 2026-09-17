'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Shield, Search, AlertCircle } from 'lucide-react';
import { Project, User } from '../types';

interface Props {
  isOpen: boolean;
  project: Project;
  users: User[];
  currentUser: User | null;
  onClose: () => void;
  onUpdateMembers: (projectId: string, memberIds: string[]) => Promise<void>;
}

export function ProjectMembersModal({
  isOpen,
  project,
  users,
  currentUser,
  onClose,
  onUpdateMembers,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && project) {
      const initial = project.memberIds ? [...project.memberIds] : [];
      if (!initial.includes(project.ownerId)) {
        initial.push(project.ownerId);
      }
      setSelectedIds(initial);
      setSearch('');
      setError(null);
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.developerRole && u.developerRole.toLowerCase().includes(q))
    );
  });

  const toggleUser = (userId: string) => {
    if (userId === project.ownerId) {
      // Owner cannot be removed
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const allIds = users.map((u) => u.id);
    setSelectedIds(allIds);
  };

  const handleClearAll = () => {
    // Keep owner
    setSelectedIds([project.ownerId]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Ensure owner is included
      const finalIds = selectedIds.includes(project.ownerId)
        ? selectedIds
        : [...selectedIds, project.ownerId];
      await onUpdateMembers(project.id, finalIds);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update project members');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                Project Member Access
              </h2>
              <p className="text-xs text-neutral-400">
                [{project.key}] {project.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-3 p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300 flex items-start gap-2 shrink-0">
          <Shield className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
          <span>
            Only selected members can view this private project, its Kanban tasks, and bug reports. Workspace Admins and Managers always retain workspace-wide visibility.
          </span>
        </div>

        {/* Search & Bulk Actions */}
        <div className="mt-4 flex items-center justify-between gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] transition"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Member Counter */}
        <div className="mt-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider shrink-0 flex items-center justify-between">
          <span>Members Allowed:</span>
          <span className="text-indigo-400 font-bold">{selectedIds.length} of {users.length}</span>
        </div>

        {/* User Checklist */}
        <div className="mt-2 flex-1 overflow-y-auto divide-y divide-neutral-800/60 border border-neutral-800 rounded-lg bg-neutral-950/60 min-h-[160px]">
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              No matching members found
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedIds.includes(user.id);
              const isOwner = user.id === project.ownerId;
              const isWorkspaceAdminOrManager = user.role === 'admin' || user.role === 'manager';

              return (
                <div
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={`flex items-center justify-between px-3 py-2 text-xs transition cursor-pointer select-none hover:bg-neutral-800/40 ${
                    isSelected ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-neutral-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-neutral-200 truncate">
                          {user.name}
                        </span>
                        {isOwner && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Owner
                          </span>
                        )}
                        {isWorkspaceAdminOrManager && !isOwner && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-400 border border-neutral-700">
                            {user.role}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {user.developerRole || user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isOwner}
                      onChange={() => {}} // Handled by row onClick
                      className="w-4 h-4 rounded text-indigo-600 bg-neutral-900 border-neutral-700 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Member Access'}
          </button>
        </div>
      </div>
    </div>
  );
}
