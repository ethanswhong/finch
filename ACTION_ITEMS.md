- Set the ElevenLabs agent **First message** to exactly `{{character_intro}}`. Do not leave it blank.

# Doorbase — Immediate Action Items

## Tonight: get the UI running

- [ ] Download/unzip the project.
- [ ] Run `npm install`.
- [ ] Run `cp .env.example .env.local`.
- [ ] Keep `VITE_AGENT_MODE=demo` first.
- [ ] Run `npm run dev -- --host`.
- [ ] Open the network URL on iPhone Safari.
- [ ] Turn on VoiceOver and verify categories, restaurant summaries, character buttons, menu buttons, cart quantities, and the Talk to my cart button. In demo mode, character buttons should only speak an introduction; no chat panel should appear.

## Then: add ElevenLabs

- [ ] Create an ElevenLabs account.
- [ ] Create one ElevenAgent in English.
- [ ] Paste `ELEVENLABS_AGENT_PROMPT.md` into its System Prompt.
- [ ] Add the seven Client Tools from `README.md` with exact names and parameters.
- [ ] For the fastest prototype, temporarily allow the agent to start publicly using its Agent ID.
- [ ] Put the Agent ID in `.env.local` and set `VITE_AGENT_MODE=elevenlabs`.
- [ ] Restart Vite and test microphone permission + live conversation: tap a character once, speak naturally for several turns, then tap the active character button again to end. There should be no text/chat UI.

## Only after one voice works

- [ ] Add optional multi-voice labels: `warm`, `bright`, `bold`, `calm`.
- [ ] Test Fiori vs Diavola and restaurant-to-restaurant switching.
- [ ] Test cart commands: compare, remove, add, change quantity.

## Deploy for participants

- [ ] Run `npx vercel` or push to GitHub and import in Vercel.
- [ ] Start with the public-agent setup if time is tight.
- [ ] If you want the safer private setup, add `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` server-side in Vercel and set `VITE_USE_SIGNED_URL=true`.
- [ ] Test the deployed HTTPS URL on iPhone Safari before sending it to participants.

## Do not build before the first test

- [ ] No login.
- [ ] No checkout/payment backend.
- [ ] No real DoorDash data.
- [ ] No creator/Story Studio implementation yet.
- [ ] No separate agent per dish.

## After the restaurant-handoff update

1. Replace the ElevenLabs System Prompt with the latest `ELEVENLABS_AGENT_PROMPT.md`.
2. Update the `openRestaurant` client tool description to: `Open the restaurant detail page and menu when the shopper asks to enter the restaurant, view its menu, hear what it serves, or get menu recommendations from the restaurant character.`
3. Update the `focusRestaurant` description to: `Move the active conversation to another restaurant after the shopper explicitly agrees to the recommendation. This may be called from any current character.`
4. Restart the Vite dev server and test these exact flows:
   - Activate a restaurant and stay silent → it should introduce itself first.
   - Ask: “Can you introduce your menu?” → it should call `openRestaurant` and move to the restaurant detail page before describing dishes.
   - Activate Fiori and ask: “Are there any other restaurants that might fit me better?” → it should use `restaurantDirectory`, suggest an option, ask permission, and call `focusRestaurant` only after you say yes.

## VoiceOver handoff / blocking client tools

For the modal VoiceOver conversation flow, set these ElevenLabs client tools to **Block conversation while tool runs** in the ElevenLabs dashboard:

- `focusRestaurant`
- `focusMenuItem`

Why: the browser handler intentionally waits `VITE_VOICEOVER_HANDOFF_DELAY_MS` while VoiceOver announces the new active character. Blocking prevents the agent from taking its next spoken turn before that handoff finishes. The microphone is temporarily muted during this in-session handoff so VoiceOver speech is not transcribed as user speech.

Environment controls:

- `VITE_VOICEOVER_HANDOFF_DELAY_MS=2400` — tune the handoff delay in milliseconds.
- `VITE_SCREEN_READER_LOCK=auto` — `auto` uses an assistive/keyboard-style click heuristic; use `on` for guaranteed VoiceOver testing or `off` for a sighted-only demo.
- `VITE_ELEVENLABS_SPEED=1.0` — optional independent agent speed override (0.7–1.2); requires the ElevenLabs Speed override to be enabled under agent Security settings.
