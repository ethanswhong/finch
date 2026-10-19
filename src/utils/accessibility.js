let interruptToggle = false;

/**
 * Best-effort interruption for screen-reader speech on the web.
 * Browsers do not expose a direct VoiceOver "stop speaking" API, so we:
 * 1) cancel any Web Speech API utterance,
 * 2) blur the currently focused DOM control to avoid announcing its changed state,
 * 3) fire a silent assertive live-region update to interrupt the current announcement.
 */
export function interruptScreenReaderSpeech() {
  try {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  } catch (_) {
    // Ignore; this is only a best-effort interruption.
  }

  try {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  } catch (_) {
    // Ignore focus errors.
  }

  try {
    const node = document.createElement('span');
    node.setAttribute('role', 'alert');
    node.setAttribute('aria-live', 'assertive');
    node.setAttribute('aria-atomic', 'true');
    node.style.position = 'fixed';
    node.style.width = '1px';
    node.style.height = '1px';
    node.style.padding = '0';
    node.style.margin = '-1px';
    node.style.overflow = 'hidden';
    node.style.clip = 'rect(0 0 0 0)';
    node.style.whiteSpace = 'nowrap';
    node.style.border = '0';

    // Alternate invisible Unicode characters so repeated activations still
    // produce a real accessibility-tree change without speaking a message.
    interruptToggle = !interruptToggle;
    node.textContent = interruptToggle ? '\u2063' : '\u200B';
    document.body.appendChild(node);

    window.setTimeout(() => node.remove(), 180);
  } catch (_) {
    // Ignore; the interaction should still continue normally.
  }
}
