'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? 'Switch to Clean Slate Light Theme' : 'Switch to Dark Theme'}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition ${
        isDark
          ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-amber-300 hover:bg-neutral-800'
          : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-indigo-600 hover:bg-slate-200'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-180 duration-200" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {isDark ? 'Light Theme' : 'Dark Theme'}
        </span>
      )}
    </button>
  );
}
