'use client';

import React from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { User } from '../types';

interface IncomingCallModalProps {
  caller: User;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallModal({ caller, onAccept, onDecline }: IncomingCallModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 flex flex-col items-center text-center relative overflow-hidden">
        {/* Pulsating background circle */}
        <div className="absolute w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl animate-pulse pointer-events-none" />

        {/* Caller Avatar with pulsating ring */}
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
          <img
            src={caller.avatar}
            alt={caller.name}
            className="relative w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-lg"
          />
        </div>

        <h3 className="text-lg font-bold text-neutral-100">{caller.name}</h3>
        <p className="text-xs text-neutral-400 mt-1 mb-6 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Incoming Voice Call...
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 w-full">
          <button
            type="button"
            onClick={onDecline}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-13 h-13 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-neutral-400 group-hover:text-rose-400">Decline</span>
          </button>

          <button
            type="button"
            onClick={onAccept}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95 animate-bounce">
              <Phone className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-neutral-400 group-hover:text-emerald-400">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
