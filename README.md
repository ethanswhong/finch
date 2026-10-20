# Doorbase — Narrative Shopping Prototype

A mobile-first React/Vite food-delivery prototype for testing **narrative shopping with blind / VoiceOver users**.

The prototype is intentionally dummy-only: all restaurant and menu data lives in one editable file, `src/data/dummyData.js`.

## What is implemented

- DoorDash-like mobile home screen with 22 food categories shown as a wrapping grid, not a horizontal carousel.
- Home recommendation sections: National favorites, Most popular local restaurants, Deals for you.
- Search/category results with restaurant name, rating, distance, ETA, feature, and price level grouped for screen-reader use.
- Character button on restaurant images.
- Character face overlay with multiple expressions and speaking animation.
- Restaurant-level **voice-only** narrative conversation: tap a character button once to start a continuous microphone conversation, and tap that same active character button again to end it. No chat box or transcript panel is shown.
- Restaurant menu with character button on every dish and a separate Add button.
- Cart count, quantities, totals, and a `Talk to my cart` mode.
- Cart agent tools for add/remove/change quantity.
- Agent-assisted restaurant/menu focus changes so VoiceOver focus can move with the conversation.
- Demo mode that works immediately with browser speech synthesis for character introductions. Continuous back-and-forth voice conversation requires ElevenLabs mode.
- Optional ElevenLabs live conversational-agent mode.
- Optional Vercel signed-URL backend for keeping the ElevenLabs API key off the client.

## 1. Run it immediately in demo mode

```bash
npm install
cp .env.example .env.local
npm run dev
```

Keep this in `.env.local`:

```env
VITE_AGENT_MODE=demo
VITE_USE_SIGNED_URL=false
```

Open the local URL on your Mac first. For iPhone testing on the same Wi-Fi network, run:

```bash
npm run dev -- --host
```

Then open the network URL shown by Vite on the iPhone in Safari.

Demo mode gives you the complete UI, character animation, VoiceOver structure, and scripted character introductions. There is intentionally no typed chat interface. Continuous spoken back-and-forth begins once ElevenLabs is configured.

---


## Voice interaction model

The prototype is intentionally **voice-only once a character is activated**:

1. Tap a restaurant, dish, or cart character button.
2. The browser requests microphone access if needed.
3. The character introduces itself aloud.
4. Keep speaking naturally; the ElevenLabs agent remains connected and listens between turns.
5. The page does **not** open a chat drawer, text field, or transcript.
6. Tap the currently active character button again to end the voice session.
7. If the agent moves you to another restaurant or dish with a client tool, the same live session continues with the new character/context.

The active character button gets a subtle pulse while listening, and the face overlay animates its mouth while the agent is speaking.

# 2. ElevenLabs setup — action items

## A. Create the agent

1. Create / sign into an ElevenLabs account.
2. Open **ElevenAgents** and create one conversational agent.
3. Set the language to English.
4. Choose one default voice for now. Do not spend time tuning multiple voices until the basic conversation works.
5. Paste the contents of `ELEVENLABS_AGENT_PROMPT.md` into the agent's System Prompt.
6. Make sure `@elevenlabs/react` is current (`npm install @elevenlabs/react@latest`). ElevenLabs fixed an iOS Safari first-message audio issue in React SDK 1.6.3; this project now requests a newer 1.x release.
7. In **First message**, enter exactly `{{character_intro}}`. When ElevenLabs prompts you to create/set that dynamic variable, use any short placeholder such as `Hi, I'm ready to help.` The React app passes the real restaurant/dish/cart introduction at runtime, so the selected character speaks first automatically.

## B. Create these Client Tools in ElevenLabs

The names are case-sensitive and must match exactly.

### `focusRestaurant`
Purpose: Move VoiceOver/browser focus to a recommended restaurant after the shopper explicitly agrees.

Parameter:
- `restaurantId` — string, required. Exact restaurant ID from APP_CONTEXT.

Recommended description:
> Use only after the shopper explicitly agrees to move to a restaurant you recommended. Pass the exact restaurant id from APP_CONTEXT.

Enable **Wait for response**.

### `openRestaurant`
Parameter:
- `restaurantId` — string, required.

Description:
> Open a restaurant menu when the shopper asks to enter/open that restaurant.

Enable **Wait for response**.

### `focusMenuItem`
Parameter:
- `itemId` — string, required.

Description:
> Move focus to another menu item when the shopper asks to hear from that dish.

Enable **Wait for response**.

### `addCartItem`
Parameters:
- `itemId` — string, required.
- `quantity` — number, optional; default 1.

Description:
> Add a menu item only when the shopper explicitly asks to add it.

Enable **Wait for response**.

### `removeCartItem`
Parameter:
- `itemId` — string, required.

Description:
> Remove an item when the shopper explicitly asks to remove it.

Enable **Wait for response**.

### `setCartItemQuantity`
Parameters:
- `itemId` — string, required.
- `quantity` — number, required.

Description:
> Change an item's cart quantity when the shopper explicitly requests an exact quantity.

Enable **Wait for response**.

### `openCart`
No parameters.

Description:
> Open the cart when the shopper asks to go to or review the cart.

Enable **Wait for response**.

## C. Fastest local AI test: public agent

For tomorrow's prototype test, the quickest route is to temporarily allow the agent to be started using its Agent ID.

Add to `.env.local`:

```env
VITE_AGENT_MODE=elevenlabs
VITE_ELEVENLABS_AGENT_ID=agent_your_id_here
VITE_USE_SIGNED_URL=false
```

Restart Vite after changing environment variables.

The character button is the user gesture that requests microphone permission and starts the ElevenLabs session.

**Do not put an ElevenLabs API key into any `VITE_...` variable.** Vite browser variables are public.

---

# 3. Optional: different voices for different characters

Do this only after the single-voice version works.

ElevenLabs Agents supports multi-voice conversations. Configure a few reusable labels rather than one voice per dish:

- `warm`
- `bright`
- `bold`
- `calm`

The dummy data already assigns one of those labels to restaurants and menu items.

Update the ElevenLabs prompt/instructions so character speech uses the appropriate configured voice label. One agent can therefore portray multiple restaurant/menu characters without creating dozens of agents.

For a one-day prototype, 3–4 reusable voices are enough.

---

# 4. Deploy to Vercel

## Quick public-agent deployment

1. Push this folder to GitHub, or run Vercel directly from the project folder.
2. Deploy:

```bash
npx vercel
```

3. In Vercel project settings → Environment Variables, add:

```text
VITE_AGENT_MODE=elevenlabs
VITE_ELEVENLABS_AGENT_ID=agent_your_id_here
VITE_USE_SIGNED_URL=false
```

4. Redeploy.
5. Open the HTTPS Vercel URL in iPhone Safari. HTTPS is important for microphone permission.

## Safer private-agent deployment

The project already contains `api/elevenlabs-signed-url.js`.

In Vercel add:

```text
VITE_AGENT_MODE=elevenlabs
VITE_ELEVENLABS_AGENT_ID=agent_your_id_here
VITE_USE_SIGNED_URL=true
ELEVENLABS_AGENT_ID=agent_your_id_here
ELEVENLABS_API_KEY=your_secret_key
```

Only `ELEVENLABS_API_KEY` is secret. Never prefix it with `VITE_`.

The browser asks the Vercel function for a short-lived signed URL; the secret key stays server-side.

For local testing of this signed endpoint, use `npx vercel dev` rather than plain `vite`.

---

# 5. Edit all dummy data in one place

Open:

```text
src/data/dummyData.js
```

Each restaurant contains:

```js
{
  id,
  name,
  categories,
  rating,
  reviews,
  distance,
  eta,
  feature,
  image,
  imageAlt,
  summary,
  character: {
    personality,
    expression,
    intro
  },
  menu: [...]
}
```

Each dish additionally has:

```js
{
  ingredients,
  tags,
  healthScore
}
```

`healthScore` is deliberately a dummy prototype comparison score. Do not present it as real nutritional or medical information in testing.

---

# 6. Character visual design

The face is implemented in pure CSS in `src/styles.css` and `CharacterFace.jsx`.

Current expressions:

```text
friendly
bold
calm
playful
```

Change per-character expression in `dummyData.js`.

The speaking mouth animation automatically activates while the ElevenLabs agent is speaking.

If you want to visually redesign the face, the relevant CSS selectors are:

```css
.character-face
.brow
.eye
.nose
.mouth
.expression-bold
.expression-calm
.expression-playful
```

---

# 7. iPhone + VoiceOver test checklist

Use **Safari on iPhone**, with VoiceOver enabled.

Test this exact journey before recruiting participants:

1. Navigate categories without horizontal swiping.
2. Search `Pizza`.
3. Confirm each restaurant is announced as one useful summary: name → rating → distance → ETA → feature.
4. Find the character button. It should announce `Introduce [restaurant] and start a voice conversation`.
5. Start Passione Emporio and let it introduce itself.
6. Ask it whether another restaurant might fit a specific preference better.
7. Say yes to a recommendation and confirm focus moves to the recommended restaurant.
8. Open Passione Emporio → start Fiori → ask `Are you lighter than Diavola?`
9. Add Fiori and Diavola to the cart.
10. Open cart → `Talk to my cart`.
11. Ask: `I only want to keep one. Which one is lighter?`
12. Ask the agent to remove one item and confirm the UI actually changes.
13. Interrupt / say `shorter` and see whether the conversation becomes concise.
14. End the conversation from the same character control / Voice Panel End button.

## Important VoiceOver issue to watch

There are two audio systems in the prototype:

- VoiceOver reading interface semantics.
- ElevenLabs speaking the character.

Listen specifically for moments where they talk over each other. This is a valuable research finding, not just a bug. The prototype intentionally avoids announcing AI transcript text through an ARIA live region to reduce double-speaking.

---

# 8. What I would NOT build before the first user test

Do not spend tomorrow on:

- login/accounts
- payment or checkout backend
- real DoorDash data
- delivery tracking
- dozens of restaurants
- a separate AI agent per food
- production nutrition/allergen data
- the creator / Story Studio implementation
- perfect visual animation

For the competition, implement the shopper experience and mock the creator tool in Figma.

The valuable test is whether **character + conversation + comparison** makes shopping more understandable, enjoyable, or controllable for VoiceOver users.

## Voice handoff behavior (updated)

- Every voice session receives a compact `restaurantDirectory` containing all dummy restaurants, so a dish character can recommend and hand off to another restaurant instead of being limited to the current screen.
- If a restaurant character is asked to introduce or recommend items from its menu while the shopper is still on a list/home screen, the agent should call `openRestaurant` first. Update the ElevenLabs `openRestaurant` tool description to: `Open the restaurant detail page and menu when the shopper asks to enter the restaurant, view its menu, hear what it serves, or get menu recommendations from the restaurant character.`
- `focusRestaurant` can be called from restaurant, dish, or cart characters after the shopper explicitly agrees to switch. Suggested description: `Move the active conversation to another restaurant after the shopper explicitly agrees to the recommendation. This may be called from any current character.`
- The first character introduction uses ElevenLabs' **First message + dynamic variable** mechanism. Set the dashboard First message to `{{character_intro}}`; the app passes the selected character's intro through `dynamicVariables` when starting the session. This is more reliable than trying to inject a synthetic user turn immediately after connection.

After changing `ELEVENLABS_AGENT_PROMPT.md`, paste the updated prompt into the ElevenLabs dashboard and save/publish the agent.

## Visual polish / TT Norms Pro

The UI has been restyled around the supplied mobile references: a white DoorDash-like home header, four-column category grid, section skip/view-all controls, a blurred bottom search dock, and a full-bleed restaurant hero with sticky menu navigation, Deals & benefits, Reviews, discovery filters, and category sections.

`src/styles.css` uses `TT Norms Pro` as the first font-family. The font files are not bundled. For iPhone/Vercel use, place your own licensed WOFF2 files under `public/fonts/` and add the corresponding `@font-face` rules. See `public/fonts/README.txt`.

## Screen-reader conversation mode

The prototype now treats a VoiceOver-style activation as a focused conversation mode. On activation, the character control changes to “Conversing with [name]. Select again to end conversation.” and the app waits before creating the ElevenLabs microphone/audio connection. During the conversation the background accessibility tree, touch interaction, and scrolling are blocked; only the conversation control and (off the home screen) a Back control remain operable. Back ends the session before navigating.

The handoff delay is controlled by `VITE_VOICEOVER_HANDOFF_DELAY_MS`. `VITE_SCREEN_READER_LOCK=auto` uses click activation modality as a heuristic because browsers do not expose a reliable “VoiceOver is running” API to web pages. For deterministic testing, set it to `on`; for a sighted-only run, set it to `off`.

If the agent changes the active restaurant or menu item through `focusRestaurant` or `focusMenuItem`, configure those client tools as **blocking** in the ElevenLabs dashboard. The handler temporarily mutes the mic, moves the active control, waits for the VoiceOver handoff, then returns control to the agent.
