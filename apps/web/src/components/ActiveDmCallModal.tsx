'use client';

import React from 'react';
import { Mic, MicOff, Headphones, PhoneOff, Volume2 } from 'lucide-react';
import { User, DmCallStatus } from '../types';

interface ActiveDmCallModalProps {
  status: DmCallStatus;
  partner: User;
  duration: number;
  isMuted: boolean;
  isDeafened: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onEndCall: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function ActiveDmCallModal({
  status,
  partner,
  duration,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen,
  onEndCall,
}: ActiveDmCallModalProps) {
  if (status !== 'calling' && status !== 'connected') return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 shadow-2xl rounded-2xl p-4 w-72 flex flex-col items-center">
        {/* Header indicator */}
        <div className="flex items-center justify-between w-full mb-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{status === 'connected' ? 'Voice Connected' : 'Calling...'}</span>
          </div>
          {status === 'connected' && (
            <span className="font-mono text-neutral-400 text-xs">{formatDuration(duration)}</span>
          )}
        </div>

        {/* User avatar & info */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative mb-2">
            <img
              src={partner.avatar}
              alt={partner.name}
              className={`w-16 h-16 rounded-full object-cover border-2 ${
                status === 'connected' ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 'border-neutral-600 animate-pulse'
              }`}
            />
            {status === 'connected' && (
              <span className="absolute bottom-0 right-0 p-1 bg-emerald-500 rounded-full text-white">
                <Volume2 className="w-3 h-3" />
              </span>
            )}
          </div>
          <h4 className="font-semibold text-neutral-100 text-sm">{partner.name}</h4>
          <p className="text-[11px] text-neutral-400">{partner.email}</p>
        </div>

        {/* Call action controls */}
        <div className="flex items-center justify-center gap-3 w-full pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={onToggleMute}
            className={`p-2.5 rounded-full transition cursor-pointer ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleDeafen}
            className={`p-2.5 rounded-full transition cursor-pointer ${
              isDeafened
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
            }`}
            title={isDeafened ? 'Undeafen audio' : 'Deafen audio'}
          >
            <Headphones className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onEndCall}
            className="p-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md transition cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
