# Fresh Mango Homepage Category Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing `Fresh Mango-ফ্রেশ আম` homepage category visible by assigning the live `katimon-mango` product to it.

**Architecture:** Keep the existing static featured-collection mapping. Add the product slug to the `fresh-mango` collection so the existing `getVisibleFeaturedCollections()` logic exposes the category and the existing homepage renderer displays the product. Product data, pricing, images, and publication remain owned by Merchant Suite.

**Tech Stack:** React 19, TypeScript, Vite, Node test runner.

## Global Constraints

- Do not hardcode product records, prices, stock, or images in homepage components.
- Preserve the existing `Fresh Mango-ফ্রেশ আম` label and `/collection/fresh-mango` route.
- Use the live product slug `katimon-mango` returned by the Merchant Suite catalog API.
- Add a regression test before changing the collection mapping.

---

### Task 1: Assign Katimon Mango to Fresh Mango

**Files:**
- Modify: `client/src/lib/featured-collections.test.ts`
- Modify: `client/src/lib/featured-collections.ts`

**Interfaces:**
- Consumes: `FEATURED_COLLECTIONS`, `getProductsForCollection()`, and `getVisibleFeaturedCollections()`.
- Produces: a `fresh-mango` collection whose `productSlugs` contains `katimon-mango`.

- [x] **Step 1: Write the failing regression test**

  Add a test that resolves `fresh-mango`, asserts its label remains `Fresh Mango-ফ্রেশ আম`, and verifies that a catalog product with slug `katimon-mango` makes `fresh-mango` visible and assigned.

- [x] **Step 2: Run the focused test to verify it fails**

  Run: `node --test client/src/lib/featured-collections.test.ts`

  Expected: the new Fresh Mango test fails because `productSlugs` is currently empty.

- [x] **Step 3: Write the minimal implementation**

  Change only the `fresh-mango` collection definition in `client/src/lib/featured-collections.ts`:

  ```ts
  productSlugs: ["katimon-mango"],
  ```

- [x] **Step 4: Run the focused test to verify it passes**

  Run: `node --test client/src/lib/featured-collections.test.ts`

  Expected: all featured-collection tests pass, including the Fresh Mango visibility test.

- [x] **Step 5: Run storefront verification**

  Run: `npm run check`

  Expected: TypeScript completes successfully with no errors.
