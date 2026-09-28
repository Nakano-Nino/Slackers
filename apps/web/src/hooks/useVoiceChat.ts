'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { User, VoiceParticipant, DmCallStatus } from '../types';
import {
  startRingSound,
  stopRingSound,
  playJoinSound,
  playLeaveSound,
  playMuteSound,
} from '../lib/webrtcSound';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export interface UseVoiceChatReturn {
  // DM Call state & actions
  dmCallStatus: DmCallStatus;
  dmCallPartner: User | null;
  dmCallId: string | null;
  dmDuration: number;
  startDmCall: (targetUser: User) => Promise<void>;
  acceptDmCall: () => Promise<void>;
  declineDmCall: () => void;
  endDmCall: () => void;

  // Channel Voice state & actions
  currentVoiceChannelId: string | null;
  voiceParticipants: VoiceParticipant[];
  allChannelVoiceStates: Record<string, VoiceParticipant[]>;
  joinVoiceChannel: (channelId: string) => Promise<void>;
  leaveVoiceChannel: () => void;

  // Audio controls & states
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  toggleMute: () => void;
  toggleDeafen: () => void;

  // Stage modal
  isStageOpen: boolean;
  setIsStageOpen: (open: boolean) => void;
  hasMediaError: string | null;
  setHasMediaError: (err: string | null) => void;
}

export function useVoiceChat(
  socket: Socket | null,
  currentUser: User | null
): UseVoiceChatReturn {
  // Local audio stream & analyser
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speakingIntervalRef = useRef<any>(null);

  // States
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasMediaError, setHasMediaError] = useState<string | null>(null);

  // 1-on-1 DM Call states
  const [dmCallStatus, setDmCallStatus] = useState<DmCallStatus>('idle');
  const [dmCallPartner, setDmCallPartner] = useState<User | null>(null);
  const [dmCallId, setDmCallId] = useState<string | null>(null);
  const [dmDuration, setDmDuration] = useState(0);
  const dmPeerRef = useRef<RTCPeerConnection | null>(null);
  const dmAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const dmTimerRef = useRef<any>(null);

  // Group Voice states
  const [currentVoiceChannelId, setCurrentVoiceChannelId] = useState<string | null>(null);
  const [voiceParticipants, setVoiceParticipants] = useState<VoiceParticipant[]>([]);
  const [allChannelVoiceStates, setAllChannelVoiceStates] = useState<Record<string, VoiceParticipant[]>>({});
  const [isStageOpen, setIsStageOpen] = useState(false);

  // Channel peers: map of socketId -> RTCPeerConnection
  const channelPeersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  // Channel remote audio elements: map of socketId -> HTMLAudioElement
  const channelAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Ref mirror for event handlers
  const currentVoiceChannelIdRef = useRef<string | null>(null);
  currentVoiceChannelIdRef.current = currentVoiceChannelId;
  const isMutedRef = useRef(false);
  isMutedRef.current = isMuted;
  const isDeafenedRef = useRef(false);
  isDeafenedRef.current = isDeafened;
  const dmCallPartnerRef = useRef<User | null>(null);
  dmCallPartnerRef.current = dmCallPartner;
  const dmCallStatusRef = useRef<DmCallStatus>('idle');
  dmCallStatusRef.current = dmCallStatus;

  // Initialize or get local audio stream
  const getOrCreateLocalStream = useCallback(async (): Promise<MediaStream> => {
    if (localStreamRef.current && localStreamRef.current.active) {
      return localStreamRef.current;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;

      // Apply current mute state to fresh tracks
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !isMutedRef.current;
      });

      // Setup Web Audio Analyser for speaking indicator
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          const ctx = new AudioCtxClass();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;

          // Start volume sampling loop
          if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let speakingTimeout: any = null;

          speakingIntervalRef.current = setInterval(() => {
            if (!analyserRef.current || isMutedRef.current) {
              setIsSpeaking(false);
              return;
            }
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const speakingNow = average > 14;

            if (speakingNow) {
              if (speakingTimeout) clearTimeout(speakingTimeout);
              setIsSpeaking(true);
              if (socket && currentVoiceChannelIdRef.current) {
                socket.emit('webrtc:channel-voice-speaking', {
                  channelId: currentVoiceChannelIdRef.current,
                  isSpeaking: true,
                });
              }
              speakingTimeout = setTimeout(() => {
                setIsSpeaking(false);
                if (socket && currentVoiceChannelIdRef.current) {
                  socket.emit('webrtc:channel-voice-speaking', {
                    channelId: currentVoiceChannelIdRef.current,
                    isSpeaking: false,
                  });
                }
              }, 400);
            }
          }, 100);
        }
      } catch (err) {
        console.warn('AudioAnalyser setup skipped:', err);
      }

      setHasMediaError(null);
      return stream;
    } catch (err: any) {
      console.error('Failed to access microphone:', err);
      setHasMediaError(err?.message || 'Microphone access denied');
      throw err;
    }
  }, [socket]);

  // Stop local microphone stream if neither DM nor Channel voice is active
  const stopLocalStreamIfIdle = useCallback(() => {
    if (!currentVoiceChannelIdRef.current && dmCallStatusRef.current === 'idle') {
      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current);
        speakingIntervalRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      setIsSpeaking(false);
    }
  }, []);

  // -------------------------------------------------------------
  // 1-on-1 DM CALL IMPLEMENTATION
  // -------------------------------------------------------------

  const cleanupDmCall = useCallback(() => {
    stopRingSound();
    if (dmTimerRef.current) {
      clearInterval(dmTimerRef.current);
      dmTimerRef.current = null;
    }
    if (dmPeerRef.current) {
      dmPeerRef.current.close();
      dmPeerRef.current = null;
    }
    if (dmAudioElementRef.current) {
      dmAudioElementRef.current.srcObject = null;
      dmAudioElementRef.current.remove();
      dmAudioElementRef.current = null;
    }
    setDmCallStatus('idle');
    setDmCallPartner(null);
    setDmCallId(null);
    setDmDuration(0);
    stopLocalStreamIfIdle();
  }, [stopLocalStreamIfIdle]);

  const startDmCall = useCallback(
    async (targetUser: User) => {
      if (!socket || !currentUser || dmCallStatus !== 'idle') return;
      try {
        const stream = await getOrCreateLocalStream();
        setDmCallPartner(targetUser);
        setDmCallStatus('calling');
        startRingSound('outgoing');

        // Create Peer Connection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        dmPeerRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Setup remote audio
        pc.ontrack = (event) => {
          if (!dmAudioElementRef.current) {
            const audio = new Audio();
            audio.autoplay = true;
            dmAudioElementRef.current = audio;
          }
          dmAudioElementRef.current.srcObject = event.streams[0];
          dmAudioElementRef.current.muted = isDeafenedRef.current;
          dmAudioElementRef.current.play().catch(() => {});
        };

        // ICE candidate relay
        pc.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit('webrtc:signal-dm', {
              targetUserId: targetUser.id,
              signal: { candidate: event.candidate },
            });
          }
        };

        // Notify target user
        socket.emit('webrtc:call-user', { targetUserId: targetUser.id });
      } catch (err: any) {
        cleanupDmCall();
      }
    },
    [socket, currentUser, dmCallStatus, getOrCreateLocalStream, cleanupDmCall]
  );

  const acceptDmCall = useCallback(async () => {
    if (!socket || !dmCallPartner || dmCallStatus !== 'incoming') return;
    try {
      stopRingSound();
      const stream = await getOrCreateLocalStream();
      setDmCallStatus('connected');

      // Start duration counter
      const startSec = Date.now();
      if (dmTimerRef.current) clearInterval(dmTimerRef.current);
      dmTimerRef.current = setInterval(() => {
        setDmDuration(Math.floor((Date.now() - startSec) / 1000));
      }, 1000);

      // Create Callee Peer Connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      dmPeerRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (!dmAudioElementRef.current) {
          const audio = new Audio();
          audio.autoplay = true;
          dmAudioElementRef.current = audio;
        }
        dmAudioElementRef.current.srcObject = event.streams[0];
        dmAudioElementRef.current.muted = isDeafenedRef.current;
        dmAudioElementRef.current.play().catch(() => {});
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket && dmCallPartnerRef.current) {
          socket.emit('webrtc:signal-dm', {
            targetUserId: dmCallPartnerRef.current.id,
            signal: { candidate: event.candidate },
          });
        }
      };

      // Notify caller of acceptance
      socket.emit('webrtc:accept-call', {
        callId: dmCallId || undefined,
        callerId: dmCallPartner.id,
      });
    } catch {
      cleanupDmCall();
    }
  }, [socket, dmCallPartner, dmCallStatus, dmCallId, getOrCreateLocalStream, cleanupDmCall]);

  const declineDmCall = useCallback(() => {
    if (socket && dmCallPartner) {
      socket.emit('webrtc:decline-call', {
        callId: dmCallId || undefined,
        callerId: dmCallPartner.id,
      });
    }
    cleanupDmCall();
  }, [socket, dmCallPartner, dmCallId, cleanupDmCall]);

  const endDmCall = useCallback(() => {
    if (socket && dmCallPartner) {
      socket.emit('webrtc:end-call', { targetUserId: dmCallPartner.id });
    }
    cleanupDmCall();
  }, [socket, dmCallPartner, cleanupDmCall]);

  // -------------------------------------------------------------
  // GROUP CHANNEL VOICE IMPLEMENTATION (FULL MESH)
  // -------------------------------------------------------------

  const cleanupChannelVoice = useCallback(() => {
    // Close and remove all peer connections
    channelPeersRef.current.forEach((pc) => pc.close());
    channelPeersRef.current.clear();

    // Remove remote audio elements
    channelAudiosRef.current.forEach((audio) => {
      audio.srcObject = null;
      audio.remove();
    });
    channelAudiosRef.current.clear();

    setCurrentVoiceChannelId(null);
    setVoiceParticipants([]);
    setIsStageOpen(false);
    stopLocalStreamIfIdle();
  }, [stopLocalStreamIfIdle]);

  // Create peer connection to another participant in the channel
  const createChannelPeerConnection = useCallback(
    (targetSocketId: string, initiator: boolean) => {
      const stream = localStreamRef.current;
      if (!stream || !socket) return null;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      channelPeersRef.current.set(targetSocketId, pc);

      // Add local audio tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote incoming track
      pc.ontrack = (event) => {
        let audio = channelAudiosRef.current.get(targetSocketId);
        if (!audio) {
          audio = new Audio();
          audio.autoplay = true;
          channelAudiosRef.current.set(targetSocketId, audio);
        }
        audio.srcObject = event.streams[0];
        audio.muted = isDeafenedRef.current;
        audio.play().catch(() => {});
      };

      // Send ICE candidates to target participant
      pc.onicecandidate = (event) => {
        if (event.candidate && currentVoiceChannelIdRef.current) {
          socket.emit('webrtc:channel-voice-signal', {
            channelId: currentVoiceChannelIdRef.current,
            targetSocketId,
            signal: { candidate: event.candidate },
          });
        }
      };

      // If initiator, generate SDP offer
      if (initiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (currentVoiceChannelIdRef.current) {
              socket.emit('webrtc:channel-voice-signal', {
                channelId: currentVoiceChannelIdRef.current,
                targetSocketId,
                signal: { sdp: pc.localDescription },
              });
            }
          })
          .catch((err) => console.error('Channel offer error:', err));
      }

      return pc;
    },
    [socket]
  );

  const joinVoiceChannel = useCallback(
    async (channelId: string) => {
      if (!socket || !currentUser) return;
      try {
        // If already in this channel voice, open stage
        if (currentVoiceChannelId === channelId) {
          setIsStageOpen(true);
          return;
        }

        // Leave previous voice channel if different
        if (currentVoiceChannelId && currentVoiceChannelId !== channelId) {
          cleanupChannelVoice();
        }

        await getOrCreateLocalStream();
        setCurrentVoiceChannelId(channelId);
        playJoinSound();

        // Join room on backend
        socket.emit('webrtc:channel-voice-join', { channelId });
      } catch (err: any) {
        console.error('Failed to join voice channel:', err);
      }
    },
    [socket, currentUser, currentVoiceChannelId, getOrCreateLocalStream, cleanupChannelVoice]
  );

  const leaveVoiceChannel = useCallback(() => {
    if (socket && currentVoiceChannelId) {
      socket.emit('webrtc:channel-voice-leave', { channelId: currentVoiceChannelId });
      playLeaveSound();
    }
    cleanupChannelVoice();
  }, [socket, currentVoiceChannelId, cleanupChannelVoice]);

  // -------------------------------------------------------------
  // AUDIO CONTROLS (MUTE & DEAFEN)
  // -------------------------------------------------------------

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    playMuteSound(nextMuted);

    // Apply to local mic tracks
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    // If unmuting while deafened, undeafen
    let nextDeafened = isDeafened;
    if (!nextMuted && isDeafened) {
      nextDeafened = false;
      setIsDeafened(false);
      // Unmute all remote audio
      channelAudiosRef.current.forEach((audio) => {
        audio.muted = false;
      });
      if (dmAudioElementRef.current) {
        dmAudioElementRef.current.muted = false;
      }
    }

    // Broadcast mute state in channel voice if connected
    if (socket && currentVoiceChannelIdRef.current) {
      socket.emit('webrtc:channel-voice-mute', {
        channelId: currentVoiceChannelIdRef.current,
        muted: nextMuted,
        deafened: nextDeafened,
      });
    }
  }, [isMuted, isDeafened, socket]);

  const toggleDeafen = useCallback(() => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);

    // Discord behavior: deafen forces mute
    const nextMuted = nextDeafened ? true : isMuted;
    if (nextDeafened && !isMuted) {
      setIsMuted(true);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
    }

    // Apply deafen to all remote audio elements
    channelAudiosRef.current.forEach((audio) => {
      audio.muted = nextDeafened;
    });
    if (dmAudioElementRef.current) {
      dmAudioElementRef.current.muted = nextDeafened;
    }

    playMuteSound(nextDeafened);

    if (socket && currentVoiceChannelIdRef.current) {
      socket.emit('webrtc:channel-voice-mute', {
        channelId: currentVoiceChannelIdRef.current,
        muted: nextMuted,
        deafened: nextDeafened,
      });
    }
  }, [isDeafened, isMuted, socket]);

  // -------------------------------------------------------------
  // SOCKET.IO EVENT SUBSCRIPTIONS
  // -------------------------------------------------------------

  useEffect(() => {
    if (!socket) return;

    // Request initial voice states for all channels
    socket.emit('webrtc:get-all-voice-states');

    const handleAllVoiceStates = (states: Record<string, VoiceParticipant[]>) => {
      setAllChannelVoiceStates(states || {});
    };

    // When voice participants change in any channel (broadcast to subscribers)
    const handleChannelVoiceState = (data: { channelId: string; participants: VoiceParticipant[] }) => {
      setAllChannelVoiceStates((prev) => ({
        ...prev,
        [data.channelId]: data.participants,
      }));
      if (currentVoiceChannelIdRef.current === data.channelId) {
        setVoiceParticipants(data.participants);
      }
    };

    // Initial participants list received by joiner
    const handleChannelVoiceUsers = async (data: { channelId: string; participants: VoiceParticipant[] }) => {
      if (currentVoiceChannelIdRef.current !== data.channelId) return;
      setVoiceParticipants(data.participants);

      // Joiner initiates WebRTC peer connection offer to every existing participant
      for (const p of data.participants) {
        if (p.socketId !== socket.id) {
          createChannelPeerConnection(p.socketId, true);
        }
      }
    };

    // New participant joined the channel voice room
    const handleChannelVoiceUserJoined = (data: { channelId: string; participant: VoiceParticipant }) => {
      if (currentVoiceChannelIdRef.current !== data.channelId) return;
      setVoiceParticipants((prev) => {
        if (prev.some((p) => p.userId === data.participant.userId)) return prev;
        return [...prev, data.participant];
      });
      // Existing participants wait for the joiner's offer
    };

    // Participant left the channel voice room
    const handleChannelVoiceUserLeft = (data: { channelId: string; userId: string }) => {
      if (currentVoiceChannelIdRef.current !== data.channelId) return;
      setVoiceParticipants((prev) => prev.filter((p) => p.userId !== data.userId));

      // Close and cleanup peer connection for that user
      channelPeersRef.current.forEach((pc, socketId) => {
        const audio = channelAudiosRef.current.get(socketId);
        // Find if this socket belongs to the user who left
        const p = voiceParticipants.find((vp) => vp.userId === data.userId);
        if (p && p.socketId === socketId) {
          pc.close();
          channelPeersRef.current.delete(socketId);
          if (audio) {
            audio.srcObject = null;
            audio.remove();
            channelAudiosRef.current.delete(socketId);
          }
        }
      });
    };

    // WebRTC signal received for channel voice
    const handleChannelVoiceSignal = async (data: {
      fromSocketId: string;
      fromUserId: string;
      channelId: string;
      signal: any;
    }) => {
      if (currentVoiceChannelIdRef.current !== data.channelId) return;

      const { fromSocketId, signal } = data;
      let pc = channelPeersRef.current.get(fromSocketId);

      if (signal.sdp) {
        const desc = new RTCSessionDescription(signal.sdp);
        if (desc.type === 'offer') {
          // Received offer: create peer connection, set remote desc, create & send answer
          if (!pc) {
            pc = createChannelPeerConnection(fromSocketId, false) || undefined;
          }
          if (pc) {
            await pc.setRemoteDescription(desc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc:channel-voice-signal', {
              channelId: data.channelId,
              targetSocketId: fromSocketId,
              signal: { sdp: pc.localDescription },
            });
          }
        } else if (desc.type === 'answer') {
          if (pc) {
            await pc.setRemoteDescription(desc);
          }
        }
      } else if (signal.candidate) {
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            console.warn('Error adding ICE candidate:', err);
          }
        }
      }
    };

    // Participant mute/deafen updated
    const handleChannelVoiceUserUpdated = (data: {
      channelId: string;
      userId: string;
      muted: boolean;
      deafened: boolean;
    }) => {
      if (currentVoiceChannelIdRef.current !== data.channelId) return;
      setVoiceParticipants((prev) =>
        prev.map((p) =>
          p.userId === data.userId ? { ...p, muted: data.muted, deafened: data.deafened } : p
        )
      );
    };

    // Participant speaking indicator
    const handleChannelVoiceSpeaking = (data: {
      channelId: string;
      userId: string;
      isSpeaking: boolean;
    }) => {
      if (currentVoiceChannelIdRef.current !== data.channelId) return;
      setVoiceParticipants((prev) =>
        prev.map((p) => (p.userId === data.userId ? { ...p, isSpeaking: data.isSpeaking } : p))
      );
    };

    // ----------------------
    // DM Call Socket Events
    // ----------------------

    const handleIncomingCall = (data: { callId: string; caller: User; targetUserId: string }) => {
      // If already in a call, auto-decline
      if (dmCallStatusRef.current !== 'idle') {
        socket.emit('webrtc:decline-call', {
          callId: data.callId,
          callerId: data.caller.id,
          reason: 'busy',
        });
        return;
      }
      setDmCallId(data.callId);
      setDmCallPartner(data.caller);
      setDmCallStatus('incoming');
      startRingSound('incoming');
    };

    const handleCallAccepted = async (data: { callId?: string; callee: User }) => {
      if (dmCallStatusRef.current !== 'calling') return;
      stopRingSound();
      setDmCallStatus('connected');

      // Start duration counter
      const startSec = Date.now();
      if (dmTimerRef.current) clearInterval(dmTimerRef.current);
      dmTimerRef.current = setInterval(() => {
        setDmDuration(Math.floor((Date.now() - startSec) / 1000));
      }, 1000);

      // Caller creates and sends offer
      const pc = dmPeerRef.current;
      if (pc && dmCallPartnerRef.current) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:signal-dm', {
            targetUserId: dmCallPartnerRef.current.id,
            signal: { sdp: pc.localDescription },
          });
        } catch (err) {
          console.error('Failed to create DM call offer:', err);
        }
      }
    };

    const handleCallDeclined = () => {
      cleanupDmCall();
    };

    const handleCallEnded = () => {
      cleanupDmCall();
    };

    const handleSignalDm = async (data: { fromUserId: string; signal: any }) => {
      const pc = dmPeerRef.current;
      if (!pc) return;

      const { signal } = data;
      if (signal.sdp) {
        const desc = new RTCSessionDescription(signal.sdp);
        if (desc.type === 'offer') {
          await pc.setRemoteDescription(desc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc:signal-dm', {
            targetUserId: data.fromUserId,
            signal: { sdp: pc.localDescription },
          });
        } else if (desc.type === 'answer') {
          await pc.setRemoteDescription(desc);
        }
      } else if (signal.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (err) {
          console.warn('Error adding DM ICE candidate:', err);
        }
      }
    };

    // Attach listeners
    socket.on('webrtc:all-voice-states', handleAllVoiceStates);
    socket.on('webrtc:channel-voice-state', handleChannelVoiceState);
    socket.on('webrtc:channel-voice-users', handleChannelVoiceUsers);
    socket.on('webrtc:channel-voice-user-joined', handleChannelVoiceUserJoined);
    socket.on('webrtc:channel-voice-user-left', handleChannelVoiceUserLeft);
    socket.on('webrtc:channel-voice-signal', handleChannelVoiceSignal);
    socket.on('webrtc:channel-voice-user-updated', handleChannelVoiceUserUpdated);
    socket.on('webrtc:channel-voice-speaking', handleChannelVoiceSpeaking);

    socket.on('webrtc:incoming-call', handleIncomingCall);
    socket.on('webrtc:call-accepted', handleCallAccepted);
    socket.on('webrtc:call-declined', handleCallDeclined);
    socket.on('webrtc:call-ended', handleCallEnded);
    socket.on('webrtc:signal-dm', handleSignalDm);

    return () => {
      socket.off('webrtc:all-voice-states', handleAllVoiceStates);
      socket.off('webrtc:channel-voice-state', handleChannelVoiceState);
      socket.off('webrtc:channel-voice-users', handleChannelVoiceUsers);
      socket.off('webrtc:channel-voice-user-joined', handleChannelVoiceUserJoined);
      socket.off('webrtc:channel-voice-user-left', handleChannelVoiceUserLeft);
      socket.off('webrtc:channel-voice-signal', handleChannelVoiceSignal);
      socket.off('webrtc:channel-voice-user-updated', handleChannelVoiceUserUpdated);
      socket.off('webrtc:channel-voice-speaking', handleChannelVoiceSpeaking);

      socket.off('webrtc:incoming-call', handleIncomingCall);
      socket.off('webrtc:call-accepted', handleCallAccepted);
      socket.off('webrtc:call-declined', handleCallDeclined);
      socket.off('webrtc:call-ended', handleCallEnded);
      socket.off('webrtc:signal-dm', handleSignalDm);
    };
  }, [socket, createChannelPeerConnection, cleanupDmCall]);

  return {
    dmCallStatus,
    dmCallPartner,
    dmCallId,
    dmDuration,
    startDmCall,
    acceptDmCall,
    declineDmCall,
    endDmCall,

    currentVoiceChannelId,
    voiceParticipants,
    allChannelVoiceStates,
    joinVoiceChannel,
    leaveVoiceChannel,

    isMuted,
    isDeafened,
    isSpeaking,
    toggleMute,
    toggleDeafen,

    isStageOpen,
    setIsStageOpen,
    hasMediaError,
    setHasMediaError,
  };
}
