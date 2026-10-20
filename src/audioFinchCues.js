// Lightweight procedural audio cues for Finch.
// No audio files are required; cues are intentionally short and non-speech so
// they do not compete with VoiceOver or the conversational agent.

let audioContext = null;
let waitingTimer = null;
let waitingGeneration = 0;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!audioContext) audioContext = new AudioContextCtor();
  return audioContext;
}

async function ensureAudioContext() {
  const context = getAudioContext();
  if (!context) return null;
  if (context.state === 'suspended') {
    try { await context.resume(); } catch (_) { return null; }
  }
  return context;
}

function tone(context, { frequency, start, duration, gain = 0.055, type = 'sine' }) {
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.008);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.015);
}

export async function playFinchOpenCue() {
  const context = await ensureAudioContext();
  if (!context) return;
  const now = context.currentTime + 0.005;
  // A compact upward "click": two tiny notes rather than a speech-like chime.
  tone(context, { frequency: 620, start: now, duration: 0.055, gain: 0.06, type: 'triangle' });
  tone(context, { frequency: 900, start: now + 0.048, duration: 0.065, gain: 0.055, type: 'triangle' });
}

export async function playFinchCloseCue() {
  const context = await ensureAudioContext();
  if (!context) return;
  const now = context.currentTime + 0.005;
  // Matching downward "click" for a clear end-of-conversation cue.
  tone(context, { frequency: 900, start: now, duration: 0.055, gain: 0.06, type: 'triangle' });
  tone(context, { frequency: 540, start: now + 0.048, duration: 0.07, gain: 0.055, type: 'triangle' });
}

function playWaitingPulse(generation) {
  if (generation !== waitingGeneration) return;
  void ensureAudioContext().then((context) => {
    if (!context || generation !== waitingGeneration) return;
    const now = context.currentTime + 0.005;
    tone(context, { frequency: 390, start: now, duration: 0.09, gain: 0.026, type: 'sine' });
    tone(context, { frequency: 470, start: now + 0.11, duration: 0.10, gain: 0.022, type: 'sine' });
  });
}

export function startFinchWaitingCue({ delayMs = 380 } = {}) {
  stopFinchWaitingCue();
  const generation = ++waitingGeneration;
  waitingTimer = window.setTimeout(() => {
    if (generation !== waitingGeneration) return;
    playWaitingPulse(generation);
    waitingTimer = window.setInterval(() => playWaitingPulse(generation), 720);
  }, Math.max(0, delayMs));
}

export function stopFinchWaitingCue() {
  waitingGeneration += 1;
  if (waitingTimer != null) {
    window.clearTimeout(waitingTimer);
    window.clearInterval(waitingTimer);
    waitingTimer = null;
  }
}

// Best-effort unlock after a real pointer/keyboard interaction. Voice wake can
// still work without this on browsers that allow WebAudio after mic permission.
export function primeFinchAudioCues() {
  void ensureAudioContext();
}
