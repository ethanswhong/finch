let interruptToggle = false;
let blockedRoot = null;
let focusGuardInstalled = false;

function focusGuard(event) {
  if (!blockedRoot) return;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!blockedRoot.contains(target)) return;

  // Safari/VoiceOver may still announce a programmatically focused descendant
  // even after an ancestor becomes aria-hidden. Immediately remove that focus.
  try { target.blur(); } catch (_) {}
}

function installFocusGuard(root) {
  blockedRoot = root;
  if (focusGuardInstalled) return;
  document.addEventListener('focusin', focusGuard, true);
  focusGuardInstalled = true;
}

function removeFocusGuard(root) {
  if (blockedRoot === root) blockedRoot = null;
  if (!focusGuardInstalled) return;
  document.removeEventListener('focusin', focusGuard, true);
  focusGuardInstalled = false;
}

/**
 * Best-effort interruption for screen-reader speech on the web.
 * Web content cannot call VoiceOver's native stop-speaking command, so we:
 * 1) cancel Web Speech API utterances,
 * 2) blur DOM focus,
 * 3) issue a silent assertive accessibility update to cut queued speech.
 */
export function interruptScreenReaderSpeech() {
  try {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  } catch (_) {}

  try {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  } catch (_) {}

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

    interruptToggle = !interruptToggle;
    node.textContent = interruptToggle ? '\u2063' : '\u200B';
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 180);
  } catch (_) {}
}

/**
 * Temporarily removes the app from the accessibility tree while agent audio
 * has priority. This cannot disable iOS VoiceOver globally, but within the web
 * page it is intentionally aggressive: descendants are hidden and any DOM
 * focus that tries to enter the hidden subtree is immediately blurred.
 */
export function setScreenReaderSuppressed(root, suppressed) {
  if (!(root instanceof HTMLElement)) return;

  if (suppressed) {
    interruptScreenReaderSpeech();
    installFocusGuard(root);
    root.setAttribute('aria-hidden', 'true');
    root.dataset.screenReaderSuppressed = 'true';
  } else {
    root.removeAttribute('aria-hidden');
    delete root.dataset.screenReaderSuppressed;
    removeFocusGuard(root);
  }
}
