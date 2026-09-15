'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api, authStorage } from '../lib/api';
import {
  Bug,
  BugEnvironment,
  BugSeverity,
  BugStatus,
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
import { BugTracker } from '../components/BugTracker';
import { ProjectProgressBar } from '../components/ProjectProgressBar';
import { CreateChannelModal } from '../components/CreateChannelModal';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { ReportBugModal } from '../components/ReportBugModal';
import { AuthModal } from '../components/AuthModal';
import { BackendStatus } from '../components/BackendStatus';
import { Database, Server } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App navigation & state
  const [activeView, setActiveView] = useState<'chat' | 'kanban' | 'bugs'>('chat');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-core');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Project tasks & stats
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);

  // Bug tracking state
  const [bugs, setBugs] = useState<Bug[]>([]);

  // Modals
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isReportBugModalOpen, setIsReportBugModalOpen] = useState(false);

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

  // Load workspace data when authenticated
  const loadWorkspaceData = useCallback(async () => {
    if (!currentUser) return;

    try {
      const [fetchedProjects, fetchedChannels, fetchedUsers, fetchedBugs] = await Promise.all([
        api.getProjects(),
        api.getChannels(),
        api.getUsers(),
        api.getBugs(),
      ]);

      setProjects(fetchedProjects);
      setChannels(fetchedChannels);
      setUsers(fetchedUsers);
      setBugs(fetchedBugs);

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
      const [fetchedTasks, fetchedStats, fetchedBugs] = await Promise.all([
        api.getTasks({ projectId }),
        api.getProjectStats(projectId),
        api.getBugs({ projectId }),
      ]);
      setTasks(fetchedTasks);
      setProjectStats(fetchedStats);
      setBugs(fetchedBugs);
    } catch (err) {
      console.error(`Failed to load project details for ${projectId}:`, err);
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
    setBugs([]);
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

  // Bug Handlers
  const handleCreateBug = async (bugData: {
    projectId: string;
    title: string;
    description: string;
    severity: BugSeverity;
    environment: BugEnvironment;
    reproductionSteps?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    assignedToId?: string;
  }) => {
    const newBug = await api.createBug(bugData);
    setBugs((prev) => [newBug, ...prev]);
    await refreshCurrentProject();
  };

  const handleUpdateBugStatus = async (bugId: string, newStatus: BugStatus) => {
    setBugs((prev) =>
      prev.map((b) => (b.id === bugId ? { ...b, status: newStatus } : b))
    );

    try {
      await api.updateBug(bugId, { status: newStatus });
    } catch (err) {
      console.error('Failed to update bug status:', err);
      await refreshCurrentProject();
    }
  };

  const handleDeleteBug = async (bugId: string) => {
    setBugs((prev) => prev.filter((b) => b.id !== bugId));
    try {
      await api.deleteBug(bugId);
    } catch (err) {
      console.error('Failed to delete bug:', err);
      await refreshCurrentProject();
    }
  };

  const handleConvertBugToTask = async (bugId: string) => {
    try {
      const result = await api.convertBugToTask(bugId);
      // Update bug state with linked task and in_progress status
      setBugs((prev) =>
        prev.map((b) => (b.id === bugId ? result.bug : b))
      );
      // Add created task into tasks state
      if (result.task.projectId === selectedProjectId) {
        setTasks((prev) => [...prev, result.task]);
      }
      await refreshCurrentProject();
    } catch (err) {
      console.error('Failed to convert bug to task:', err);
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

  const handleDiscussBugInChat = async (bug: Bug) => {
    const targetChannel = channels.find((c) => c.name === 'engineering') || channels[0];
    const channelId = targetChannel ? targetChannel.id : selectedChannelId;

    setSelectedChannelId(channelId);
    setActiveView('chat');

    const bugMessage = `🚨 **Bug Ticket Alert**: [${bug.severity.toUpperCase()} / ${bug.environment.toUpperCase()}] ${bug.title}\n> ${bug.description}\n* **Status**: \`${bug.status.toUpperCase()}\`\n* **Reported By**: ${bug.reportedBy?.name || 'Anonymous'}\n* **Assignee**: ${bug.assignedTo?.name || 'Unassigned'}\n* **Reproduction**: \`${bug.reproductionSteps || 'See defect card'}\``;

    try {
      const newMsg = await api.sendMessage({
        channelId,
        content: bugMessage,
        userId: currentUser?.id,
        bugId: bug.id,
      });
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to send bug discussion to chat:', err);
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

  // Authentication Guard
  if (!currentUser) {
    return <AuthModal onSuccess={(user) => setCurrentUser(user)} />;
  }

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null;
  const criticalBugCount = bugs.filter((b) => b.severity === 'critical' && b.status !== 'closed' && b.status !== 'resolved').length;

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
        bugCount={bugs.length}
        criticalBugCount={criticalBugCount}
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
        ) : activeView === 'kanban' ? (
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

            {/* Project Progress Bar */}
            <ProjectProgressBar
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setSelectedProjectId}
              stats={projectStats}
              currentUserRole={currentUser.role}
              onOpenCreateTask={() => setIsTaskModalOpen(true)}
              onOpenCreateProject={() => setIsProjectModalOpen(true)}
            />

            {/* Kanban Board */}
            <KanbanBoard
              tasks={tasks}
              users={users}
              currentUserRole={currentUser.role}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onDeleteTask={handleDeleteTask}
              onDiscussInChat={handleDiscussInChat}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full p-6 overflow-hidden">
            {/* Bug Tracker View Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
                  Bug & Defect Tracker
                </h2>
                <p className="text-xs text-neutral-400">
                  Log, triage, and resolve software defects with cross-team chat alerts and Kanban conversion.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <BackendStatus />
              </div>
            </div>

            {/* Bug Tracker Component */}
            <BugTracker
              bugs={bugs}
              projects={projects}
              users={users}
              currentUserRole={currentUser.role}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onOpenReportBug={() => setIsReportBugModalOpen(true)}
              onUpdateBugStatus={handleUpdateBugStatus}
              onDeleteBug={handleDeleteBug}
              onConvertToTask={handleConvertBugToTask}
              onDiscussInChat={handleDiscussBugInChat}
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

      <ReportBugModal
        isOpen={isReportBugModalOpen}
        onClose={() => setIsReportBugModalOpen(false)}
        onCreate={handleCreateBug}
        projects={projects}
        defaultProjectId={selectedProjectId}
        users={users}
      />
    </main>
  );
}
