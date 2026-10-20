import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserPermissionResolver, SonioxClient } from '@soniox/client';

// Keep recognition tolerant to the STT mistakes we have actually observed,
// but do not use edit-distance matching here. Broad fuzzy matching caused
// ordinary speech to wake or stop Finch too easily.
const FINCH_ALIASES = new Set(['finch', 'fetch', 'pinch', 'finish', 'french']);
const WAKE_PREFIXES = new Set(['hey', 'hi', 'hello']);
const STOP_PREFIXES = new Set(['stop', 'bye', 'goodbye', 'quit', 'end']);
const WAKE_FILLERS = new Set(['there']);
const STOP_FILLERS = new Set(['please']);
const TRIGGER_COOLDOWN_MS = 1500;
const RECOVERY_DELAY_MS = 900;
const FOREGROUND_RECONNECT_MIN_HIDDEN_MS = 1800;

function normalizeSpeech(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasDirectedCommand(text, prefixes, fillers = new Set()) {
  const words = normalizeSpeech(text).split(' ').filter(Boolean);
  if (words.length < 2) return false;

  // Only inspect the tail of the current utterance. This prevents an old
  // "hey" or "bye" from combining with a much later occurrence of Finch.
  const start = Math.max(0, words.length - 6);
  for (let i = start; i < words.length; i += 1) {
    if (!prefixes.has(words[i])) continue;
    let next = i + 1;
    if (fillers.has(words[next])) next += 1;
    if (FINCH_ALIASES.has(words[next])) return true;
  }
  return false;
}

export function isFinchWakePhrase(text) {
  return hasDirectedCommand(text, WAKE_PREFIXES, WAKE_FILLERS);
}

export function isFinchStopPhrase(text) {
  return hasDirectedCommand(text, STOP_PREFIXES, STOP_FILLERS);
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
  const utteranceFinalRef = useRef('');
  const triggeringRef = useRef(false);
  const mountedRef = useRef(true);
  const intentionalStopRef = useRef(false);
  const restartTimerRef = useRef(null);
  const startRef = useRef(null);
  const hiddenAtRef = useRef(null);
  const conversationActiveRef = useRef(conversationActive);
  const onWakeRef = useRef(onWake);
  const onStopRef = useRef(onStop);
  onWakeRef.current = onWake;
  onStopRef.current = onStop;
  conversationActiveRef.current = conversationActive;

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const scheduleRestart = useCallback((reason = 'unknown', delay = RECOVERY_DELAY_MS) => {
    if (!enabled || !mountedRef.current || intentionalStopRef.current || restartTimerRef.current) return;
    console.warn('[Soniox] listener dropped; scheduling recovery', { reason, delay });
    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = null;
      if (!enabled || !mountedRef.current || intentionalStopRef.current) return;
      void startRef.current?.({ reason: `recovery:${reason}` });
    }, delay);
  }, [enabled]);

  const clearTriggerSoon = useCallback(() => {
    window.setTimeout(() => {
      triggeringRef.current = false;
      utteranceFinalRef.current = '';
      if (mountedRef.current && recordingRef.current) setStatus('listening');
    }, TRIGGER_COOLDOWN_MS);
  }, []);

  const stop = useCallback(async ({ immediate = true } = {}) => {
    intentionalStopRef.current = true;
    clearRestartTimer();
    const recording = recordingRef.current;
    recordingRef.current = null;
    utteranceFinalRef.current = '';
    triggeringRef.current = false;
    if (!recording) {
      if (mountedRef.current) setStatus('idle');
      return;
    }
    try {
      if (immediate) recording.cancel();
      else await recording.stop();
    } catch (error) {
      console.debug('[Soniox] listener stop:', error);
    }
    if (mountedRef.current) setStatus('idle');
  }, [clearRestartTimer]);

  const start = useCallback(async ({ reason = 'start' } = {}) => {
    if (!enabled || recordingRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable');
      return;
    }

    intentionalStopRef.current = false;
    clearRestartTimer();

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
    utteranceFinalRef.current = '';
    triggeringRef.current = false;
    console.debug('[Soniox] starting persistent listener', { reason });

    try {
      const recording = clientRef.current.realtime.record({
        model: 'stt-rt-v5',
        language_hints: ['en'],
        enable_endpoint_detection: true,
        auto_reconnect: true,
        max_reconnect_attempts: 6,
        reconnect_base_delay_ms: 700,
        context: {
          terms: [
            'Finch', 'Hey Finch', 'Hi Finch', 'Hello Finch', 'Stop Finch', 'Bye Finch',
            'Goodbye Finch', 'Fetch', 'Pinch', 'Finish', 'Fiori',
          ],
          general: [{ key: 'domain', value: 'food delivery voice assistant wake and stop phrases' }],
        },
      });
      recordingRef.current = recording;

      const releaseCurrentRecording = (reasonForRelease) => {
        if (recordingRef.current !== recording) return false;
        recordingRef.current = null;
        utteranceFinalRef.current = '';
        triggeringRef.current = false;
        if (!intentionalStopRef.current) scheduleRestart(reasonForRelease);
        return true;
      };

      recording.on('connected', () => {
        if (recordingRef.current !== recording) return;
        console.debug('[Soniox] connected');
        if (mountedRef.current) setStatus('listening');
      });

      recording.on('reconnecting', ({ attempt, max_attempts, delay_ms }) => {
        if (recordingRef.current !== recording) return;
        console.warn('[Soniox] reconnecting', { attempt, max_attempts, delay_ms });
        if (mountedRef.current) setStatus('reconnecting');
      });

      recording.on('reconnected', ({ attempt }) => {
        if (recordingRef.current !== recording) return;
        console.warn('[Soniox] reconnected', { attempt });
        if (mountedRef.current) setStatus('listening');
      });

      recording.on('session_restart', () => {
        if (recordingRef.current !== recording) return;
        utteranceFinalRef.current = '';
      });

      recording.on('source_muted', () => {
        if (recordingRef.current !== recording) return;
        console.warn('[Soniox] microphone source was muted externally');
      });

      recording.on('source_unmuted', () => {
        if (recordingRef.current !== recording) return;
        console.warn('[Soniox] microphone source was unmuted');
      });

      recording.on('state_change', ({ old_state, new_state, reason: stateReason }) => {
        if (recordingRef.current !== recording) return;
        console.debug('[Soniox] state', { old_state, new_state, reason: stateReason });
        if (!mountedRef.current) return;

        if (new_state === 'recording') setStatus('listening');
        else if (new_state === 'reconnecting') setStatus('reconnecting');
        else if (new_state === 'starting' || new_state === 'connecting') setStatus('starting');
        else if (new_state === 'paused') setStatus('paused');
        else if (new_state === 'error') {
          setStatus('error');
          releaseCurrentRecording(`state:${new_state}${stateReason ? `:${stateReason}` : ''}`);
        } else if (new_state === 'stopped' || new_state === 'canceled') {
          setStatus('recovering');
          releaseCurrentRecording(`state:${new_state}${stateReason ? `:${stateReason}` : ''}`);
        }
      });

      recording.on('error', (error) => {
        if (recordingRef.current !== recording) return;
        console.warn('[Soniox] listener error; persistent listener will recover', error);
        if (mountedRef.current) setStatus('error');
        releaseCurrentRecording('error-event');
      });

      recording.on('endpoint', () => {
        // Give the final result a brief chance to arrive before clearing this
        // utterance, then start a fresh command window for the next speaker turn.
        window.setTimeout(() => {
          if (!triggeringRef.current) utteranceFinalRef.current = '';
        }, 250);
      });

      recording.on('result', (result) => {
        if (recordingRef.current !== recording || triggeringRef.current) return;

        const tokens = result.tokens || [];
        const reliableFinal = tokens
          .filter((token) => token.is_final && (token.confidence ?? 1) >= 0.5)
          .map((token) => token.text)
          .join('');
        const reliablePartial = tokens
          .filter((token) => !token.is_final && (token.confidence ?? 1) >= 0.7)
          .map((token) => token.text)
          .join('');

        if (reliableFinal) {
          utteranceFinalRef.current = normalizeSpeech(`${utteranceFinalRef.current} ${reliableFinal}`)
            .split(' ')
            .slice(-10)
            .join(' ');
        }

        // Wake can use a high-confidence provisional tail for responsiveness.
        // Stop is deliberately FINAL-TOKEN ONLY so an unstable partial result
        // cannot accidentally terminate an active ElevenLabs conversation.
        const wakeCandidate = normalizeSpeech(`${utteranceFinalRef.current} ${reliablePartial}`);
        const stopCandidate = normalizeSpeech(utteranceFinalRef.current);

        if (conversationActiveRef.current) {
          if (!isFinchStopPhrase(stopCandidate)) return;
          triggeringRef.current = true;
          console.warn('[FINCH END] source=soniox-stop', { transcript: stopCandidate });
          if (mountedRef.current) setStatus('triggered');
          Promise.resolve(onStopRef.current?.(stopCandidate)).finally(clearTriggerSoon);
          return;
        }

        if (!isFinchWakePhrase(wakeCandidate)) return;
        triggeringRef.current = true;
        console.warn('[FINCH BEGIN] source=soniox-wake', { transcript: wakeCandidate });
        if (mountedRef.current) setStatus('triggered');
        Promise.resolve(onWakeRef.current?.(wakeCandidate)).finally(clearTriggerSoon);
      });
    } catch (error) {
      console.warn('[Soniox] could not start listener; persistent listener will retry', error);
      recordingRef.current = null;
      if (mountedRef.current) setStatus('error');
      scheduleRestart('start-failed', 1200);
    }
  }, [clearRestartTimer, clearTriggerSoon, enabled, scheduleRestart]);

  startRef.current = start;

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      intentionalStopRef.current = false;
      const timer = window.setTimeout(() => void start({ reason: 'enabled' }), 250);
      return () => window.clearTimeout(timer);
    }
    void stop();
    return undefined;
  }, [enabled, start, stop]);

  useEffect(() => {
    if (!enabled) return undefined;

    const recoverIfNeeded = (reason, { forceReconnect = false } = {}) => {
      if (!mountedRef.current || intentionalStopRef.current) return;
      const recording = recordingRef.current;
      if (!recording) {
        console.warn('[Soniox] no active recording after lifecycle event; restarting', { reason });
        void startRef.current?.({ reason });
        return;
      }

      const deadStates = new Set(['error', 'stopped', 'canceled']);
      if (deadStates.has(recording.state)) {
        console.warn('[Soniox] stale recording after lifecycle event; replacing', { reason, state: recording.state });
        recordingRef.current = null;
        try { recording.cancel(); } catch (_) {}
        void startRef.current?.({ reason });
        return;
      }

      if (forceReconnect && typeof recording.reconnect === 'function') {
        console.warn('[Soniox] foregrounded; proactively reconnecting persistent listener', { reason, state: recording.state });
        try {
          recording.reconnect();
          if (mountedRef.current) setStatus('reconnecting');
        } catch (error) {
          console.warn('[Soniox] proactive reconnect failed; restarting listener', error);
          if (recordingRef.current === recording) recordingRef.current = null;
          try { recording.cancel(); } catch (_) {}
          scheduleRestart(`foreground-reconnect:${reason}`, 350);
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenFor = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
      hiddenAtRef.current = null;
      recoverIfNeeded('visibility-visible', { forceReconnect: hiddenFor >= FOREGROUND_RECONNECT_MIN_HIDDEN_MS });
    };

    const onPageShow = (event) => {
      recoverIfNeeded(event.persisted ? 'pageshow-bfcache' : 'pageshow', { forceReconnect: Boolean(event.persisted) });
    };

    const onFocus = () => {
      const recording = recordingRef.current;
      if (!recording || ['error', 'stopped', 'canceled'].includes(recording.state)) recoverIfNeeded('window-focus');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, scheduleRestart]);

  useEffect(() => () => {
    mountedRef.current = false;
    intentionalStopRef.current = true;
    clearRestartTimer();
    const recording = recordingRef.current;
    recordingRef.current = null;
    try { recording?.cancel(); } catch (_) {}
  }, [clearRestartTimer]);

  return { status, start, stop };
}
