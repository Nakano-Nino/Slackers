// Audio tone synthesizer for WebRTC calls and voice room events
// Uses Web Audio API - zero external assets, instant playback, zero 404s

let audioCtx: AudioContext | null = null;
let ringInterval: any = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a synthesized dual-tone phone ring (repeats every 3.5s until stopped)
 */
export function startRingSound(type: 'incoming' | 'outgoing' = 'incoming') {
  stopRingSound();
  const ctx = getAudioContext();
  if (!ctx) return;

  const playRingBurst = () => {
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      // Incoming: 440Hz + 480Hz dual tone; Outgoing: 440Hz + 400Hz soft tone
      osc1.frequency.setValueAtTime(type === 'incoming' ? 440 : 440, now);
      osc2.frequency.setValueAtTime(type === 'incoming' ? 480 : 400, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.setValueAtTime(0.08, now + 1.2);
      gain.gain.linearRampToValueAtTime(0, now + 1.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.4);
      osc2.stop(now + 1.4);
    } catch {
      // Ignored if audio blocked
    }
  };

  playRingBurst();
  ringInterval = setInterval(playRingBurst, 3200);
}

export function stopRingSound() {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

/**
 * Positive chime when joining a voice room
 */
export function playJoinSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now); // A4
    osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
    osc.frequency.setValueAtTime(659.25, now + 0.2); // E5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
    gain.gain.setValueAtTime(0.12, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // Ignore
  }
}

/**
 * Descending chime when leaving a voice room
 */
export function playLeaveSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(440, now + 0.12); // A4

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.03);
    gain.gain.setValueAtTime(0.1, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch {
    // Ignore
  }
}

/**
 * Toggle mute tone
 */
export function playMuteSound(muted: boolean) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    if (muted) {
      osc.frequency.setValueAtTime(370, now);
      osc.frequency.setValueAtTime(280, now + 0.08);
    } else {
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.setValueAtTime(370, now + 0.08);
    }

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  } catch {
    // Ignore
  }
}
