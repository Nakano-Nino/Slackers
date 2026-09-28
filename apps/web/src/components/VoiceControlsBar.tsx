'use client';

import React from 'react';
import { Mic, MicOff, Headphones, PhoneOff, Radio, Maximize2 } from 'lucide-react';
import { Channel } from '../types';

interface VoiceControlsBarProps {
  channel: Channel | undefined;
  participantCount: number;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onDisconnect: () => void;
  onOpenStage: () => void;
}

export function VoiceControlsBar({
  channel,
  participantCount,
  isMuted,
  isDeafened,
  isSpeaking,
  onToggleMute,
  onToggleDeafen,
  onDisconnect,
  onOpenStage,
}: VoiceControlsBarProps) {
  return (
    <div className="border-t border-neutral-800 bg-neutral-900/90 px-3 py-2 flex flex-col gap-1.5 select-none">
      {/* Top row: Status & Channel */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenStage}
          className="flex items-center gap-2 min-w-0 text-left group cursor-pointer hover:opacity-90 transition"
          title="Open Voice Stage"
        >
          <div className="relative">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40 animate-ping" />
            )}
          </div>
          <div className="truncate min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-400 leading-tight">
                Voice Connected
              </span>
              <Maximize2 className="w-2.5 h-2.5 text-neutral-500 group-hover:text-neutral-300 transition" />
            </div>
            <p className="text-[10px] text-neutral-400 truncate leading-tight">
              #{channel?.name || 'Channel'} • {participantCount} online
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onDisconnect}
          title="Disconnect from voice"
          className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition cursor-pointer"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom row: Mute & Deafen Quick Actions */}
      <div className="flex items-center justify-around bg-neutral-950/60 rounded-lg py-1 px-2 border border-neutral-800/80">
        <button
          type="button"
          onClick={onToggleMute}
          className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded transition cursor-pointer ${
            isMuted
              ? 'text-rose-400 font-semibold bg-rose-500/10'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-neutral-300" />}
          <span>{isMuted ? 'Muted' : 'Mute'}</span>
        </button>

        <div className="w-px h-3.5 bg-neutral-800" />

        <button
          type="button"
          onClick={onToggleDeafen}
          className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded transition cursor-pointer ${
            isDeafened
              ? 'text-rose-400 font-semibold bg-rose-500/10'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
          title={isDeafened ? 'Undeafen audio' : 'Deafen audio'}
        >
          <Headphones className={`w-3.5 h-3.5 ${isDeafened ? 'text-rose-400' : 'text-neutral-300'}`} />
          <span>{isDeafened ? 'Deafened' : 'Deafen'}</span>
        </button>
      </div>
    </div>
  );
}
