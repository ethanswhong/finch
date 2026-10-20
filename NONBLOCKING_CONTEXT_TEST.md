# Non-blocking context experiment

This build intentionally removes navigation-status waiting from the ElevenLabs client tools.

- Semantic restaurant/dish/cart context updates immediately.
- Client tools return immediately after dispatching React state/context changes.
- Smooth scrolling happens asynchronously and is not treated as agent state.
- The agent no longer waits for DOM target discovery, scroll settling, Finch-button focus, or a VoiceOver context delay before continuing.
- Focus is still restored to the latest semantic context when the conversation ends.

This is meant to compare responsiveness against the prior status-tracking build.
