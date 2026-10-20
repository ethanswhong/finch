# Cart + audio polish test

This branch keeps the non-blocking Finch context/navigation experiment and adds:

- Reviews moved below the full restaurant menu.
- Cart rows split into one accessible product selector plus accessible decrease/increase buttons.
- Focus on either quantity button still sets the corresponding dish as Finch context.
- Cart focus/scroll offsets account for the sticky Finch header.
- Soniox `Hey Finch` -> short upward cue.
- Soniox stop/bye Finch -> short downward cue.
- If ElevenLabs connection takes longer than ~380 ms, a quiet two-note waiting pulse repeats until connected/error/end.
- Audio cues are generated with Web Audio; no media files are required.

Suggested VoiceOver order in a cart row:
1. Product name/details button
2. Decrease <product> quantity button
3. Increase <product> quantity button

The product remains the current Finch context while any of these controls is focused.
