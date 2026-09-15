'use client';

import React, { useState } from 'react';
import {
  Bug,
  BugSeverity,
  BugStatus,
  Project,
  User as UserType,
  UserRole,
} from '../types';
import {
  AlertOctagon,
  AlertTriangle,
  Bug as BugIcon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Filter,
  Flame,
  Layers,
  MessageSquareShare,
  Plus,
  Search,
  Sparkles,
  Trash2,
  CheckSquare,
  ExternalLink,
} from 'lucide-react';

interface Props {
  bugs: Bug[];
  projects: Project[];
  users: UserType[];
  currentUserRole?: UserRole;
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onOpenReportBug: () => void;
  onUpdateBugStatus: (bugId: string, newStatus: BugStatus) => Promise<void>;
  onDeleteBug: (bugId: string) => Promise<void>;
  onConvertToTask: (bugId: string) => Promise<void>;
  onDiscussInChat: (bug: Bug) => void;
}

const SEVERITY_INFO: Record<BugSeverity, { label: string; badge: string; icon: any }> = {
  critical: { label: 'Critical', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: Flame },
  major: { label: 'Major', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: AlertTriangle },
  minor: { label: 'Minor', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertOctagon },
  cosmetic: { label: 'Cosmetic', badge: 'bg-sky-500/20 text-sky-400 border-sky-500/30', icon: Sparkles },
};

const STATUS_BADGES: Record<BugStatus, { label: string; badge: string }> = {
  open: { label: 'Open', badge: 'bg-rose-950/60 text-rose-300 border-rose-800' },
  triaged: { label: 'Triaged', badge: 'bg-purple-950/60 text-purple-300 border-purple-800' },
  in_progress: { label: 'In Progress', badge: 'bg-amber-950/60 text-amber-300 border-amber-800' },
  resolved: { label: 'Resolved', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' },
  closed: { label: 'Closed', badge: 'bg-neutral-800 text-neutral-400 border-neutral-700' },
};

export function BugTracker({
  bugs,
  projects,
  users,
  currentUserRole,
  selectedProjectId,
  onSelectProject,
  onOpenReportBug,
  onUpdateBugStatus,
  onDeleteBug,
  onConvertToTask,
  onDiscussInChat,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedBugId, setExpandedBugId] = useState<string | null>(null);

  const canManageBugs = currentUserRole === 'admin' || currentUserRole === 'manager';

  const filteredBugs = bugs.filter((b) => {
    if (
      searchQuery &&
      !b.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !b.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (severityFilter !== 'all' && b.severity !== severityFilter) {
      return false;
    }
    if (statusFilter !== 'all' && b.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Calculate Bug Metrics
  const totalBugs = bugs.length;
  const criticalCount = bugs.filter((b) => b.severity === 'critical' && b.status !== 'closed').length;
  const openCount = bugs.filter((b) => b.status === 'open' || b.status === 'triaged').length;
  const resolvedCount = bugs.filter((b) => b.status === 'resolved' || b.status === 'closed').length;
  const resolutionRate = totalBugs > 0 ? Math.round((resolvedCount / totalBugs) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 shrink-0">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
            Total Issues
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-neutral-100">{totalBugs}</span>
            <BugIcon className="w-5 h-5 text-neutral-600" />
          </div>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-amber-500 font-semibold block mb-1">
            Open & Triaged
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400">{openCount}</span>
            <AlertTriangle className="w-5 h-5 text-amber-500/50" />
          </div>
        </div>

        <div className={`border rounded-xl p-3.5 shadow-sm ${
          criticalCount > 0
            ? 'bg-rose-950/20 border-rose-500/30'
            : 'bg-neutral-900/90 border-neutral-800'
        }`}>
          <span className="text-[11px] uppercase tracking-wider text-rose-400 font-semibold block mb-1 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            Critical Blockers
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-400">{criticalCount}</span>
            <span className="text-[10px] text-neutral-500">Unresolved</span>
          </div>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold block mb-1">
            Resolution Rate
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">{resolutionRate}%</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
          </div>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bug tickets, steps, or details..."
            className="w-full bg-transparent text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project selector */}
          <select
            value={selectedProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-300 focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.key}] {p.name}
              </option>
            ))}
          </select>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">🔴 Critical</option>
            <option value="major">🟠 Major</option>
            <option value="minor">🟡 Minor</option>
            <option value="cosmetic">🔵 Cosmetic</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="triaged">Triaged</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <button
            onClick={onOpenReportBug}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Bug</span>
          </button>
        </div>
      </div>

      {/* Bug Table / Feed */}
      <div className="flex-1 overflow-y-auto bg-neutral-950/70 border border-neutral-800 rounded-xl shadow-sm">
        {filteredBugs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mb-2" />
            <p className="text-sm font-medium text-neutral-300">No bugs found</p>
            <p className="text-xs text-neutral-500 mt-1">All clear or adjust filter parameters</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {filteredBugs.map((bug) => {
              const sev = SEVERITY_INFO[bug.severity] || SEVERITY_INFO.major;
              const stat = STATUS_BADGES[bug.status] || STATUS_BADGES.open;
              const isExpanded = expandedBugId === bug.id;
              const SevIcon = sev.icon;

              return (
                <div
                  key={bug.id}
                  className="p-4 hover:bg-neutral-900/50 transition group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Bug Title & Badges */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${sev.badge}`}>
                        <SevIcon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${sev.badge}`}>
                            {sev.label}
                          </span>
                          <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded uppercase">
                            {bug.environment}
                          </span>
                          {bug.taskId && (
                            <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1">
                              <CheckSquare className="w-3 h-3" />
                              Linked Task
                            </span>
                          )}
                        </div>

                        <h4 className="font-semibold text-sm text-neutral-100 leading-snug break-words">
                          {bug.title}
                        </h4>
                        <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                          {bug.description}
                        </p>
                      </div>
                    </div>

                    {/* Meta: Reporter, Assignee & Actions */}
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      {/* Assignee pill */}
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                        {bug.assignedTo ? (
                          <>
                            <img
                              src={bug.assignedTo.avatar}
                              alt={bug.assignedTo.name}
                              className="w-5 h-5 rounded-full object-cover ring-1 ring-neutral-700"
                            />
                            <span className="text-[11px] truncate max-w-[80px]">
                              {bug.assignedTo.name.split(' ')[0]}
                            </span>
                          </>
                        ) : (
                          <span className="text-[11px] text-neutral-600 italic">Unassigned</span>
                        )}
                      </div>

                      {/* Status Selector */}
                      <select
                        value={bug.status}
                        onChange={(e) => onUpdateBugStatus(bug.id, e.target.value as BugStatus)}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${stat.badge}`}
                      >
                        <option value="open">Open</option>
                        <option value="triaged">Triaged</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        {/* Convert to Task (if not converted yet) */}
                        {!bug.taskId && (
                          <button
                            onClick={() => onConvertToTask(bug.id)}
                            title="Convert Bug to Kanban Task"
                            className="p-1.5 text-neutral-400 hover:text-indigo-400 hover:bg-neutral-800 rounded-lg transition"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        )}

                        {/* Discuss in Chat */}
                        <button
                          onClick={() => onDiscussInChat(bug)}
                          title="Discuss Bug in Channel"
                          className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition"
                        >
                          <MessageSquareShare className="w-4 h-4" />
                        </button>

                        {/* Delete Bug (Admins/Managers) */}
                        {canManageBugs && (
                          <button
                            onClick={() => onDeleteBug(bug.id)}
                            title="Delete Bug"
                            className="p-1.5 text-neutral-600 hover:text-rose-500 hover:bg-neutral-800 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Expand/Collapse Details */}
                        <button
                          onClick={() => setExpandedBugId(isExpanded ? null : bug.id)}
                          className="p-1 text-neutral-500 hover:text-neutral-300"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Reproduction Steps & Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-neutral-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-neutral-950/60 p-3 rounded-lg animate-in fade-in duration-150">
                      {bug.reproductionSteps && (
                        <div>
                          <span className="font-semibold text-neutral-400 block mb-1">
                            Reproduction Steps:
                          </span>
                          <p className="text-neutral-300 whitespace-pre-line bg-neutral-900/70 p-2 rounded border border-neutral-800/80 font-mono text-[11px]">
                            {bug.reproductionSteps}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {bug.expectedBehavior && (
                          <div>
                            <span className="font-semibold text-emerald-400 block mb-0.5">
                              Expected:
                            </span>
                            <p className="text-neutral-300">{bug.expectedBehavior}</p>
                          </div>
                        )}
                        {bug.actualBehavior && (
                          <div>
                            <span className="font-semibold text-rose-400 block mb-0.5">
                              Actual:
                            </span>
                            <p className="text-neutral-300">{bug.actualBehavior}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
