'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { Channel, Message, User } from '../types';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { CreateChannelModal } from '../components/CreateChannelModal';

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load initial data (channels, users, currentUser)
  const loadInitialData = async () => {
    try {
      const [fetchedChannels, fetchedUsers, fetchedMe] = await Promise.all([
        api.getChannels(),
        api.getUsers(),
        api.getCurrentUser(),
      ]);
      setChannels(fetchedChannels);
      setUsers(fetchedUsers);
      setCurrentUser(fetchedMe);

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
    if (selectedChannelId) {
      loadMessages(selectedChannelId);
    }
  }, [selectedChannelId, loadMessages]);

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

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null;

  if (initialLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-neutral-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg text-lg animate-pulse">
            S
          </div>
          <p className="text-sm font-medium text-neutral-400">Loading Slackers...</p>
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
        onOpenCreateChannel={() => setIsModalOpen(true)}
        users={users}
        currentUser={currentUser}
      />

      <ChatArea
        channel={selectedChannel}
        messages={messages}
        currentUser={currentUser}
        onSendMessage={handleSendMessage}
        loadingMessages={loadingMessages}
      />

      <CreateChannelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateChannel}
      />
    </main>
  );
}
