import { DeveloperRole, UserRole } from '../types';

export interface RoleInfo {
  label: string;
  shortLabel: string;
  class: string;
  category: 'engineering' | 'leadership' | 'system';
}

export const DEVELOPER_ROLES: { id: DeveloperRole; label: string; shortLabel: string; description: string }[] = [
  { id: 'backend_developer', label: 'Backend Developer', shortLabel: 'Backend Dev', description: 'API design, databases, system architecture & server logic' },
  { id: 'frontend_developer', label: 'Frontend Developer', shortLabel: 'Frontend Dev', description: 'UI components, client state, animations & responsive UX' },
  { id: 'qa_engineer', label: 'QA Engineer', shortLabel: 'QA Engineer', description: 'Test automation, bug triaging, regression testing & quality' },
  { id: 'fullstack_developer', label: 'Full Stack Developer', shortLabel: 'Full Stack', description: 'End-to-end full stack development across client & server' },
  { id: 'devops_engineer', label: 'DevOps / Cloud Engineer', shortLabel: 'DevOps', description: 'CI/CD pipelines, Docker, Kubernetes, cloud infrastructure & uptime' },
  { id: 'security_engineer', label: 'Security Engineer', shortLabel: 'Security', description: 'Application security, cryptographic protocols & penetration testing' },
  { id: 'ui_ux_designer', label: 'Product / UI/UX Designer', shortLabel: 'Product Design', description: 'User interfaces, design tokens, mockups & user flows' },
  { id: 'mobile_developer', label: 'Mobile Developer', shortLabel: 'Mobile Dev', description: 'iOS and Android client applications & offline sync' },
  { id: 'data_engineer', label: 'Data / AI Engineer', shortLabel: 'Data / AI', description: 'Data pipelines, embeddings, analytics & machine learning models' },
  { id: 'lead_architect', label: 'Lead Architect', shortLabel: 'Lead Architect', description: 'Core technical leadership, system architecture & tech stack standards' },
  { id: 'engineering_manager', label: 'Engineering Manager', shortLabel: 'Eng Manager', description: 'Sprint planning, project scope, team coordination & delivery' },
];

export const ROLE_BADGES: Record<string, RoleInfo> = {
  // Developer Roles
  backend_developer: {
    label: 'Backend Developer',
    shortLabel: 'Backend Dev',
    class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    category: 'engineering',
  },
  frontend_developer: {
    label: 'Frontend Developer',
    shortLabel: 'Frontend Dev',
    class: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    category: 'engineering',
  },
  qa_engineer: {
    label: 'QA Engineer',
    shortLabel: 'QA',
    class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    category: 'engineering',
  },
  fullstack_developer: {
    label: 'Full Stack Developer',
    shortLabel: 'Full Stack',
    class: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    category: 'engineering',
  },
  devops_engineer: {
    label: 'DevOps Engineer',
    shortLabel: 'DevOps',
    class: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    category: 'engineering',
  },
  security_engineer: {
    label: 'Security Engineer',
    shortLabel: 'Security',
    class: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    category: 'engineering',
  },
  ui_ux_designer: {
    label: 'UI/UX Designer',
    shortLabel: 'Designer',
    class: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30',
    category: 'engineering',
  },
  mobile_developer: {
    label: 'Mobile Developer',
    shortLabel: 'Mobile',
    class: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    category: 'engineering',
  },
  data_engineer: {
    label: 'Data / AI Engineer',
    shortLabel: 'Data/AI',
    class: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
    category: 'engineering',
  },
  lead_architect: {
    label: 'Lead Architect',
    shortLabel: 'Architect',
    class: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    category: 'leadership',
  },
  engineering_manager: {
    label: 'Engineering Manager',
    shortLabel: 'Eng Mgr',
    class: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    category: 'leadership',
  },

  // Base Authority Roles
  admin: {
    label: 'Admin',
    shortLabel: 'Admin',
    class: 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30',
    category: 'system',
  },
  manager: {
    label: 'Manager',
    shortLabel: 'Manager',
    class: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30',
    category: 'system',
  },
  member: {
    label: 'Member',
    shortLabel: 'Member',
    class: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
    category: 'system',
  },
  viewer: {
    label: 'Viewer',
    shortLabel: 'Viewer',
    class: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
    category: 'system',
  },
};

/**
 * Returns detailed badge info for a user based on developerRole or role.
 */
export function getUserRoleBadge(user?: { role?: string; developerRole?: string | null } | null): RoleInfo {
  if (!user) return ROLE_BADGES.member;

  // Prefer specific developer role if present
  if (user.developerRole && ROLE_BADGES[user.developerRole]) {
    return ROLE_BADGES[user.developerRole];
  }

  // Fall back to base role
  if (user.role && ROLE_BADGES[user.role]) {
    return ROLE_BADGES[user.role];
  }

  // Generic fallback
  const fallbackLabel = user.developerRole || user.role || 'Member';
  return {
    label: fallbackLabel.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    shortLabel: fallbackLabel.replace(/_/g, ' '),
    class: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
    category: 'engineering',
  };
}

/**
 * Returns human-readable role title for display in dropdowns or summaries.
 */
export function formatUserRole(user?: { role?: string; developerRole?: string | null } | null): string {
  const badge = getUserRoleBadge(user);
  return badge.label;
}
