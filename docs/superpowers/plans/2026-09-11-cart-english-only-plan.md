# Cart English-Only Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Bengali copy from the cart drawer everywhere and keep Continue Shopping readable on mobile.

**Architecture:** Keep the existing `CartInnerContent` component and all handlers unchanged. Edit only its visible copy and add a Tailwind no-wrap class to the two Continue Shopping actions. Add a Node source-level regression test following the existing test style in `client/src/components`.

**Tech Stack:** React, TypeScript, Tailwind CSS, Node test runner via `tsx`.

## Global Constraints

- Cart behavior and event handlers must remain unchanged.
- Bengali copy must be absent from the cart drawer in both desktop and mobile render paths.
- Continue Shopping must remain on one line at narrow mobile widths and render as an underline-only text action rather than a default bordered button.
- Do not change the mobile bottom dock cart icon size.

---

### Task 1: Make cart drawer copy English-only

**Files:**
- Create: `client/src/components/cart-drawer.test.ts`
- Modify: `client/src/components/cart-drawer.tsx:44-210`

**Interfaces:**
- Consumes: Existing `CartInnerContent` props and cart handlers.
- Produces: The same cart drawer UI and interactions with English-only labels.

- [ ] **Step 1: Write the failing regression test**

Create a source-level test that reads `cart-drawer.tsx` and asserts that Bengali Unicode text is absent, the English cart labels remain, and both Continue Shopping actions include `whitespace-nowrap`.

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const cartDrawerSource = readFileSync(new URL("./cart-drawer.tsx", import.meta.url), "utf8");

test("keeps the cart drawer English-only", () => {
  assert.doesNotMatch(cartDrawerSource, /[\u0980-\u09FF]/);
  assert.match(cartDrawerSource, /Your Cart/);
  assert.match(cartDrawerSource, /Your cart is empty/);
  assert.match(cartDrawerSource, /Proceed to Checkout/);
});

test("keeps both Continue Shopping actions on one line", () => {
  assert.equal((cartDrawerSource.match(/Continue Shopping/g) ?? []).length, 2);
  assert.equal((cartDrawerSource.match(/whitespace-nowrap/g) ?? []).length, 2);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx tsx --test client/src/components/cart-drawer.test.ts`

Expected: FAIL because the current cart drawer still contains Bengali text and its Continue Shopping controls do not use `whitespace-nowrap`.

- [ ] **Step 3: Remove Bengali cart copy and fix Continue Shopping styling**

In `CartInnerContent`, remove the Bengali spans from the header, item count, empty state, discovery message, size label, remove action, subtotal label, shipping note, checkout action, and both Continue Shopping actions. Add `whitespace-nowrap` to both Continue Shopping controls while preserving their existing handlers. Set the empty-state `Button` to `variant="ghost"` with `rounded-none border-0 border-b border-black` so the shared default button border and radius do not render a box around the action.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npx tsx --test client/src/components/cart-drawer.test.ts`

Expected: PASS with both tests passing.

- [ ] **Step 5: Run project verification**

Run: `npm run check && npm run build && git diff --check`

Expected: TypeScript check, production build, and whitespace validation all pass.

- [ ] **Step 6: Commit the implementation**

```bash
git add client/src/components/cart-drawer.tsx client/src/components/cart-drawer.test.ts
git commit -m "fix: make cart drawer English-only"
```
