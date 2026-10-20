# Safe patch notes

This version was rebuilt directly from the last known-good `nonblocking-context-test` version.

The following Finch navigation code was intentionally left byte-for-byte unchanged from that working base:
- `getContextTarget` / `scrollToContext`
- `focusRestaurant`
- `openRestaurant`
- `focusMenuItem`
- `openCart`
- `goBack`
- `startConversation`
- `useConversation` callbacks/configuration

Only these additions were reapplied:
- Reviews moved below the menu.
- Cart row remains the original focus target; accessible `-` / `+` controls were added as children. Focusing either quantity control preserves that dish as Finch context.
- Cart top spacing adjusted below the persistent header.
- Soniox wake/end audio cues and a delayed waiting pulse were added only around the wake callback, not around ElevenLabs navigation or client-tool completion.
