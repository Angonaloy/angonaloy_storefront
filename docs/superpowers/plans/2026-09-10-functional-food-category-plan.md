# Functional Food Category Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `Functional Food-ফাংশনাল ফুড` to the storefront with Kalojira Mixed and Beetroot Powder.

**Architecture:** Extend `FEATURED_COLLECTIONS` with a `functional-food` entry and move the two product slugs out of `homemade`. The existing `getVisibleFeaturedCollections()` helper already feeds Featured Categories, desktop navigation, and the mobile Menu. Add the homepage render call after Homemade and protect the assignment and ordering contracts with source-level tests.

**Tech Stack:** TypeScript, React, Wouter, Node test runner, existing Featured Collection helpers.

## Global Constraints

- Use the label `Functional Food-ফাংশনাল ফুড`.
- Assign `kalojira-mixed` and `beetroot-powder` only to `functional-food`.
- Place Functional Food after Homemade in collection and homepage order.
- Use `/categories/category-default.png` as the category image.
- Do not change product data, pricing, checkout, API, or database behavior.

---

### Task 1: Add failing collection and homepage contracts

**Files:**
- Modify: `client/src/lib/featured-collections.test.ts`
- Modify: `client/src/pages/home.test.ts`

- [ ] Add `functional-food` to the expected collection slug list.
- [ ] Add assertions that the new collection has the exact label, image, and two product slugs, and that Homemade no longer contains either slug.
- [ ] Add `functional-food` to the current-product assignment fixture and assert it appears in the visible collection result.
- [ ] Add `renderCategorySection("functional-food")` immediately after the Homemade marker in the homepage ordering contract.
- [ ] Run the focused tests and confirm they fail before production code changes.

### Task 2: Wire the Functional Food collection

**Files:**
- Modify: `client/src/lib/featured-collections.ts`
- Modify: `client/src/pages/home.tsx`

- [ ] Remove `kalojira-mixed` and `beetroot-powder` from Homemade.
- [ ] Insert the `functional-food` collection after Homemade with the approved label, fallback image, and both slugs.
- [ ] Render `functional-food` after `homemade` on the homepage.
- [ ] Run the focused collection and homepage tests and confirm they pass.

### Task 3: Verify all requested surfaces

**Files:** `client/src/lib/featured-collections.ts`, `client/src/pages/home.tsx`, and related tests

- [ ] Run `npx tsx --test client/src/lib/featured-collections.test.ts client/src/pages/home.test.ts`.
- [ ] Run `npm run check`.
- [ ] Run `NODE_ENV=production npm run build`.
- [ ] Run `git diff --check`.
- [ ] Confirm `layout.tsx` still consumes `getVisibleFeaturedCollections(searchableProducts)`, so no direct navigation edit is needed.
