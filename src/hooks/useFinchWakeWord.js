import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserPermissionResolver, SonioxClient } from '@soniox/client';

const FINCH_ALIASES = [
  'finch', 'fetch', 'pinch', 'finish', 'french', 'fringe', 'fence', 'fish', 'fin', 'inch',
];
const WAKE_PREFIXES = ['hey', 'hay', 'hi', 'hello', 'okay', 'ok'];
const STOP_PREFIXES = ['stop', 'bye', 'by', 'buy', 'goodbye', 'quit', 'exit', 'end', 'close', 'cancel'];
const TRIGGER_COOLDOWN_MS = 1100;

function normalizeSpeech(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) rows[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return rows[a.length][b.length];
}

function soundsLikeFinch(token = '', { loose = false } = {}) {
  if (FINCH_ALIASES.includes(token)) return true;
  if (token.length < 4) return false;
  return editDistance(token, 'finch') <= (loose ? 2 : 1);
}

function containsCommand(text, prefixes, { looseFinch = false } = {}) {
  const words = normalizeSpeech(text).split(' ').filter(Boolean);
  for (let i = 0; i < words.length; i += 1) {
    if (!prefixes.includes(words[i])) continue;
    for (let offset = 1; offset <= 3 && i + offset < words.length; offset += 1) {
      if (soundsLikeFinch(words[i + offset], { loose: looseFinch })) return true;
    }
  }
  return false;
}

export function isFinchWakePhrase(text) {
  return containsCommand(text, WAKE_PREFIXES, { looseFinch: false });
}

export function isFinchStopPhrase(text) {
  return containsCommand(text, STOP_PREFIXES, { looseFinch: true });
}

export default function useFinchWakeWord({
  enabled = true,
  conversationActive = false,
  onWake,
  onStop,
}) {
  const [status, setStatus] = useState('idle');
  const clientRef = useRef(null);
  const recordingRef = useRef(null);
  const recentTextRef = useRef('');
  const triggeringRef = useRef(false);
  const mountedRef = useRef(true);
  const conversationActiveRef = useRef(conversationActive);
  const onWakeRef = useRef(onWake);
  const onStopRef = useRef(onStop);
  onWakeRef.current = onWake;
  onStopRef.current = onStop;
  conversationActiveRef.current = conversationActive;

  const clearTriggerSoon = useCallback(() => {
    window.setTimeout(() => {
      triggeringRef.current = false;
      recentTextRef.current = '';
      if (mountedRef.current && recordingRef.current) setStatus('listening');
    }, TRIGGER_COOLDOWN_MS);
  }, []);

  const stop = useCallback(async ({ immediate = true } = {}) => {
    const recording = recordingRef.current;
    recordingRef.current = null;
    recentTextRef.current = '';
    triggeringRef.current = false;
    if (!recording) {
      if (mountedRef.current) setStatus('idle');
      return;
    }
    try {
      if (immediate) recording.cancel();
      else await recording.stop();
    } catch (error) {
      console.debug('Soniox listener stop:', error);
    }
    if (mountedRef.current) setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (!enabled || recordingRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable');
      return;
    }

    if (!clientRef.current) {
      clientRef.current = new SonioxClient({
        config: async () => {
          const response = await fetch('/api/soniox-temp-key', { method: 'POST' });
          if (!response.ok) throw new Error(`Soniox temporary key failed (${response.status})`);
          const data = await response.json();
          return { api_key: data.api_key };
        },
        permissions: new BrowserPermissionResolver(),
      });
    }

    setStatus('starting');
    recentTextRef.current = '';
    triggeringRef.current = false;

    try {
      const recording = clientRef.current.realtime.record({
        model: 'stt-rt-v5',
        language_hints: ['en'],
        enable_endpoint_detection: true,
        auto_reconnect: true,
        max_reconnect_attempts: 2,
        context: {
          terms: [
            'Finch', 'Hey Finch', 'Hi Finch', 'Okay Finch', 'Stop Finch', 'Bye Finch',
            'Fetch', 'Pinch', 'Finish', 'Fiori',
          ],
          general: [{ key: 'domain', value: 'food delivery voice assistant wake and stop phrases' }],
        },
      });
      recordingRef.current = recording;

      recording.on('connected', () => {
        if (mountedRef.current) setStatus('listening');
      });
      recording.on('state_change', ({ new_state }) => {
        if (!mountedRef.current) return;
        if (new_state === 'recording') setStatus('listening');
        if (new_state === 'error') setStatus('error');
      });
      recording.on('error', (error) => {
        console.error('Soniox listener:', error);
        recordingRef.current = null;
        if (mountedRef.current) setStatus('error');
      });
      recording.on('result', (result) => {
        if (triggeringRef.current) return;

        // Prefer finalized tokens for commands, while still allowing the most recent
        // partial tokens so "Hey Finch" remains responsive.
        const usefulTokens = result.tokens?.filter((token) => (token.confidence ?? 1) >= 0.45) || [];
        const chunk = usefulTokens.map((token) => token.text).join('');
        if (!chunk) return;

        const combined = normalizeSpeech(`${recentTextRef.current} ${chunk}`).slice(-220);
        recentTextRef.current = combined;

        if (conversationActiveRef.current) {
          if (!isFinchStopPhrase(combined)) return;
          triggeringRef.current = true;
          if (mountedRef.current) setStatus('triggered');
          Promise.resolve(onStopRef.current?.(combined)).finally(clearTriggerSoon);
          return;
        }

        if (!isFinchWakePhrase(combined)) return;
        triggeringRef.current = true;
        if (mountedRef.current) setStatus('triggered');
        Promise.resolve(onWakeRef.current?.(combined)).finally(clearTriggerSoon);
      });
    } catch (error) {
      console.error('Could not start Soniox listener:', error);
      recordingRef.current = null;
      if (mountedRef.current) setStatus('error');
    }
  }, [clearTriggerSoon, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      const timer = window.setTimeout(() => void start(), 250);
      return () => window.clearTimeout(timer);
    }
    void stop();
    return undefined;
  }, [enabled, start, stop]);

  useEffect(() => {
    if (!enabled || status !== 'error') return undefined;
    const timer = window.setTimeout(() => void start(), 1400);
    return () => window.clearTimeout(timer);
  }, [enabled, status, start]);

  useEffect(() => () => {
    mountedRef.current = false;
    const recording = recordingRef.current;
    recordingRef.current = null;
    try { recording?.cancel(); } catch (_) {}
  }, []);

  return { status, start, stop };
}
