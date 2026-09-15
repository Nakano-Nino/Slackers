'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api, authStorage } from '../lib/api';
import {
  Channel,
  Message,
  Project,
  ProjectStats,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from '../types';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { KanbanBoard } from '../components/KanbanBoard';
import { ProjectProgressBar } from '../components/ProjectProgressBar';
import { CreateChannelModal } from '../components/CreateChannelModal';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { AuthModal } from '../components/AuthModal';
import { BackendStatus } from '../components/BackendStatus';
import { Database, Server } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App navigation & state
  const [activeView, setActiveView] = useState<'chat' | 'kanban'>('chat');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-core');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Project tasks & stats
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);

  // Modals
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [loadingMessages, setLoadingMessages] = useState(false);

  // Check existing session
  useEffect(() => {
    const checkSession = async () => {
      const token = authStorage.getToken();
      if (!token) {
        setIsAuthChecking(false);
        return;
      }

      try {
        const user = await api.getMe();
        setCurrentUser(user);
      } catch (err) {
        console.warn('Session expired or invalid, please log in:', err);
        authStorage.clearToken();
        setCurrentUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkSession();
  }, []);

  // Load app data when user is authenticated
  const loadWorkspaceData = useCallback(async () => {
    if (!currentUser) return;

    try {
      const [fetchedProjects, fetchedChannels, fetchedUsers] = await Promise.all([
        api.getProjects(),
        api.getChannels(),
        api.getUsers(),
      ]);

      setProjects(fetchedProjects);
      setChannels(fetchedChannels);
      setUsers(fetchedUsers);

      const initialProjectId = fetchedProjects.length > 0 ? fetchedProjects[0].id : 'proj-core';
      setSelectedProjectId(initialProjectId);

      if (fetchedChannels.length > 0 && !fetchedChannels.some((c) => c.id === selectedChannelId)) {
        setSelectedChannelId(fetchedChannels[0].id);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadWorkspaceData();
    }
  }, [currentUser, loadWorkspaceData]);

  // Load tasks & stats whenever selected project changes
  const loadProjectTasksAndStats = useCallback(async (projectId: string) => {
    if (!projectId || !currentUser) return;
    try {
      const [fetchedTasks, fetchedStats] = await Promise.all([
        api.getTasks({ projectId }),
        api.getProjectStats(projectId),
      ]);
      setTasks(fetchedTasks);
      setProjectStats(fetchedStats);
    } catch (err) {
      console.error(`Failed to load tasks for project ${projectId}:`, err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedProjectId && currentUser) {
      loadProjectTasksAndStats(selectedProjectId);
    }
  }, [selectedProjectId, currentUser, loadProjectTasksAndStats]);

  // Load messages whenever selected channel changes
  const loadMessages = useCallback(async (channelId: string) => {
    if (!channelId || !currentUser) return;
    setLoadingMessages(true);
    try {
      const fetchedMessages = await api.getMessages(channelId);
      setMessages(fetchedMessages);
    } catch (err) {
      console.error(`Failed to load messages for channel ${channelId}:`, err);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedChannelId && activeView === 'chat' && currentUser) {
      loadMessages(selectedChannelId);
    }
  }, [selectedChannelId, activeView, currentUser, loadMessages]);

  const refreshCurrentProject = async () => {
    if (selectedProjectId) {
      await loadProjectTasksAndStats(selectedProjectId);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setProjects([]);
    setTasks([]);
    setMessages([]);
  };

  const handleCreateChannel = async (channelData: {
    name: string;
    description: string;
    isPrivate: boolean;
  }) => {
    const newChannel = await api.createChannel(channelData);
    setChannels((prev) => [...prev, newChannel]);
    setSelectedChannelId(newChannel.id);
  };

  const handleCreateProject = async (projectData: {
    name: string;
    key: string;
    description: string;
    isPrivate: boolean;
  }) => {
    const newProject = await api.createProject(projectData);
    setProjects((prev) => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedChannelId) return;
    const newMessage = await api.sendMessage({
      channelId: selectedChannelId,
      content,
      userId: currentUser?.id,
    });
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleCreateTask = async (taskData: {
    projectId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    storyPoints: number;
    tags: string[];
    assigneeId?: string;
  }) => {
    const newTask = await api.createTask(taskData);
    if (newTask.projectId === selectedProjectId) {
      setTasks((prev) => [...prev, newTask]);
    }
    await refreshCurrentProject();
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.updateTask(taskId, { status: newStatus });
      await refreshCurrentProject();
    } catch (err) {
      console.error('Failed to update task status:', err);
      await refreshCurrentProject();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.deleteTask(taskId);
      await refreshCurrentProject();
    } catch (err) {
      console.error('Failed to delete task:', err);
      await refreshCurrentProject();
    }
  };

  const handleDiscussInChat = async (task: Task) => {
    const targetChannel = channels.find((c) => c.name === 'engineering') || channels[0];
    const channelId = targetChannel ? targetChannel.id : selectedChannelId;

    setSelectedChannelId(channelId);
    setActiveView('chat');

    const discussionMessage = `📋 **Task Discussion**: [${task.projectName || 'Project'}] ${task.title}\n> ${task.description || 'No description provided.'}\n* **Status**: \`${task.status.replace('_', ' ').toUpperCase()}\`\n* **Priority**: \`${task.priority.toUpperCase()}\`\n* **Story Points**: ${task.storyPoints} pts\n* **Assignee**: ${task.assignee?.name || 'Unassigned'}`;

    try {
      const newMsg = await api.sendMessage({
        channelId,
        content: discussionMessage,
        userId: currentUser?.id,
        taskId: task.id,
      });
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to send task discussion to chat:', err);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-neutral-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg text-lg animate-pulse">
            S
          </div>
          <p className="text-sm font-medium text-neutral-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, enforce authentication!
  if (!currentUser) {
    return <AuthModal onSuccess={(user) => setCurrentUser(user)} />;
  }

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null;

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-neutral-950 font-sans text-neutral-100">
      <Sidebar
        channels={channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
        onOpenCreateChannel={() => setIsChannelModalOpen(true)}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        users={users}
        currentUser={currentUser}
        activeView={activeView}
        onSelectView={setActiveView}
        taskCount={tasks.length}
        onLogout={handleLogout}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-neutral-900">
        {activeView === 'chat' ? (
          <ChatArea
            channel={selectedChannel}
            messages={messages}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
            loadingMessages={loadingMessages}
          />
        ) : (
          <div className="flex-1 flex flex-col h-full p-6 overflow-hidden">
            {/* Header with Title & Backend Status */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
                  Project Kanban Board
                </h2>
                <p className="text-xs text-neutral-400">
                  Manage deliverables, assignees, priorities, and workflow progress across projects.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2 text-[11px] bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-neutral-400">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span>PostgreSQL (Prisma)</span>
                  <span className="text-neutral-600">|</span>
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  <span>MongoDB Audit</span>
                </div>
                <BackendStatus />
              </div>
            </div>

            {/* Project Progress Bar with Multi-Project Switcher */}
            <ProjectProgressBar
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setSelectedProjectId}
              stats={projectStats}
              currentUserRole={currentUser.role}
              onOpenCreateTask={() => setIsTaskModalOpen(true)}
              onOpenCreateProject={() => setIsProjectModalOpen(true)}
            />

            {/* Project-Scoped Kanban Board */}
            <KanbanBoard
              tasks={tasks}
              users={users}
              currentUserRole={currentUser.role}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onDeleteTask={handleDeleteTask}
              onDiscussInChat={handleDiscussInChat}
            />
          </div>
        )}
      </div>

      <CreateChannelModal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        onCreate={handleCreateChannel}
      />

      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreate={handleCreateTask}
        projects={projects}
        defaultProjectId={selectedProjectId}
        users={users}
      />
    </main>
  );
}
