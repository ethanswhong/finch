# Navigation acknowledgement + cart pricing fix

## Navigation
- Navigation client tools now return a synchronous `NAV_OK:` acknowledgement before React page rerenders.
- UI/page changes are applied in a microtask immediately after the tool acknowledgement.
- Tool handlers no longer send a contextual update from inside the navigation callback; the existing React effect sends the updated context after the new state renders.
- Semantic refs (`viewRef`, `selectedRestaurantIdRef`, result refs, current/active context refs) update immediately so later tool calls do not see the previous page.
- `NAV_ERROR:` is reserved for actual lookup failures.
- Console diagnostics: `[NAV ACK]` means ElevenLabs received an accepted navigation; `[NAV UI]` means the deferred React transition ran.

This is intended to stop the agent from retrying or apologizing after the page has already changed.

## Cart pricing
The cart now shows:
- Subtotal
- Delivery fee (`$0` for prototype orders at or above $20; otherwise `$2.99`)
- Estimated tax (8.75% demo estimate)
- Estimated order total

The same values are included in `APP_CONTEXT.cartPricing` so Finch can answer checkout-cost questions consistently.

## Bundle recommendations
Not added in this version. The current priority is keeping VoiceOver focus, cart item context, and navigation deterministic. Adding a second interactive recommendation carousel would introduce additional focus targets and item-context transitions, so it was intentionally deferred rather than risking the working demo flow.
