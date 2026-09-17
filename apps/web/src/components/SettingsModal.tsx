'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Camera,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Save,
  KeyRound,
  Briefcase,
  ExternalLink,
  Bell,
  BellOff,
  Clock,
  Hash,
  Laptop,
  Smartphone,
  Trash2,
  Globe,
} from 'lucide-react';
import { MuteTarget, User, UserSession } from '../types';
import { api } from '../lib/api';
import { DEVELOPER_ROLES, getUserRoleBadge } from '../lib/roles';
import { E2EEService } from '../lib/e2ee';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onProfileUpdated: (updatedUser: User) => void;
  mutedTargets?: MuteTarget[];
  onUnmuteTarget?: (targetType: 'channel' | 'dm', targetId: string) => Promise<void>;
}

const AVATAR_PRESETS = [
  { id: '1', label: 'Architect', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80' },
  { id: '2', label: 'Manager', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80' },
  { id: '3', label: 'Backend', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=250&auto=format&fit=crop&q=80' },
  { id: '4', label: 'Security', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80' },
  { id: '5', label: 'Frontend', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80' },
  { id: '6', label: 'DevOps', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80' },
  { id: '7', label: 'Designer', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&auto=format&fit=crop&q=80' },
  { id: '8', label: 'QA Tester', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80' },
  { id: '9', label: 'Auditor', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80' },
  { id: '10', label: 'Full Stack', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80' },
  { id: '11', label: 'Mobile', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=250&auto=format&fit=crop&q=80' },
  { id: '12', label: 'Data/AI', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80' },
];

type SettingsTab = 'profile' | 'avatar' | 'security' | 'sessions' | 'notifications';

export function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  mutedTargets = [],
  onUnmuteTarget,
}: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [developerRole, setDeveloperRole] = useState('');
  const [avatar, setAvatar] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Multi-device sessions
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setDeveloperRole(currentUser.developerRole || 'backend_developer');
      setAvatar(currentUser.avatar || '');
      setCustomAvatarUrl('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMessage(null);
    }
  }, [currentUser, isOpen]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (err) {
      console.warn('Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions' && isOpen) {
      fetchSessions();
    }
  }, [activeTab, isOpen]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await api.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSuccessMessage('Device session revoked successfully');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setLoadingSessions(true);
    try {
      const count = await api.revokeOtherSessions();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setSuccessMessage(`Revoked ${count} other active session(s)`);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke other sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  if (!isOpen || !currentUser) return null;

  const activeMutes = mutedTargets.filter(
    (m) => m.mutedUntil === null || new Date(m.mutedUntil).getTime() > Date.now()
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    if (!email.trim()) {
      setError('Email cannot be empty');
      return;
    }

    // Password validation if attempting to change password
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        setError('Please enter your current password to set a new password');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation do not match');
        return;
      }
    }

    setLoading(true);

    try {
      const canChangeDeveloperRole = currentUser.role === 'admin' || currentUser.role === 'manager';

      const payload: {
        name: string;
        email: string;
        avatar: string;
        developerRole?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {
        name: name.trim(),
        email: email.trim(),
        avatar: avatar.trim(),
      };

      if (canChangeDeveloperRole) {
        payload.developerRole = developerRole.trim();
      }

      if (newPassword && currentPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await api.updateProfile(payload);

      // If password changed, re-encrypt the local E2EE private key with the new password
      if (newPassword) {
        try {
          const userKeyPair = await E2EEService.getOrCreateUserKeyPair(currentUser.id, currentPassword);
          const pubJwk = await window.crypto.subtle.exportKey('jwk', userKeyPair.publicKey);
          const vault = await E2EEService.encryptPrivateKeyWithPassword(
            userKeyPair.privateKey,
            JSON.stringify(pubJwk),
            newPassword
          );
          await api.saveKeyVault(vault);
        } catch (e2eeErr) {
          console.warn('E2EE key vault update notice:', e2eeErr);
        }
      }

      onProfileUpdated(res.user);
      setSuccessMessage('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCustomAvatar = () => {
    if (customAvatarUrl.trim()) {
      setAvatar(customAvatarUrl.trim());
      setSuccessMessage('Custom avatar preview updated');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const currentRoleBadge = getUserRoleBadge({ role: currentUser.role, developerRole });
  const canChangeDeveloperRole = currentUser.role === 'admin' || currentUser.role === 'manager';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-100/70 dark:bg-neutral-900/80">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={avatar || currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/50 shadow-sm"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                Account & Profile Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Manage your credentials, engineering title, and avatar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-neutral-800 px-6 bg-slate-50 dark:bg-neutral-950/50 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Profile Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('avatar')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'avatar'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Profile Picture
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            Password & Security
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'sessions'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Devices & Sessions</span>
            {sessions.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
                {sessions.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <BellOff className="w-4 h-4" />
            <span>Muted Alerts</span>
            {activeMutes.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                {activeMutes.length}
              </span>
            )}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveProfile} className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Notifications */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                  Display Name
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-3 w-4 h-4 text-slate-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                    className="w-full bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-slate-400 dark:text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@slackers.dev"
                    required
                    className="w-full bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-500 mt-1">
                  Used for sign-in and encrypted Direct Message identification.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <span>Engineering Role / Specialization</span>
                    {!canChangeDeveloperRole && (
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </label>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${currentRoleBadge.class}`}>
                    {currentRoleBadge.label}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Briefcase className="absolute left-3 w-4 h-4 text-slate-400 dark:text-neutral-500" />
                  <select
                    value={developerRole}
                    onChange={(e) => setDeveloperRole(e.target.value)}
                    disabled={!canChangeDeveloperRole}
                    className={`w-full bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-neutral-100 focus:outline-none transition ${
                      canChangeDeveloperRole
                        ? 'focus:border-indigo-500 cursor-pointer'
                        : 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-neutral-900 select-none'
                    }`}
                  >
                    {DEVELOPER_ROLES.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-neutral-100">
                        {r.label} — {r.description}
                      </option>
                    ))}
                  </select>
                </div>
                {!canChangeDeveloperRole && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>Assigned by Workspace Admin or Manager. Normal members cannot modify their engineering role.</span>
                  </p>
                )}
              </div>

              {/* System Authorization Role Banner */}
              <div className="p-3 bg-slate-100 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
                      System Permission Authority
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                      {currentUser.role === 'admin'
                        ? 'Administrator (Full project, channel & task authority)'
                        : currentUser.role === 'manager'
                        ? 'Engineering Manager (Task scope & board assignment authority)'
                        : currentUser.role === 'viewer'
                        ? 'Viewer (Read-only access)'
                        : 'Team Member (E2EE Chat, Tasks, Bugs & Comments)'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {currentUser.role}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Profile Picture (Avatar) */}
          {activeTab === 'avatar' && (
            <div className="space-y-5">
              {/* Current Preview Card */}
              <div className="p-4 bg-slate-100 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800/80 rounded-xl flex items-center gap-4">
                <img
                  src={avatar || currentUser.avatar}
                  alt="Avatar Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                    Live Avatar Preview
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Choose from developer presets below or specify your own custom image URL.
                  </p>
                </div>
              </div>

              {/* Presets Grid */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Curated Developer Avatar Presets
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = avatar === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatar(preset.url)}
                        className={`group relative flex flex-col items-center p-2 rounded-xl border transition ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 shadow-md shadow-indigo-500/10'
                            : 'bg-white dark:bg-neutral-900/60 border-slate-200 dark:border-neutral-800 hover:border-indigo-400'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-11 h-11 rounded-full object-cover"
                          />
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow">
                              <CheckCircle2 className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-slate-600 dark:text-neutral-400 mt-1.5 truncate max-w-full">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL Input */}
              <div className="pt-2 border-t border-slate-200 dark:border-neutral-800">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                  Or Use Custom Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomAvatar}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 text-xs font-semibold rounded-lg transition"
                  >
                    Apply URL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Password & Security */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
                <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <span className="font-semibold">Zero-Knowledge E2EE Key Vault Protection:</span>{' '}
                  Changing your password will automatically re-encrypt your private key vault using PBKDF2 (100,000 rounds) so your encrypted chat history remains accessible across all your devices.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-slate-400 dark:text-neutral-500" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-slate-400 dark:text-neutral-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-slate-400 dark:text-neutral-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Muted Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                    Muted Notifications
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Channels and direct messages you have turned off notifications for
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                  {activeMutes.length} Muted
                </span>
              </div>

              {activeMutes.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-neutral-800 rounded-xl">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 dark:text-neutral-500">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-neutral-300">
                    No muted notifications
                  </p>
                  <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1 max-w-sm mx-auto">
                    You will receive all messages and channel notifications normally. You can mute any channel or direct message from the conversation header.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {activeMutes.map((mute) => (
                    <div
                      key={mute.id}
                      className="p-3 bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                          {mute.targetType === 'channel' ? (
                            <Hash className="w-4 h-4" />
                          ) : (
                            <UserIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-neutral-100 truncate">
                            {mute.targetName || mute.targetId}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400 dark:text-neutral-500 shrink-0" />
                            <span>
                              {mute.mutedUntil
                                ? `Muted until ${new Date(mute.mutedUntil).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })} at ${new Date(mute.mutedUntil).toLocaleTimeString(undefined, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}`
                                : 'Muted indefinitely (Forever)'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (onUnmuteTarget) {
                            await onUnmuteTarget(mute.targetType, mute.targetId);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/30 transition shrink-0"
                      >
                        Unmute
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Devices & Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-indigo-500" />
                    <span>Logged-In Devices & Active Sessions</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    View all browsers and devices currently authenticated to your account.
                  </p>
                </div>
                {sessions.filter((s) => !s.isCurrent).length > 0 && (
                  <button
                    type="button"
                    onClick={handleRevokeOtherSessions}
                    disabled={loadingSessions}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition"
                  >
                    Revoke Other Sessions
                  </button>
                )}
              </div>

              {loadingSessions ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 dark:text-neutral-400">
                  <Laptop className="w-8 h-8 text-slate-400 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-sm">No active sessions detected.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map((sess) => {
                    const isMobile =
                      sess.deviceName.toLowerCase().includes('iphone') ||
                      sess.deviceName.toLowerCase().includes('android') ||
                      sess.deviceName.toLowerCase().includes('mobile');
                    return (
                      <div
                        key={sess.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                          sess.isCurrent
                            ? 'bg-emerald-500/5 border-emerald-500/30 shadow-sm'
                            : 'bg-white dark:bg-neutral-900/60 border-slate-200 dark:border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              sess.isCurrent
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                            }`}
                          >
                            {isMobile ? (
                              <Smartphone className="w-4 h-4" />
                            ) : (
                              <Laptop className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-neutral-100 truncate">
                                {sess.deviceName}
                              </p>
                              {sess.isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  This Device
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <Globe className="w-3 h-3 text-slate-400" />
                                {sess.ipAddress}
                              </span>
                              <span>•</span>
                              <span>
                                {sess.isCurrent
                                  ? 'Active now'
                                  : `Last active ${new Date(sess.lastActiveAt).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}`}
                              </span>
                            </p>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(sess.id)}
                            disabled={revokingSessionId === sess.id}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/30 transition shrink-0 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            {revokingSessionId === sess.id ? 'Revoking...' : 'Revoke'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 transition"
            >
              Cancel
            </button>

            {activeTab !== 'notifications' && activeTab !== 'sessions' ? (
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-indigo-600/20"
              >
                <Save className="w-3.5 h-3.5" />
                {loading ? 'Saving Changes...' : 'Save Settings'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-indigo-600/20"
              >
                Done
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
