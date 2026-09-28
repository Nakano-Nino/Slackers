'use client';

import React from 'react';
import { X, Mic, MicOff, Headphones, PhoneOff, Radio } from 'lucide-react';
import { Channel, User, VoiceParticipant } from '../types';
import { getUserRoleBadge } from '../lib/roles';

interface GroupVoiceStageModalProps {
  channel: Channel | undefined;
  participants: VoiceParticipant[];
  currentUser: User | null;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onDisconnect: () => void;
  onClose: () => void;
}

export function GroupVoiceStageModal({
  channel,
  participants,
  currentUser,
  isMuted,
  isDeafened,
  isSpeaking,
  onToggleMute,
  onToggleDeafen,
  onDisconnect,
  onClose,
}: GroupVoiceStageModalProps) {
  // Ensure current user is in participants list for UI rendering
  const displayParticipants: VoiceParticipant[] = [...participants];
  if (currentUser && !displayParticipants.some((p) => p.userId === currentUser.id)) {
    displayParticipants.unshift({
      socketId: 'self',
      userId: currentUser.id,
      user: currentUser,
      muted: isMuted,
      deafened: isDeafened,
      isSpeaking,
      joinedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[600px] overflow-hidden">
        {/* Header */}
        <div className="h-14 px-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                <span>#{channel?.name || 'Channel'} Voice Stage</span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                {displayParticipants.length} {displayParticipants.length === 1 ? 'member' : 'members'} connected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Participant Grid */}
        <div className="flex-1 p-6 overflow-y-auto bg-neutral-950/40">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {displayParticipants.map((p) => {
              const isSelf = p.userId === currentUser?.id;
              const activeSpeaking = isSelf ? isSpeaking : p.isSpeaking;
              const activeMuted = isSelf ? isMuted : p.muted;
              const activeDeafened = isSelf ? isDeafened : p.deafened;
              const roleBadge = getUserRoleBadge(p.user);

              return (
                <div
                  key={p.userId}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border bg-neutral-900/80 transition-all ${
                    activeSpeaking
                      ? 'border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                      : 'border-neutral-800'
                  }`}
                >
                  {/* Avatar with speaking ring */}
                  <div className="relative mb-3">
                    <img
                      src={p.user.avatar}
                      alt={p.user.name}
                      className={`w-16 h-16 rounded-full object-cover border-2 transition-all ${
                        activeSpeaking
                          ? 'border-emerald-400 ring-4 ring-emerald-500/40 scale-105'
                          : 'border-neutral-700'
                      }`}
                    />

                    {/* Muted / Deafened Indicator Badge */}
                    {(activeMuted || activeDeafened) && (
                      <span className="absolute bottom-0 right-0 p-1 bg-rose-600 rounded-full text-white shadow-md">
                        {activeDeafened ? (
                          <Headphones className="w-3 h-3" />
                        ) : (
                          <MicOff className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>

                  <h5 className="text-xs font-semibold text-neutral-200 truncate max-w-full text-center">
                    {p.user.name} {isSelf && <span className="text-neutral-500 font-normal">(you)</span>}
                  </h5>

                  <span className={`mt-1 text-[8px] font-bold uppercase px-1 py-0.2 rounded border ${roleBadge.class}`}>
                    {roleBadge.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Voice Controls */}
        <div className="h-16 px-6 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleMute}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
              <span>{isMuted ? 'Muted' : 'Mute'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleDeafen}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                isDeafened
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
              }`}
            >
              <Headphones className={`w-4 h-4 ${isDeafened ? 'text-rose-400' : 'text-neutral-300'}`} />
              <span>{isDeafened ? 'Deafened' : 'Deafen'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onDisconnect();
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium shadow-md transition cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Disconnect</span>
          </button>
        </div>
      </div>
    </div>
  );
}
