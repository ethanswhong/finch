# Initial Finch context fix

The previous build sent the full catalog mainly through `sendContextualUpdate()` after `startSession()`. That is useful for live updates, but it is not the best place to guarantee knowledge for the agent's very first user turn.

This build also passes a compact but complete app catalog as the `initial_app_context` dynamic variable when the ElevenLabs session starts. The system prompt includes `{{initial_app_context}}`, so the LLM receives the Home/results restaurant list and all restaurant/menu IDs before the first turn.

## ElevenLabs Dashboard requirement

Replace the System Prompt with `ELEVENLABS_AGENT_PROMPT.md`. It now contains `{{initial_app_context}}`.

If the dashboard asks for a placeholder/default for `initial_app_context`, set it to `{}`. Runtime conversations from the app replace it with the real JSON context.

The existing `character_intro` dynamic variable remains unchanged.

## Debug log

At session start the browser console should show:

`[CONTEXT BOOTSTRAP] injecting app catalog into ElevenLabs session start`

with non-zero `visibleRestaurants`, `restaurants`, and `menuItems` counts.
