# Cart + audio context fix

This version starts from the known-good non-blocking navigation build.

## Audio cues
- Shared Web Audio context is unlocked synchronously from pointer/touch/click/keyboard gestures.
- VoiceOver double-taps are covered by touch/click listeners.
- Wake and stop cues are louder.
- Waiting cue stops on ElevenLabs connect/disconnect/error as well as normal completion.
- Console diagnostics use `[FINCH AUDIO]` if Safari still blocks playback.
- Browser limitation: a completely untouched page cannot be forced to autoplay a cue from a pure voice wake on iOS. After any normal app interaction, later Soniox-triggered cues use the already-unlocked context.

## Cart tools
- `addCartItem` now resolves exact IDs, human-readable item names, and current menu context.
- Neutral Finch and restaurant agents receive `visibleMenuItems` (id/name/restaurant) so they can add a named dish even when `currentItem` is null.
- Ambiguous duplicated names are not guessed across restaurants.
- Tool result markers: `CART_SUCCESS`, `ITEM_NOT_FOUND`, `ITEM_AMBIGUOUS`.
- Prompt instructs the agent to retry once with the correct ID if resolution fails.
