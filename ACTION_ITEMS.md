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
VITE_AUDIO_HANDOFF_DELAY_MS=160
```

`SONIOX_API_KEY` is server-side only. The browser calls `/api/soniox-temp-key` and receives a short-lived transcription key.

The included `vite.config.js` serves that endpoint during `npm run dev`. The included `api/soniox-temp-key.js` provides the same endpoint on Vercel.

## 2. Install dependencies

```bash
npm install
```

The project now uses `@soniox/client` for the idle wake-phrase listener.

## 3. ElevenLabs client tools

Create these client tools with these exact names:

- `focusRestaurant`
- `openRestaurant`
- `focusMenuItem`
- `addCartItem`
- `removeCartItem`
- `setCartItemQuantity`
- `openCart`
- `goBack`

For navigation tools (`focusRestaurant`, `openRestaurant`, `focusMenuItem`, `openCart`, `goBack`), enable **Block conversation while tool runs** so the page transition/scroll completes before the agent continues.

Also enable the built-in **End Call** system tool.

## 4. First message

Keep First Message Overrides enabled and use:

```text
{{character_intro}}
```

## 5. Test sequence

1. Browse restaurants with VoiceOver: each restaurant should be one focus stop.
2. Focus a restaurant, then activate the persistent top-right Finch button.
3. End and confirm focus returns to that restaurant card.
4. Say "Hey Finch" while a restaurant or dish is focused.
5. During a conversation, ask Finch to move to another restaurant/dish. The page should animate there while all touch/UI interaction stays locked except the Finch end button.
6. End and confirm focus lands on the newly active restaurant/dish.
7. In cart, ask "Who has the highest protein?" and confirm the answer names the item (for example, "Fiori...") rather than saying an ambiguous "me."
8. Say "bye Finch", "stop Finch", and likely STT variants such as "stop Fetch" / "bye Pinch" and confirm the client fallback ends the session.
