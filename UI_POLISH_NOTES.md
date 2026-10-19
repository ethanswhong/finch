# UI polish pass

Implemented from the supplied mobile references/screenshots:

- TT Norms Pro-first typography stack (font files intentionally not bundled)
- White home chrome with location, profile, notifications, and cart controls
- Four-column, fully visible category grid for easier VoiceOver navigation
- DoorDash cuisine icon CDN assets with emoji fallback
- Section controls: down arrow = skip to next section; right arrow = view all
- Horizontal restaurant strips with full-card VoiceOver summaries
- Fixed bottom search dock with corrected search icon, padding, gradient fade, and backdrop blur
- Restaurant detail page rebuilt around a full-bleed hero image
- Hero overlay actions: back, favorite, share, more
- Restaurant narrative-character button retained on the hero
- Sticky restaurant header/category navigation
- Delivery/Pickup service card and group-order control
- Deals & benefits section
- "What can we help you find?" filter chips
- Reviews / review-highlight section
- Menu organized into sticky-nav-targeted sections (Featured / More / Dessert where available)
- Existing ElevenLabs and VoiceOver interaction behavior preserved

Primary files changed:
- `src/App.jsx`
- `src/styles.css`
- `src/data/dummyData.js`
- `src/components/RestaurantCard.jsx`
- `src/components/MenuCard.jsx`
- `src/components/Icon.jsx` (new)

## Refinement pass (Oct 17 — detail)

- Horizontal carousels are full bleed. Section headings keep the page inset; the scroller itself has no outer left/right padding, and only the first card/chip owns the initial inset.
- Home, list, and restaurant-detail header controls now share the same 44px geometry and 24px page inset. Back/profile/bell/cart icon paths were refined to better match the supplied Figma proportions.
- Restaurant detail uses one fixed toolbar that morphs from circular controls over the hero into the white sticky title bar. The hero title fades as the sticky title appears, avoiding two visible title bars.
- Restaurant narrative entry uses the agent glyph in the avatar slot.
- Each restaurant now contains 16–18 dummy menu items. Additional local image variants were added under `public/images/menu/variant-*.jpg` so expanded menus remain self-contained for testing.
- `What can we help you find?` is backed by menu tags. Current filters include Featured, Vegetarian, High protein, Non-spicy, Lighter, Vegan, Spicy, Shareable, and Dessert. Filtering changes the actual menu sections shown below.

### TT Norms Pro
The CSS still prioritizes `TT Norms Pro`. Font files are intentionally not bundled. Put your licensed webfont files in `public/fonts/` and define/enable the matching `@font-face` declarations locally.
