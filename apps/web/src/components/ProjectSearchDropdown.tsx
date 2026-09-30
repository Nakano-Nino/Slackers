'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, FolderKanban, Lock, Check, ChevronDown, X } from 'lucide-react';
import { Project } from '../types';

interface ProjectSearchDropdownProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProjectSearchDropdown({
  projects,
  selectedProjectId,
  onSelectProject,
  size = 'md',
  className = '',
}: ProjectSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < filteredProjects.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredProjects.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProjects[highlightedIndex]) {
        onSelectProject(filteredProjects[highlightedIndex].id);
        setIsOpen(false);
      }
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2.5 bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700/80 hover:border-indigo-500/80 dark:hover:border-indigo-500/80 rounded-xl transition-all shadow-xs cursor-pointer select-none text-left ${
          size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
        } ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500/80' : ''}`}
        title="Switch active project (click to search)"
      >
        <div className="flex items-center gap-2 min-w-0">
          <FolderKanban className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-indigo-500 shrink-0`} />
          {activeProject ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-300/80 dark:border-neutral-700 shrink-0">
                {activeProject.key}
              </span>
              <span className="font-semibold text-slate-900 dark:text-neutral-100 truncate">
                {activeProject.name}
              </span>
              {activeProject.isPrivate && (
                <Lock className="w-3 h-3 text-amber-500 shrink-0 ml-0.5" />
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-neutral-500 font-medium">Select Project...</span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-500' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Input Box */}
          <div className="p-2.5 border-b border-slate-100 dark:border-neutral-800/80 bg-slate-50/70 dark:bg-neutral-950/50">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 absolute left-2.5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Search by name, key, or topic..."
                className="w-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/80 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-slate-400 dark:text-neutral-500">
              <span>{filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found</span>
              <span>Use ↑↓ keys to navigate</span>
            </div>
          </div>

          {/* Project List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
            {filteredProjects.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-neutral-400">
                <FolderKanban className="w-6 h-6 mx-auto mb-1.5 text-slate-300 dark:text-neutral-600" />
                <p className="font-medium">No projects match &quot;{searchQuery}&quot;</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-1.5 text-xs text-indigo-500 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredProjects.map((project, index) => {
                const isSelected = project.id === selectedProjectId;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      onSelectProject(project.id);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-900 dark:text-indigo-200 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100 dark:bg-neutral-800/80 text-slate-900 dark:text-neutral-100'
                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                          isSelected
                            ? 'bg-indigo-200 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-500/40'
                            : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700'
                        }`}
                      >
                        {project.key}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs truncate">{project.name}</p>
                          {project.isPrivate && (
                            <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" title="Private project" />
                          )}
                        </div>
                        {project.description && (
                          <p className="text-[10px] text-slate-400 dark:text-neutral-500 truncate max-w-[200px]">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
