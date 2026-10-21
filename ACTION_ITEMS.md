# Finch prototype setup checklist

## 1. Environment variables

In `.env.local` for local Vite testing:

```env
VITE_AGENT_MODE=elevenlabs
VITE_ELEVENLABS_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxxxx
VITE_USE_SIGNED_URL=false
SONIOX_API_KEY=your_soniox_key
VITE_SONIOX_WAKE_ENABLED=true
VITE_VOICEOVER_HANDOFF_DELAY_MS=1700
VITE_VOICEOVER_CONTEXT_DELAY_MS=1150
```

`SONIOX_API_KEY` is server-side only. The browser calls `/api/soniox-temp-key` and receives a short-lived transcription key.

The included `vite.config.js` serves that endpoint during `npm run dev`. The included `api/soniox-temp-key.js` provides the same endpoint on Vercel.

Soniox now remains connected while ElevenLabs is active. In browse mode it recognizes wake phrases; during a Finch conversation it ignores wake phrases and only watches for explicit stop phrases such as `stop Finch` / `bye Finch`. This avoids tearing down and recreating the iOS microphone route during the VoiceOver → ElevenLabs handoff.

## 2. Install dependencies

```bash
npm install
```

The project uses `@soniox/client` for the continuous wake/stop listener.

## 3. ElevenLabs client tools

Create these client tools with these exact names and parameter identifiers:

- `openCategory(categoryName: string)` — open the matching category results page from the home screen and keep Finch as the neutral conversational character.
- `focusRestaurant(restaurantId: string)` — move the results list to a restaurant and make that restaurant the conversational character.
- `openRestaurant(restaurantId: string)` — open that restaurant's menu page and make the restaurant the conversational character.
- `focusMenuItem(itemId: string)` — reveal/focus a dish on its restaurant menu and make that dish the conversational character.
- `addCartItem(itemId: string, quantity?: number)`
- `removeCartItem(itemId: string)`
- `setCartItemQuantity(itemId: string, quantity: number)`
- `openCart()`
- `goBack()`

For **every navigation tool** (`openCategory`, `focusRestaurant`, `openRestaurant`, `focusMenuItem`, `openCart`, `goBack`), enable **Block conversation while tool runs / Wait for response**. This is important: the handler now waits for the React page transition, programmatic scroll, context update, and short VoiceOver context announcement before returning.

Also enable the built-in **End Call** system tool as a fallback. Soniox is the primary client-side stop detector for `stop/bye Finch` during the demo.

## 4. First message

Keep First Message Overrides enabled and use:

```text
{{character_intro}}
```

## 5. Test sequence

1. Browse restaurants with VoiceOver. Each restaurant should be one focus stop; it should not announce a banner/region/main ending or the raw `$$` price level.
2. Enter Pizza. With no restaurant focused, Finch should know the shopper is browsing “Pizza restaurants.”
3. Focus a restaurant, then activate the persistent top-right Finch button.
4. During the conversation, say “show me Mountain Mike's” / “open Passione Emporio” / “move to Fiori.” The page should visibly move while the screen remains interaction-locked.
5. On each navigation tool, confirm the top-right control announces the newly active context and the agent then continues in that restaurant/dish personality.
6. End and confirm VoiceOver focus returns to the newly active restaurant/dish.
7. Say `Hey Finch`, plus likely variants such as `Hey Fetch` / `Hi Pinch`.
8. During an ElevenLabs conversation, say `stop Finch`, `bye Finch`, `stop Fetch`, or `bye Pinch`. Soniox should terminate the session consistently.
9. In cart, ask “Who has the highest protein?” and confirm the answer names the item rather than saying an ambiguous bare “me.”
