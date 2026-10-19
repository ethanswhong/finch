# Doorbase refinement pass

## What changed

- Horizontal home/deal scrollers are now full-bleed. The section heading keeps the page inset; the first card supplies the starting inset, so the right edge no longer ends in an artificial container padding.
- Home, result, cart, and restaurant headers now share the same 24px horizontal alignment and control sizing.
- Back/share/profile/bell/cart icons were redrawn as consistent SVG line icons closer to the Figma proportions.
- The restaurant detail page uses one fixed toolbar that transitions between hero-overlay and white sticky-header states. The controls do not jump position; only button backgrounds and title/header background transition.
- The restaurant character button now occupies the restaurant-logo position in the hero title block.
- Each restaurant now has 12–14 dummy menu items, grouped into real menu sections.
- 28 local prototype food images were added under `public/images/menu/` so expanded menus do not depend entirely on remote images.
- `What can we help you find?` is functional. Tags include `vegetarian`, `vegan`, `high-protein`, `non-spicy`, `spicy`, and `lighter`; selecting a chip filters the menu data.
- A sticky menu-category bar sits below the transformed detail header and reflects the currently filtered menu sections.
- Deals and review-highlight data are now stored per restaurant in `src/data/dummyData.js`.

## TT Norms Pro

The CSS uses `TT Norms Pro` as the first-choice font. Font files are intentionally not bundled. If you have licensed webfont files, add them under `public/fonts/` and define the matching `@font-face` rules locally.

## Main data file

All restaurant/menu/tag/deal/review dummy data remains centralized in:

`src/data/dummyData.js`

## Images

Prototype menu images are in:

`public/images/menu/`

They were made from the food references provided in the design screenshots and lightly cropped/varied for the dummy prototype.

## VoiceOver / agent audio isolation

When the ElevenLabs agent speaks, the app now enters a voice-priority mode:
- the app subtree is temporarily hidden from the accessibility tree,
- programmatic DOM focus is blocked,
- the ElevenLabs microphone is muted while agent audio is playing,
- accessibility is restored shortly after speech ends,
- the microphone reopens slightly later to avoid capturing queued VoiceOver audio.

This intentionally disables barge-in while the agent is speaking. The tradeoff is deliberate for the prototype: preventing VoiceOver speech from being transcribed as shopper speech is more important than interruption during agent output.
