# Reel Media Controls Design

## Goal

Make the product reel video itself rounded and make play/pause reliable for both the Mux player and the native-video fallback.

## Behavior

- The outer reel carousel/card has no corner radius.
- The Video.js/Mux player has no inherited default corner radius.
- Plain native reels keep the existing small media corner radius.
- The active reel displays a large centered Play or Pause button.
- Tapping the centered button toggles the active video between playing and paused.
- Native/video.js controls remain available after pausing and continue to work independently.
- The poster is supplied by the player rather than an overlay that can cover controls.
- Switching reels resets the playback state and pauses native-video playback while dragging, except when the interaction starts on a video or button control.

## Implementation

Update `client/src/pages/product.tsx`:

- Track native reel playback with one `playingReel` state value.
- Use Video.js's store-backed `PlayButton` for the Mux player so its toggle stays synchronized with the Video.js UI and Mux media adapter.
- Use the native media ref only for the plain `<video>` center toggle.
- Override Video.js's `--media-border-radius` variable to remove its default `28px` skin radius.
- Keep the radius on plain native media rather than the carousel item.
- Remove the extra poster overlays for the active player and leave the player’s poster handling in charge.
- Ignore carousel pause-on-pointer-down for buttons and video controls.

## Testing

- Add source-level assertions for media-only radius, the centered toggle button, native play/pause calls, and protected control pointer handling.
- Run the focused product tests, TypeScript check, and production build.
