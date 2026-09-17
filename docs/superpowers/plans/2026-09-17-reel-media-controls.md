# Reel Media Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Put the corner radius on the actual reel video and add a reliable centered Play/Pause toggle for the active reel.

**Architecture:** Keep one native video ref and one `playingReel` index in `ProductPage` for the plain-video branch. The Mux branch uses Video.js v10's store-backed `PlayButton`, while the native branch uses the ref for its centered toggle. The carousel container remains rectangular, and the Video.js skin's default radius is explicitly disabled.

**Tech Stack:** React, TypeScript, Video.js React v10, Embla Carousel, Node source-level tests, Vite.

## Global Constraints

- The outer reel carousel/card has no corner radius.
- The Video.js/Mux player has no default corner radius.
- Plain native video media has a small `rounded-[6px]` radius.
- The active reel displays a large centered Play or Pause button.
- Native/video.js controls remain available after pausing.
- The active player relies on its native `poster` prop rather than an overlay over controls.
- Switching reels resets playback state and dragging does not pause when the interaction starts on a video or button control.

---

### Task 1: Add failing reel-control assertions

**Files:**
- Modify: `client/src/pages/product.test.ts`

**Interfaces:**
- Source-level assertions inspect `client/src/pages/product.tsx`, matching the existing product-page tests.

- [ ] **Step 1: Add assertions for media-only radius and toggle behavior**

Add one test that asserts the product source contains:

```ts
assert.match(productSource, /const \[playingReel, setPlayingReel\] = useState<number \| null>\(null\)/);
assert.match(productSource, /rounded-\[6px\]/);
assert.match(productSource, /aria-label=\{playingReel === i \? `Pause reel \$\{i \+ 1\}` : `Play reel \$\{i \+ 1\}`\}/);
assert.match(productSource, /video\.paused[\s\S]*?video\.pause\(\)/);
assert.match(productSource, /<Pause className/);
assert.match(productSource, /<Play className/);
assert.match(productSource, /closest\("button, video, \[role=button\]"\)/);
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
node --test client/src/pages/product.test.ts
```

Expected: FAIL because the current implementation uses separate playback state, lacks the pause icon/toggle, and applies the radius to the outer container.

### Task 2: Implement reliable rounded media controls

**Files:**
- Modify: `client/src/pages/product.tsx:8,174-177,238-247,1088-1176`

**Interfaces:**
- `playingReel: number | null` identifies the playing active reel.
- `activeReelVideoRef` points to the current native/Mux video element.

- [ ] **Step 1: Replace split playback state with one native playback state**

Import `Pause`, replace `activeReelVideo` and `muxPlayingReel` state with:

```tsx
const [playingReel, setPlayingReel] = useState<number | null>(null);
```

Reset it when `currentReel` changes.

- [ ] **Step 2: Protect video/control taps from drag pause handling**

Keep the Embla `pointerDown` callback event-free, and stop propagation at the active media wrapper, native video, and centered toggle button so taps on playback controls do not trigger carousel drag pause behavior:

```tsx
const pauseReelsDuringDrag = () => {
  activeReelVideoRef.current?.pause();
};

onPointerDown={(event) => event.stopPropagation()}
```

- [ ] **Step 3: Move the radius from the carousel item to the correct media branches**

Use `relative aspect-[9/16] w-full overflow-hidden bg-black` for the outer reel item. Set `[--media-border-radius:0px]` on `VideoSkin` and do not add a radius to the Mux wrapper or Mux media. Add `rounded-[6px]` to the native video and preserve its poster prop.

- [ ] **Step 4: Synchronize both player types**

Set `playingReel(i)` on `onPlay`/`onPlaying` and clear it on `onPause`/`onEnded` for both Mux and native video. Keep `controls` enabled on the native video instead of tying control visibility to playback state. Remove the active poster `<img>` overlays.

- [ ] **Step 5: Use the player-native Mux toggle and add the native centered toggle**

For the active Mux reel, render Video.js's `PlayButton` inside `VideoSkin`; it uses the player's `togglePaused()` store action and updates its icon from player state. For the native reel, render a centered button with an accessible label and `onClick` that toggles the current media:

```tsx
const video = activeReelVideoRef.current;
if (!video) return;
if (video.paused) {
  video.muted = false;
  void video.play();
} else {
  video.pause();
}
```

Render `Pause` while `playingReel === i`, otherwise `Play`.

- [ ] **Step 6: Run the focused product test**

Run:

```bash
node --test client/src/pages/product.test.ts
```

Expected: PASS.

### Task 3: Verify the storefront build and type safety

**Files:**
- No additional files.

- [ ] **Step 1: Run TypeScript validation**

Run:

```bash
npm run check
```

Expected: PASS with exit code 0.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: Vite and server bundling complete successfully.

- [ ] **Step 3: Inspect the focused diff**

Run:

```bash
git diff -- client/src/pages/product.tsx client/src/pages/product.test.ts
```

Confirm the diff is limited to the reel media radius, playback state, pointer handling, and center toggle.
