# Product Reel Playback Flick Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the startup flick from the Glass Water Bottles product reels while preserving the existing Mux player UI, and remove only that product’s reel corner radius.

**Architecture:** Keep the existing `VideoPlayer`, `VideoSkin`, `MuxVideo`, controls, and carousel unchanged. Add a non-interactive poster layer for the Glass Water Bottles reels that remains visible until the media emits `playing`, so the player’s internal poster transition cannot expose a transient black frame. Make the reel wrapper radius conditional on the same product flag.

**Tech Stack:** React, TypeScript, Video.js React v10, Mux HLS, Tailwind CSS, Node test runner.

## Global Constraints

- Preserve the existing product-page layout, carousel behavior, player controls, and player styling.
- Apply the playback transition fix only to the Glass Water Bottles With Time Marker Mux reels.
- Remove the corner radius only from the Glass Water Bottles reel video containers; retain it for other product reels.
- Do not add autoplay, replace the player, or alter checkout/product behavior.

---

### Task 1: Add regression coverage for stable Mux poster handoff and radius scope

**Files:**
- Modify: `client/src/pages/product.test.ts:170-191`
- Test: `client/src/pages/product.test.ts`

**Interfaces:**
- Consumes: the existing source-level assertions for the product reel implementation.
- Produces: assertions that require the Glass Water Bottles poster hold to end on `onPlaying`, and require the wrapper radius to be conditional on `isGlassWaterBottleMuxProduct`.

- [ ] **Step 1: Write the failing assertions**

Extend the existing Mux reel test with assertions for:

```ts
assert.match(productSource, /const \[muxPlayingReel, setMuxPlayingReel\] = useState<number \| null>\(null\)/);
assert.match(productSource, /onPlaying=\{\(\) => setMuxPlayingReel\(i\)\}/);
assert.match(productSource, /muxPlayingReel !== i/);
assert.match(productSource, /isGlassWaterBottleMuxProduct \? "bg-black" : "rounded-\[6px\] bg-black"/);
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm test -- --runInBand client/src/pages/product.test.ts
```

Expected: FAIL because the new state, `onPlaying` handler, poster guard, and conditional wrapper class do not exist yet.

### Task 2: Implement the Glass Water Bottles reel transition fix

**Files:**
- Modify: `client/src/pages/product.tsx:154-175,1081-1162`

**Interfaces:**
- Consumes: `isGlassWaterBottleMuxProduct`, the existing `poster`, `currentReel`, `VideoPlayer`, `VideoSkin`, and `MuxVideo` flow.
- Produces: a stable `muxPlayingReel` state and a product-scoped poster handoff that does not intercept pointer input.

- [ ] **Step 1: Add the minimal playback state**

Add beside the existing reel playback state:

```tsx
const [muxPlayingReel, setMuxPlayingReel] = useState<number | null>(null);
```

Reset it when the active Mux reel changes so the newly selected reel starts with its poster layer visible:

```tsx
useEffect(() => {
  if (isGlassWaterBottleMuxProduct) setMuxPlayingReel(null);
}, [currentReel, isGlassWaterBottleMuxProduct]);
```

- [ ] **Step 2: Hold the poster until the first rendered playback frame**

On the existing `MuxVideo`, add:

```tsx
onPlaying={() => setMuxPlayingReel(i)}
```

After the existing `VideoPlayer` branch, render an image using the same `poster` URL while `muxPlayingReel !== i`:

```tsx
{muxPlayingReel !== i ? (
  <img
    src={poster}
    alt=""
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-10 h-full w-full object-cover"
  />
) : null}
```

The layer is pointer-transparent, so the packaged player’s controls remain fully interactive. It disappears on `playing`, not merely `play`, which avoids exposing the transient frame before playback has produced visible media.

- [ ] **Step 3: Scope the radius removal**

Change the reel video wrapper from a fixed radius to:

```tsx
className={`relative aspect-[9/16] w-full overflow-hidden ${
  isGlassWaterBottleMuxProduct ? "bg-black" : "rounded-[6px] bg-black"
}`}
```

Do not change the native Cloudinary reel branch or any other rounded controls.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
npm test -- --runInBand client/src/pages/product.test.ts
```

Expected: PASS.

### Task 3: Run storefront verification

**Files:**
- No additional files.

- [ ] **Step 1: Run the full test suite**

Run:

```bash
npm test
```

Expected: PASS with no new failures.

- [ ] **Step 2: Type-check the storefront**

Run:

```bash
npm run check
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Build the storefront**

Run:

```bash
npm run build
```

Expected: PASS and produce the normal `dist/` output.
