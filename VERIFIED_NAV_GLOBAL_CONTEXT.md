# Verified navigation + global Finch context

This version keeps the current cart layout/pairings unchanged and changes only app knowledge + navigation/focus behavior.

## Global Finch
- `restaurantDirectory` now contains every restaurant and every menu item, not an 8-item preview.
- The complete context is sent immediately after `startSession()` and retried shortly after connection, so the first neutral-Finch turn on Home has catalog knowledge.

## Navigation
- Navigation client tools no longer return success before React renders.
- Each tool repeatedly applies/checks the **same requested destination**.
- Success is `NAV_OK: VERIFIED.` only when the exact DOM target exists.
- `NAV_TIMEOUT:` never opens another restaurant/dish. The prompt allows at most one agent-level retry of the exact same target, preventing loops.
- Restaurant and dish tool arguments are forgiving if ElevenLabs passes a unique name instead of the exact ID.

## VoiceOver focus
- The page is no longer made `inert` or `aria-hidden` during conversation; those attributes prevented iOS VoiceOver/programmatic focus from following the destination.
- The visual scrim and capture guards still block activation of page controls while the voice session is active.
- Once a navigation target is verified, the client scrolls to it and calls `.focus()` on that exact target.

## Debug logs
Look for: `[NAV START]`, `[NAV APPLY]`, `[NAV CHECK]`, `[NAV VERIFIED]`, `[NAV FOCUS]`, `[NAV TIMEOUT]`, and `[CONTEXT]`.
