// Small non-speech audio cues. This module is intentionally isolated from
// ElevenLabs navigation/client tools so it cannot participate in context switching.
let audioContext = null;
let waitingTimer = null;
let waitingInterval = null;
let waitingGeneration = 0;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
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

function tone(context, { frequency, start, duration, gain = 0.05, type = 'triangle' }) {
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

export async function primeFinchAudioCues() {
  await ensureAudioContext();
}

export async function playFinchOpenCue() {
  const context = await ensureAudioContext();
  if (!context) return;
  const now = context.currentTime + 0.005;
  tone(context, { frequency: 620, start: now, duration: 0.05, gain: 0.055 });
  tone(context, { frequency: 900, start: now + 0.046, duration: 0.06, gain: 0.05 });
}

export async function playFinchCloseCue() {
  const context = await ensureAudioContext();
  if (!context) return;
  const now = context.currentTime + 0.005;
  tone(context, { frequency: 900, start: now, duration: 0.05, gain: 0.055 });
  tone(context, { frequency: 540, start: now + 0.046, duration: 0.065, gain: 0.05 });
}

function waitingPulse(generation) {
  if (generation !== waitingGeneration) return;
  void ensureAudioContext().then((context) => {
    if (!context || generation !== waitingGeneration) return;
    const now = context.currentTime + 0.005;
    tone(context, { frequency: 390, start: now, duration: 0.075, gain: 0.02, type: 'sine' });
    tone(context, { frequency: 455, start: now + 0.105, duration: 0.085, gain: 0.018, type: 'sine' });
  });
}

export function startFinchWaitingCue({ delayMs = 380 } = {}) {
  stopFinchWaitingCue();
  const generation = ++waitingGeneration;
  waitingTimer = window.setTimeout(() => {
    waitingTimer = null;
    if (generation !== waitingGeneration) return;
    waitingPulse(generation);
    waitingInterval = window.setInterval(() => waitingPulse(generation), 760);
  }, Math.max(0, delayMs));
}

export function stopFinchWaitingCue() {
  waitingGeneration += 1;
  if (waitingTimer !== null) window.clearTimeout(waitingTimer);
  if (waitingInterval !== null) window.clearInterval(waitingInterval);
  waitingTimer = null;
  waitingInterval = null;
}
