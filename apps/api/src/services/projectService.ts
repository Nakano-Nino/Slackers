import { Project, ProjectStats, Task, User } from '../types/index.js';
import { dataStore } from './dataStore.js';
import { mongoLogger } from './mongoLogger.js';

class ProjectService {
  private projects: Project[] = [
    {
      id: 'proj-core',
      name: 'Slackers Core Platform',
      key: 'CORE',
      description: 'Main collaborative workspace engine with chat, Kanban boards, and real-time synchronization.',
      isPrivate: false,
      ownerId: 'u-1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'proj-mobile',
      name: 'Mobile iOS & Android Client',
      key: 'MOB',
      description: 'Cross-platform mobile client with push notifications, offline cache, and quick channel replies.',
      isPrivate: false,
      ownerId: 'u-2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: 'proj-ai',
      name: 'AI Agent & Bot Automation',
      key: 'AI',
      description: 'Private intelligence service for summarizing channel conversations and generating automated task tickets.',
      isPrivate: true,
      ownerId: 'u-1',
      memberIds: ['u-1', 'u-2'],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'proj-cloud',
      name: 'Cloud Infrastructure & Kubernetes',
      key: 'CLOUD',
      description: 'Multi-region Kubernetes clusters, Terraform infrastructure-as-code, and automated scaling.',
      isPrivate: true,
      ownerId: 'u-8',
      memberIds: ['u-8', 'u-1', 'u-3'],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'proj-sec',
      name: 'Security & Zero-Trust Audit',
      key: 'SEC',
      description: 'Zero-knowledge end-to-end cryptographic vaults, intrusion detection, and automated pen-testing.',
      isPrivate: true,
      ownerId: 'u-5',
      memberIds: ['u-5', 'u-1'],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'proj-ds',
      name: 'Design System & Clean Slate UI',
      key: 'DS',
      description: 'Unified theme tokens, accessible component library, high-contrast light & dark modes.',
      isPrivate: false,
      ownerId: 'u-6',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'proj-api',
      name: 'Developer GraphQL & Webhook Hub',
      key: 'API',
      description: 'Public third-party developer ecosystem, real-time WebSocket subscriptions, and OAuth2 apps.',
      isPrivate: false,
      ownerId: 'u-7',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'proj-data',
      name: 'BigData & Analytics Pipeline',
      key: 'DATA',
      description: 'Real-time telemetry aggregation, user retention metrics, and velocity trend analysis.',
      isPrivate: false,
      ownerId: 'u-2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  hasProjectAccess(project: Project, user?: User): boolean {
    if (!project.isPrivate) return true;
    if (!user) return false;
    const isAdminOrManager = user.role === 'admin' || user.role === 'manager';
    if (isAdminOrManager) return true;
    if (project.ownerId === user.id) return true;
    if (project.memberIds && project.memberIds.includes(user.id)) return true;
    return false;
  }

  getProjects(user?: User): Project[] {
    return this.projects
      .filter((p) => this.hasProjectAccess(p, user))
      .map((p) => this.enrichProject(p));
  }

  getProjectById(id: string, user?: User): Project | undefined {
    const project = this.projects.find((p) => p.id === id);
    if (!project) return undefined;

    if (!this.hasProjectAccess(project, user)) {
      return undefined;
    }

    return this.enrichProject(project);
  }

  getProjectRaw(id: string): Project | undefined {
    return this.projects.find((p) => p.id === id);
  }

  private enrichProject(project: Project): Project {
    const owner = dataStore.getUserById(project.ownerId);
    const memberCount = project.isPrivate
      ? (project.memberIds && project.memberIds.length > 0 ? project.memberIds.length : 1)
      : dataStore.getUsers().length;

    return {
      ...project,
      ownerName: owner ? owner.name : 'Unknown Owner',
      memberCount,
    };
  }

  async createProject(
    data: {
      name: string;
      key: string;
      description?: string;
      isPrivate?: boolean;
      memberIds?: string[];
    },
    creator: User
  ): Promise<Project> {
    const key = data.key.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const existing = this.projects.find((p) => p.key === key);
    if (existing) {
      throw new Error(`Project key "${key}" already exists. Please choose a unique key.`);
    }

    const memberIds = data.memberIds ? [...data.memberIds] : [];
    if (data.isPrivate && !memberIds.includes(creator.id)) {
      memberIds.push(creator.id);
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: data.name.trim(),
      key,
      description: data.description || '',
      isPrivate: data.isPrivate || false,
      ownerId: creator.id,
      memberIds: data.isPrivate ? memberIds : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.projects.push(newProject);

    await mongoLogger.log(
      'PROJECT_CREATED',
      {
        projectId: newProject.id,
        name: newProject.name,
        key: newProject.key,
        isPrivate: newProject.isPrivate,
        memberIds: newProject.memberIds,
      },
      creator
    );

    return this.enrichProject(newProject);
  }

  async updateProject(
    id: string,
    updates: Partial<Project>,
    actor: User
  ): Promise<Project | undefined> {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    const oldProject = this.projects[index];
    let memberIds = updates.memberIds !== undefined ? updates.memberIds : oldProject.memberIds;
    const isPrivate = updates.isPrivate !== undefined ? updates.isPrivate : oldProject.isPrivate;
    if (isPrivate && memberIds && !memberIds.includes(oldProject.ownerId)) {
      memberIds = [...memberIds, oldProject.ownerId];
    }

    this.projects[index] = {
      ...oldProject,
      ...updates,
      isPrivate,
      memberIds,
      updatedAt: new Date().toISOString(),
    };

    const updated = this.projects[index];
    await mongoLogger.log('PROJECT_UPDATED', { projectId: id, changes: updates }, actor);

    return this.enrichProject(updated);
  }

  async deleteProject(id: string, actor: User): Promise<boolean> {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) return false;

    const deleted = this.projects.splice(index, 1)[0];
    await mongoLogger.log('PROJECT_DELETED', { projectId: id, name: deleted.name }, actor);

    return true;
  }
}

export const projectService = new ProjectService();
