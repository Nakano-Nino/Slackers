'use client';

import React, { useState } from 'react';
import { Lock, Mail, User as UserIcon, Shield, Sparkles, ArrowRight, Eye, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { User, UserRole } from '../types';

interface Props {
  onSuccess: (user: User) => void;
}

const DEMO_USERS: { name: string; email: string; role: UserRole; badge: string; desc: string }[] = [
  {
    name: 'Sarah Connor',
    email: 'sarah@slackers.dev',
    role: 'admin',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    desc: 'Admin: Full access to create/delete projects, manage tasks & assignees',
  },
  {
    name: 'Alex Rivera',
    email: 'alex@slackers.dev',
    role: 'manager',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    desc: 'Manager: Manage tasks, change assignees, adjust project scope',
  },
  {
    name: 'Jordan Lee',
    email: 'jordan@slackers.dev',
    role: 'member',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    desc: 'Member: Update task status, create tasks, chat & collaborate',
  },
  {
    name: 'Taylor Guest',
    email: 'guest@slackers.dev',
    role: 'viewer',
    badge: 'bg-neutral-800 text-neutral-400 border-neutral-700',
    desc: 'Viewer: Read-only access to channels and boards',
  },
];

export function AuthModal({ onSuccess }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isRegister && !name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.register({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        onSuccess(res.user);
      } else {
        const res = await api.login({
          email: email.trim(),
          password,
        });
        onSuccess(res.user);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({
        email: demoEmail,
        password: 'password123',
      });
      onSuccess(res.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
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

        {/* 1-Click Quick Demo Switcher */}
        <div className="mt-5 p-3.5 bg-neutral-950/80 border border-neutral-800/90 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Quick Demo Accounts (1-Click Login)
            </span>
            <span className="text-[10px] text-neutral-500">pass: password123</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_USERS.map((user) => (
              <button
                key={user.email}
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin(user.email)}
                className="flex flex-col items-start p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800/70 hover:border-indigo-500/50 transition text-left group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-xs text-neutral-200 group-hover:text-indigo-300">
                    {user.name}
                  </span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${user.badge}`}>
                    {user.role}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 truncate w-full mt-0.5">
                  {user.email}
                </span>
              </button>
            ))}
          </div>
        </div>

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
              Or sign in with email & password:
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
            >
              {isRegister ? 'Already have an account? Sign In' : 'Create new account'}
            </button>
          </div>

          {isRegister && (
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
                  required={isRegister}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
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
                placeholder="you@company.com"
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
              />
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
                <span>{isRegister ? 'Register & Join' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
