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
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  getProjects(user?: User): Project[] {
    // If user is admin or manager, they can view all projects including private ones.
    // If member/viewer, only show public projects or projects they own.
    const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

    return this.projects
      .filter((p) => {
        if (!p.isPrivate || isAdminOrManager || p.ownerId === user?.id) {
          return true;
        }
        return false;
      })
      .map((p) => this.enrichProject(p));
  }

  getProjectById(id: string, user?: User): Project | undefined {
    const project = this.projects.find((p) => p.id === id);
    if (!project) return undefined;

    const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
    if (project.isPrivate && !isAdminOrManager && project.ownerId !== user?.id) {
      return undefined;
    }

    return this.enrichProject(project);
  }

  private enrichProject(project: Project): Project {
    const owner = dataStore.getUserById(project.ownerId);
    return {
      ...project,
      ownerName: owner ? owner.name : 'Unknown Owner',
      memberCount: project.isPrivate ? 3 : dataStore.getUsers().length,
    };
  }

  async createProject(
    data: {
      name: string;
      key: string;
      description?: string;
      isPrivate?: boolean;
    },
    creator: User
  ): Promise<Project> {
    const key = data.key.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const existing = this.projects.find((p) => p.key === key);
    if (existing) {
      throw new Error(`Project key "${key}" already exists. Please choose a unique key.`);
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: data.name.trim(),
      key,
      description: data.description || '',
      isPrivate: data.isPrivate || false,
      ownerId: creator.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.projects.push(newProject);

    await mongoLogger.log(
      'PROJECT_CREATED',
      { projectId: newProject.id, name: newProject.name, key: newProject.key, isPrivate: newProject.isPrivate },
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
    this.projects[index] = {
      ...oldProject,
      ...updates,
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
