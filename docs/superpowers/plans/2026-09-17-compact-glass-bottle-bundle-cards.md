# Compact Glass Bottle Bundle Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the two Glass Water Bottle bundle cards shorter and more modern without changing pricing, checkout, or other product pages.

**Architecture:** Keep the existing product-specific JSX branch in `client/src/pages/product.tsx`. Apply compact Tailwind classes inline to the existing buttons and their child spans; do not create a shared component or alter bundle state logic.

**Tech Stack:** React, TypeScript, Tailwind CSS, Node source-text tests, Vite.

## Global Constraints

- Change only the branch guarded by `isGlassWaterBottleMuxProduct`.
- Preserve the existing `quantity` state, tier pricing, savings calculation, and checkout behavior.
- Keep the two-column layout and the `aria-pressed` selection state.
- Use the existing red accent and white card styling; do not add dependencies.
- Keep unrelated local changes unstaged and untouched.

---

### Task 1: Add focused compact-card assertions

**Files:**
- Modify: `client/src/pages/product.test.ts:170-186`

**Interfaces:**
- Consumes: The existing `productSource` source-text fixture and Glass Water Bottle branch.
- Produces: Assertions that document compact padding, card spacing, price hierarchy, and compact savings badge classes.

- [ ] **Step 1: Add assertions that initially fail**

Extend the existing Glass Water Bottle test with exact source matches for the intended compact classes, including:

```ts
assert.match(productSource, /grid grid-cols-2 gap-2/);
assert.match(productSource, /gap-0\.5 rounded-\[10px\] border-2 px-3 py-2\.5/);
assert.match(productSource, /-top-2 right-1 rounded-full bg-\[#d92c2d\] px-1\.5 py-0\.5 text-\[8px\]/);
assert.match(productSource, /text-\[12px\] font-semibold/);
assert.match(productSource, /text-\[18px\] font-bold/);
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node --test client/src/pages/product.test.ts`

Expected: the existing tests pass, but the new compact-card assertions fail because the current classes still use `gap-3`, `px-4 py-4`, and the larger badge classes.

### Task 2: Implement compact premium card styling inline

**Files:**
- Modify: `client/src/pages/product.tsx:717-755`

**Interfaces:**
- Consumes: Existing `GLASS_WATER_BOTTLE_BUNDLE_TIERS`, `quantity`, `selected`, `savings`, and `regularTotal` values.
- Produces: A shorter, visually clearer card pair for the Glass Water Bottle page only.

- [ ] **Step 1: Tighten the bundle grid**

Change the Glass Water Bottle card grid from `gap-3` to `gap-2` without changing its two-column behavior.

- [ ] **Step 2: Tighten card geometry and selected state**

Update the bundle button classes inline to use `gap-0.5 rounded-[10px] border-2 px-3 py-2.5`, while keeping the existing selected red border/tint and neutral hover state.

- [ ] **Step 3: Refine badge and typography hierarchy**

Use the compact badge classes `-top-2 right-1 rounded-full bg-[#d92c2d] px-1.5 py-0.5 text-[8px]`, reduce the piece label to `text-[12px]`, and make the total price `text-[18px]`. Keep the crossed-out regular total at a readable smaller size.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run: `node --test client/src/pages/product.test.ts`

Expected: all product-page tests pass, including the new compact-card assertions.

### Task 3: Verify the complete change

**Files:**
- Verify: `client/src/pages/product.tsx`
- Verify: `client/src/pages/product.test.ts`

**Interfaces:**
- Consumes: The completed compact card styling.
- Produces: Verified source, type check, build, and clean intended diff.

- [ ] **Step 1: Run type checking and all repository tests**

Run:

```bash
npm run check
node --test client/src/pages/product.test.ts
node --test client/src/pages/home.test.ts
node --test client/src/lib/storefront-products.test.ts
```

Expected: TypeScript exits successfully and all listed tests report zero failures.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: the Vite and server builds complete successfully. Check `git status --short` afterward and confirm the build did not create an unexpected generated catalog diff.

- [ ] **Step 3: Review the final diff**

Run: `git diff --check && git diff -- client/src/pages/product.tsx client/src/pages/product.test.ts`

Expected: no whitespace errors; only the Glass Water Bottle card styling and its focused assertions are part of this feature change. Leave unrelated local files untouched.

- [ ] **Step 4: Commit the implementation**

```bash
git add client/src/pages/product.tsx client/src/pages/product.test.ts
git commit -m "feat: refine glass bottle bundle cards"
```
