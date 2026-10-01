'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Loader2, Hash, Lock } from 'lucide-react';
import { Channel } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  onConfirmDelete: (channelId: string) => Promise<void>;
}

export function DeleteChannelModal({ isOpen, onClose, channel, onConfirmDelete }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !channel) return null;

  const isGeneral = channel.id.toLowerCase() === 'general' || channel.name.toLowerCase() === 'general';

  const handleDelete = async () => {
    if (isGeneral) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirmDelete(channel.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
                Delete Channel
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Permanent channel deletion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div className="my-5 space-y-3">
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-xl border border-slate-200/60 dark:border-neutral-700/60">
            {channel.isPrivate ? (
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Hash className="w-4 h-4 text-slate-400 dark:text-neutral-400 shrink-0" />
            )}
            <span className="font-semibold text-sm text-slate-900 dark:text-neutral-100 truncate">
              {channel.name}
            </span>
            {channel.description && (
              <span className="text-xs text-slate-500 dark:text-neutral-400 truncate ml-auto max-w-[180px]">
                {channel.description}
              </span>
            )}
          </div>

          {isGeneral ? (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              The default <strong>#general</strong> channel is protected and cannot be deleted.
            </p>
          ) : (
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              Are you sure you want to delete this channel? All messages, file attachments, and active discussions will be permanently deleted for all team members. This action <span className="font-semibold text-rose-500">cannot be undone</span>.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          {!isGeneral && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 rounded-xl shadow-sm transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Channel</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
