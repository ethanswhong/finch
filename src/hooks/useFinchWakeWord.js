import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserPermissionResolver, SonioxClient } from '@soniox/client';

const FINCH_ALIASES = ['finch', 'fetch', 'pinch', 'finish', 'french', 'fringe'];
const WAKE_PREFIXES = ['hey', 'hay', 'hi', 'hello', 'okay', 'ok'];
const STOP_PREFIXES = ['stop', 'bye', 'by', 'buy', 'goodbye', 'quit', 'exit', 'end'];

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

function soundsLikeFinch(token = '') {
  if (FINCH_ALIASES.includes(token)) return true;
  return token.length >= 4 && editDistance(token, 'finch') <= 2;
}

function containsCommand(text, prefixes) {
  const words = normalizeSpeech(text).split(' ').filter(Boolean);
  for (let i = 0; i < words.length; i += 1) {
    if (!prefixes.includes(words[i])) continue;
    for (let offset = 1; offset <= 3 && i + offset < words.length; offset += 1) {
      if (soundsLikeFinch(words[i + offset])) return true;
    }
  }
  return false;
}

export function isFinchWakePhrase(text) {
  return containsCommand(text, WAKE_PREFIXES);
}

export function isFinchStopPhrase(text) {
  return containsCommand(text, STOP_PREFIXES);
}

export default function useFinchWakeWord({ enabled = true, suspended = false, onWake, onStop }) {
  const [status, setStatus] = useState('idle');
  const clientRef = useRef(null);
  const recordingRef = useRef(null);
  const recentTextRef = useRef('');
  const triggeringRef = useRef(false);
  const mountedRef = useRef(true);
  const onWakeRef = useRef(onWake);
  const onStopRef = useRef(onStop);
  onWakeRef.current = onWake;
  onStopRef.current = onStop;

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
      console.debug('Soniox wake listener stop:', error);
    }
    if (mountedRef.current) setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (!enabled || suspended || recordingRef.current) return;
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
          terms: ['Finch', 'Hey Finch', 'Fiori'],
          general: [{ key: 'domain', value: 'food delivery voice assistant wake phrase' }],
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
        console.error('Soniox wake listener:', error);
        recordingRef.current = null;
        if (mountedRef.current) setStatus('error');
      });
      recording.on('result', (result) => {
        if (triggeringRef.current) return;
        const chunk = result.tokens?.map((token) => token.text).join('') || '';
        if (!chunk) return;
        const combined = normalizeSpeech(`${recentTextRef.current} ${chunk}`).slice(-180);
        recentTextRef.current = combined;

        const wake = isFinchWakePhrase(combined);
        const stopCommand = isFinchStopPhrase(combined);
        if (!wake && !stopCommand) return;

        triggeringRef.current = true;
        try { recording.cancel(); } catch (_) {}
        recordingRef.current = null;
        if (mountedRef.current) setStatus('triggered');

        const callback = stopCommand ? onStopRef.current : onWakeRef.current;
        Promise.resolve(callback?.(combined)).finally(() => {
          recentTextRef.current = '';
        });
      });
    } catch (error) {
      console.error('Could not start Soniox wake listener:', error);
      recordingRef.current = null;
      if (mountedRef.current) setStatus('error');
    }
  }, [enabled, suspended]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled && !suspended) {
      const timer = window.setTimeout(() => void start(), 250);
      return () => window.clearTimeout(timer);
    }
    void stop();
    return undefined;
  }, [enabled, suspended, start, stop]);

  useEffect(() => {
    if (!enabled || suspended || status !== 'error') return undefined;
    const timer = window.setTimeout(() => void start(), 1400);
    return () => window.clearTimeout(timer);
  }, [enabled, suspended, status, start]);

  useEffect(() => () => {
    mountedRef.current = false;
    const recording = recordingRef.current;
    recordingRef.current = null;
    try { recording?.cancel(); } catch (_) {}
  }, []);

  return { status, start, stop };
}
