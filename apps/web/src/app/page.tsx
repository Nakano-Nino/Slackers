'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import {
  Channel,
  Message,
  SprintStats,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from '../types';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { KanbanBoard } from '../components/KanbanBoard';
import { SprintProgressBar } from '../components/SprintProgressBar';
import { CreateChannelModal } from '../components/CreateChannelModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { BackendStatus } from '../components/BackendStatus';
import { Database, Server, FileText } from 'lucide-react';

export default function Home() {
  const [activeView, setActiveView] = useState<'chat' | 'kanban'>('chat');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Kanban state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprintStats, setSprintStats] = useState<SprintStats | null>(null);

  // Modals
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load initial data
  const loadInitialData = async () => {
    try {
      const [fetchedChannels, fetchedUsers, fetchedMe, fetchedTasks, fetchedStats] =
        await Promise.all([
          api.getChannels(),
          api.getUsers(),
          api.getCurrentUser(),
          api.getTasks(),
          api.getSprintStats(),
        ]);

      setChannels(fetchedChannels);
      setUsers(fetchedUsers);
      setCurrentUser(fetchedMe);
      setTasks(fetchedTasks);
      setSprintStats(fetchedStats);

      if (fetchedChannels.length > 0 && !fetchedChannels.some((c) => c.id === selectedChannelId)) {
        setSelectedChannelId(fetchedChannels[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial data from backend API:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch messages for active channel
  const loadMessages = useCallback(async (channelId: string) => {
    if (!channelId) return;
    setLoadingMessages(true);
    try {
      const fetchedMessages = await api.getMessages(channelId);
      setMessages(fetchedMessages);
    } catch (err) {
      console.error(`Failed to load messages for channel ${channelId}:`, err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChannelId && activeView === 'chat') {
      loadMessages(selectedChannelId);
    }
  }, [selectedChannelId, activeView, loadMessages]);

  const refreshSprintData = async () => {
    try {
      const [updatedTasks, updatedStats] = await Promise.all([
        api.getTasks(),
        api.getSprintStats(),
      ]);
      setTasks(updatedTasks);
      setSprintStats(updatedStats);
    } catch (err) {
      console.error('Failed to refresh sprint data:', err);
    }
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
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    storyPoints: number;
    tags: string[];
    assigneeId?: string;
  }) => {
    const newTask = await api.createTask(taskData);
    setTasks((prev) => [...prev, newTask]);
    await refreshSprintData();
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.updateTask(taskId, { status: newStatus });
      await refreshSprintData();
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Re-fetch on error
      await refreshSprintData();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.deleteTask(taskId);
      await refreshSprintData();
    } catch (err) {
      console.error('Failed to delete task:', err);
      await refreshSprintData();
    }
  };

  // "Discuss in Chat" functionality
  const handleDiscussInChat = async (task: Task) => {
    // Determine channel to discuss in (#engineering if available, else current channel)
    const targetChannel = channels.find((c) => c.name === 'engineering') || channels[0];
    const channelId = targetChannel ? targetChannel.id : selectedChannelId;

    setSelectedChannelId(channelId);
    setActiveView('chat');

    const discussionMessage = `📋 **Task Discussion**: ${task.title}\n> ${task.description || 'No description provided.'}\n* **Status**: \`${task.status.replace('_', ' ').toUpperCase()}\`\n* **Priority**: \`${task.priority.toUpperCase()}\`\n* **Story Points**: ${task.storyPoints} pts\n* **Assignee**: ${task.assignee?.name || 'Unassigned'}`;

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

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null;

  if (initialLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-neutral-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg text-lg animate-pulse">
            S
          </div>
          <p className="text-sm font-medium text-neutral-400">Loading Slackers Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-neutral-950 font-sans text-neutral-100">
      <Sidebar
        channels={channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
        onOpenCreateChannel={() => setIsChannelModalOpen(true)}
        users={users}
        currentUser={currentUser}
        activeView={activeView}
        onSelectView={setActiveView}
        taskCount={tasks.length}
      />

      {/* Main Workspace Body */}
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
                  Sprint Kanban Board
                </h2>
                <p className="text-xs text-neutral-400">
                  Track sprint velocity, backlog tasks, team assignees, and real-time status transitions.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2 text-[11px] bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-neutral-400">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span>PostgreSQL (Prisma)</span>
                  <span className="text-neutral-600">|</span>
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  <span>MongoDB Logs</span>
                </div>
                <BackendStatus />
              </div>
            </div>

            {/* Sprint Progress Bar */}
            <SprintProgressBar
              stats={sprintStats}
              onOpenCreateTask={() => setIsTaskModalOpen(true)}
            />

            {/* Kanban Board Feed */}
            <KanbanBoard
              tasks={tasks}
              users={users}
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

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreate={handleCreateTask}
        users={users}
      />
    </main>
  );
}
