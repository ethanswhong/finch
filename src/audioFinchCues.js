// Small non-speech audio cues for Finch.
//
// iOS/Safari will not reliably play Web Audio that is first created by a
// speech-recognition callback, because that callback is not a user gesture.
// We therefore keep one shared AudioContext and explicitly unlock it during
// normal taps / VoiceOver double-taps. The cue functions can then be called
// later from Soniox without rebuilding the audio route.
let audioContext = null;
let audioUnlocked = false;
let waitingTimer = null;
let waitingInterval = null;
let waitingGeneration = 0;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) {
    try {
      audioContext = new Ctor({ latencyHint: 'interactive' });
    } catch (_) {
      audioContext = new Ctor();
    }
  }
  return audioContext;
}

function playUnlockTick(context) {
  try {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.00001, context.currentTime);
    oscillator.frequency.setValueAtTime(440, context.currentTime);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.018);
  } catch (_) {}
}

export function primeFinchAudioCues() {
  const context = getAudioContext();
  if (!context) return false;
  playUnlockTick(context);
  try {
    const promise = context.resume?.();
    if (promise?.then) {
      promise.then(() => {
        audioUnlocked = context.state === 'running';
        if (audioUnlocked) console.debug('[FINCH AUDIO] cue audio unlocked');
      }).catch(() => {});
    }
  } catch (_) {}
  if (context.state === 'running') audioUnlocked = true;
  return audioUnlocked;
}

async function ensureAudioContext(cueName = 'cue') {
  const context = getAudioContext();
  if (!context) return null;
  if (context.state === 'suspended') {
    try { await context.resume(); } catch (_) {}
  }
  if (context.state !== 'running') {
    console.warn('[FINCH AUDIO] cue could not play because browser audio is still locked', {
      cue: cueName,
      state: context.state,
      hint: 'Tap or VoiceOver-double-tap anywhere in the app once to unlock sound cues.',
    });
    return null;
  }
  audioUnlocked = true;
  return context;
}

function tone(context, { frequency, start, duration, gain = 0.08, type = 'triangle' }) {
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
  oscillator.stop(start + duration + 0.02);
}

export async function playFinchOpenCue() {
  const context = await ensureAudioContext('open');
  if (!context) return false;
  const now = context.currentTime + 0.005;
  tone(context, { frequency: 610, start: now, duration: 0.055, gain: 0.12 });
  tone(context, { frequency: 930, start: now + 0.052, duration: 0.07, gain: 0.105 });
  console.debug('[FINCH AUDIO] open cue played');
  return true;
}

export async function playFinchCloseCue() {
  const context = await ensureAudioContext('close');
  if (!context) return false;
  const now = context.currentTime + 0.005;
  tone(context, { frequency: 930, start: now, duration: 0.055, gain: 0.12 });
  tone(context, { frequency: 520, start: now + 0.052, duration: 0.075, gain: 0.105 });
  console.debug('[FINCH AUDIO] close cue played');
  return true;
}

function waitingPulse(generation) {
  if (generation !== waitingGeneration) return;
  void ensureAudioContext('waiting').then((context) => {
    if (!context || generation !== waitingGeneration) return;
    const now = context.currentTime + 0.005;
    tone(context, { frequency: 360, start: now, duration: 0.09, gain: 0.038, type: 'sine' });
    tone(context, { frequency: 430, start: now + 0.13, duration: 0.095, gain: 0.032, type: 'sine' });
  });
}

export function startFinchWaitingCue({ delayMs = 420 } = {}) {
  stopFinchWaitingCue();
  const generation = ++waitingGeneration;
  waitingTimer = window.setTimeout(() => {
    waitingTimer = null;
    if (generation !== waitingGeneration) return;
    waitingPulse(generation);
    waitingInterval = window.setInterval(() => waitingPulse(generation), 900);
  }, Math.max(0, delayMs));
}

export function stopFinchWaitingCue() {
  waitingGeneration += 1;
  if (waitingTimer !== null) window.clearTimeout(waitingTimer);
  if (waitingInterval !== null) window.clearInterval(waitingInterval);
  waitingTimer = null;
  waitingInterval = null;
}

export function getFinchAudioCueState() {
  return { unlocked: audioUnlocked, state: audioContext?.state || 'not-created' };
}
