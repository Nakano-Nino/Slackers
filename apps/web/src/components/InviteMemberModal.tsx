'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Link,
  Mail,
  Copy,
  Check,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Clock,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import { Invitation, User, UserRole } from '../types';
import { DEVELOPER_ROLES } from '../lib/roles';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onMemberAdded?: (user: User) => void;
}

export function InviteMemberModal({ isOpen, onClose, currentUser, onMemberAdded }: Props) {
  const [activeTab, setActiveTab] = useState<'direct' | 'invite'>('direct');

  // Direct Add Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('member');
  const [developerRole, setDeveloperRole] = useState('fullstack_developer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state for Direct Add
  const [createdCredentials, setCreatedCredentials] = useState<{
    user: User;
    tempPassword?: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Invite Link State
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [inviteDevRole, setInviteDevRole] = useState('fullstack_developer');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [latestInvite, setLatestInvite] = useState<Invitation | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeInvitations, setActiveInvitations] = useState<Invitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const loadInvitations = async () => {
    if (!canManage) return;
    setLoadingInvites(true);
    try {
      const list = await api.getInvitations();
      setActiveInvitations(list);
    } catch {
      // Ignored if permissions not present
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCreatedCredentials(null);
      setCopiedCredentials(false);
      setLatestInvite(null);
      setCopiedLink(false);
      generateRandomPassword();
      loadInvitations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDirectAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await api.addMember({
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
        role,
        developerRole,
      });

      setCreatedCredentials({
        user: result.user,
        tempPassword: result.tempPassword || password.trim(),
      });

      if (onMemberAdded) {
        onMemberAdded(result.user);
      }

      // Reset fields for next entry
      setName('');
      setEmail('');
      generateRandomPassword();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Slackers Workspace Credentials\nName: ${createdCredentials.user.name}\nEmail: ${createdCredentials.user.email}\nPassword: ${createdCredentials.tempPassword || '(set by user)'}\nURL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2500);
  };

  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true);
    setError(null);
    try {
      const invite = await api.createInvitation({
        role: inviteRole,
        developerRole: inviteDevRole,
        expiresInDays,
      });
      setLatestInvite(invite);
      setActiveInvitations((prev) => [invite, ...prev]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate invitation');
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteUrl = `${origin}/?invite=${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRevokeInvite = async (id: string) => {
    try {
      await api.revokeInvitation(id);
      setActiveInvitations((prev) => prev.filter((i) => i.id !== id));
      if (latestInvite?.id === id) {
        setLatestInvite(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invitation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                Invite Teammates to Slackers
              </h2>
              <p className="text-xs text-neutral-400">
                Onboard new team members or generate shareable workspace invite links.
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

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-neutral-950 rounded-xl mt-4 border border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('direct');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'direct'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member Directly</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('invite');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'invite'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Share Invite Link</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: Direct Add Member */}
        {activeTab === 'direct' && (
          <div className="mt-4 overflow-y-auto flex-1 pr-1 space-y-4">
            {createdCredentials ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <Check className="w-4 h-4" />
                  <span>Teammate Added Successfully!</span>
                </div>
                <p className="text-xs text-neutral-300">
                  <strong className="text-white">{createdCredentials.user.name}</strong> has been added to the workspace as <span className="font-mono text-emerald-300">[{createdCredentials.user.role.toUpperCase()}]</span>.
                </p>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1 font-mono text-xs text-neutral-300 select-all">
                  <div>Email: <span className="text-neutral-100">{createdCredentials.user.email}</span></div>
                  <div>Temporary Password: <span className="text-indigo-400 font-bold">{createdCredentials.tempPassword}</span></div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    {copiedCredentials ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCredentials ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreatedCredentials(null)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition"
                  >
                    Add Another Member
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDirectAdd} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ada Lovelace"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ada@slackers.dev"
                      required
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                      Workspace Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="member">Member (Standard)</option>
                      <option value="manager">Manager (Manage projects & tasks)</option>
                      <option value="admin">Admin (Full workspace control)</option>
                      <option value="viewer">Viewer (Read-only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                      Engineering Role
                    </label>
                    <select
                      value={developerRole}
                      onChange={(e) => setDeveloperRole(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                    >
                      {DEVELOPER_ROLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Temporary Password
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Auto-generate</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-neutral-100 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-neutral-400 hover:text-neutral-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    You will be able to copy these credentials upon creation to share with the teammate.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim() || !email.trim()}
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Adding Teammate...' : 'Add Teammate to Workspace'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: Share Invite Link */}
        {activeTab === 'invite' && (
          <div className="mt-4 overflow-y-auto flex-1 pr-1 space-y-4">
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-3">
              <div className="flex items-center gap-2 text-neutral-200 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Create a Shareable Invitation Link</span>
              </div>
              <p className="text-xs text-neutral-400">
                Anyone with this link can join your workspace. You can set the default role and expiration duration.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Default Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Expires In
                  </label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={1}>24 Hours</option>
                    <option value={7}>7 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateInvite}
                disabled={isGeneratingInvite}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
              >
                {isGeneratingInvite ? 'Generating Link...' : 'Generate New Invite Link'}
              </button>
            </div>

            {/* Latest Generated Link Banner */}
            {latestInvite && (
              <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Invite Link Ready
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Role: <strong className="text-neutral-200 uppercase">{latestInvite.role}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      typeof window !== 'undefined'
                        ? `${window.location.origin}/?invite=${latestInvite.token}`
                        : `/?invite=${latestInvite.token}`
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-200 focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(latestInvite.token)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Active Invitations List */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <span>Active Invitations ({activeInvitations.length})</span>
                {loadingInvites && <span className="text-[10px] text-neutral-500">Refreshing...</span>}
              </div>

              <div className="max-h-40 overflow-y-auto divide-y divide-neutral-800/60 border border-neutral-800 rounded-lg bg-neutral-950/60">
                {activeInvitations.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-500">
                    No active invitation links
                  </div>
                ) : (
                  activeInvitations.map((inv) => {
                    const isExpired = new Date(inv.expiresAt).getTime() < Date.now();
                    return (
                      <div
                        key={inv.id}
                        className="p-2.5 flex items-center justify-between text-xs hover:bg-neutral-900/50 transition gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-indigo-400 truncate font-semibold">
                              {inv.token}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-300 font-mono">
                              {inv.role}
                            </span>
                            {isExpired && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-950/60 text-rose-300 border border-rose-800/60">
                                Expired
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>
                              {isExpired
                                ? `Expired ${new Date(inv.expiresAt).toLocaleDateString()}`
                                : `Expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(inv.token)}
                            title="Copy link"
                            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeInvite(inv.id)}
                            title="Revoke invitation"
                            className="p-1.5 rounded-md hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-3 mt-4 border-t border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
