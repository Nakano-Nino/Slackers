'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Mail, User as UserIcon, Shield, ArrowRight, Eye, EyeOff, CheckCircle2, UserCheck, X } from 'lucide-react';
import { api } from '../lib/api';
import { User, UserRole, Invitation } from '../types';

import { DEVELOPER_ROLES } from '../lib/roles';

interface Props {
  onSuccess: (user: User, password?: string) => void;
  inviteToken?: string | null;
  onClearInviteToken?: () => void;
}

export function AuthModal({ onSuccess, inviteToken, onClearInviteToken }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [developerRole, setDeveloperRole] = useState('backend_developer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<Partial<Invitation> | null>(null);
  const [verifyingInvite, setVerifyingInvite] = useState(false);

  useEffect(() => {
    if (!inviteToken) {
      setInvitationData(null);
      return;
    }

    let isMounted = true;
    setVerifyingInvite(true);
    setError(null);

    api.verifyInvitation(inviteToken)
      .then((res) => {
        if (!isMounted) return;
        if (res.valid && res.invitation) {
          setInvitationData(res.invitation);
          if (res.invitation.email) setEmail(res.invitation.email);
          if (res.invitation.developerRole) setDeveloperRole(res.invitation.developerRole);
        } else {
          setError('This invitation link is invalid or has expired.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to verify invitation link.');
      })
      .finally(() => {
        if (isMounted) setVerifyingInvite(false);
      });

    return () => {
      isMounted = false;
    };
  }, [inviteToken]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (invitationData && !name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (inviteToken && invitationData) {
        const res = await api.acceptInvitation({
          token: inviteToken,
          name: name.trim(),
          email: email.trim(),
          password,
          developerRole,
        });
        onSuccess(res.user, password);
      } else {
        const res = await api.login({
          email: email.trim(),
          password,
        });
        onSuccess(res.user, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 p-4">
      {/* Background glowing gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 right-10 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-7 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-neutral-800">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-md text-xl">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              Welcome to Slackers
            </h1>
            <p className="text-xs text-neutral-400">
              Multi-Project Collaboration with Role-Based Authority & Chat
            </p>
          </div>
        </div>

        {/* Invitation Banner */}
        {invitationData && (
          <div className="mt-5 p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-100">Workspace Invitation</h3>
                  <p className="text-[11px] text-neutral-300">
                    You’ve been invited to join as{' '}
                    <span className="font-semibold text-indigo-300 uppercase">{invitationData.role}</span>
                    {invitationData.developerRole && (
                      <span className="text-neutral-400"> ({invitationData.developerRole.replace('_', ' ')})</span>
                    )}
                  </p>
                </div>
              </div>
              {onClearInviteToken && (
                <button
                  type="button"
                  onClick={onClearInviteToken}
                  className="text-[11px] text-neutral-400 hover:text-neutral-200 underline shrink-0 pt-0.5"
                >
                  Sign in instead
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mt-4 p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleAuthSubmit} className="mt-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">
              {invitationData
                ? 'Create your account to accept the invitation:'
                : 'Sign in with your email & password:'}
            </span>
          </div>

          {invitationData && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-3 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required={!!invitationData}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Developer Role
                </label>
                <select
                  value={developerRole}
                  onChange={(e) => setDeveloperRole(e.target.value)}
                  disabled={!!invitationData?.developerRole}
                  className={`w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none transition ${
                    invitationData?.developerRole
                      ? 'opacity-70 cursor-not-allowed bg-neutral-900/60'
                      : 'focus:border-indigo-500'
                  }`}
                >
                  {DEVELOPER_ROLES.map((r) => (
                    <option key={r.id} value={r.id} className="bg-neutral-900 text-neutral-200">
                      {r.label} — {r.description}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!!invitationData?.email}
                placeholder="you@company.com"
                required
                className={`w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition ${
                  invitationData?.email ? 'opacity-70 cursor-not-allowed bg-neutral-900/60' : ''
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-10 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-neutral-500 hover:text-neutral-300 focus:outline-none transition p-0.5 rounded"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/30 mt-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {invitationData ? 'Accept Invitation & Join' : 'Sign In'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {!invitationData && (
            <p className="text-[11px] text-neutral-500 text-center mt-3">
              Registration is invite-only. Contact your workspace admin for an invitation link.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
