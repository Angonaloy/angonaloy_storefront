# Home Essentials Category Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a visible `Home Essentials` storefront category for Glass Water Bottles With Time Marker.

**Architecture:** Extend the existing `FEATURED_COLLECTIONS` configuration rather than creating a homepage-only card. Its existing consumers automatically render the category on the homepage and in navigation, and resolve `/collection/home-essentials` to the matching live catalog product. Store the supplied square artwork as a 320px static category asset alongside the current thumbnails.

**Tech Stack:** TypeScript, React, Wouter, Node's built-in test runner, Vite static assets, WebP.

## Global Constraints

- Use the exact slug `home-essentials`.
- Use the exact English-only label `Home Essentials`.
- Assign only `glass-water-bottles-with-time-marker` to this collection for now.
- Convert `/Users/noorkarimmehedi/Downloads/ChatGPT Image Sep 16, 2026, 10_50_18 PM.webp` into `client/public/categories/home-essentials-1-320.webp` at 320×320 pixels.
- Keep `FEATURED_COLLECTIONS` as the sole category source; do not add hardcoded homepage product, price, or stock data.
- Do not change product data, inventory, checkout, APIs, or the database.

---

### Task 1: Specify the Home Essentials collection contract

**Files:**
- Modify: `client/src/lib/featured-collections.test.ts`

**Interfaces:**
- Consumes: `FEATURED_COLLECTIONS`, `getFeaturedCollection()`, and `getVisibleFeaturedCollections()` from `client/src/lib/featured-collections.ts`.
- Produces: regression coverage for the new collection's order, label, image path, product membership, static asset, and visibility.

- [ ] **Step 1: Extend the expected collection-order contract**

Update the expected `FEATURED_COLLECTIONS.map(({ slug }) => slug)` list so `home-essentials` follows `fresh-mango`:

```ts
[
  "fresh-mango",
  "home-essentials",
  "homemade",
  "functional-food",
  "honey",
  "oil-and-ghee",
  "jaggery",
  "semai",
  "dates",
  "nuts-and-seeds",
]
```

- [ ] **Step 2: Add a failing Home Essentials behavior test**

Add `existsSync` from `node:fs`, then add this test:

```ts
test("defines Home Essentials for Glass Water Bottles With Time Marker", () => {
  const homeEssentials = getFeaturedCollection("home-essentials");
  const waterBottle = {
    slug: "glass-water-bottles-with-time-marker",
    name: "Glass Water Bottles With Time Marker",
  };

  assert.ok(homeEssentials);
  assert.equal(homeEssentials.label, "Home Essentials");
  assert.equal(homeEssentials.image, "/categories/home-essentials-1-320.webp");
  assert.deepEqual(homeEssentials.productSlugs, [waterBottle.slug]);
  assert.equal(
    existsSync(new URL("../../public/categories/home-essentials-1-320.webp", import.meta.url)),
    true,
  );
  assert.deepEqual(
    getVisibleFeaturedCollections([waterBottle]).map(({ slug }) => slug),
    ["home-essentials"],
  );
});
```

- [ ] **Step 3: Extend the current-product assignment fixture**

Append `"glass-water-bottles-with-time-marker"` to the `productSlugs` fixture in `assigns every current product to exactly one collection`. The existing unique-assignment assertion then guards the new product from duplicate category membership.

- [ ] **Step 4: Run the focused test to establish the red state**

Run:

```bash
npx tsx --test client/src/lib/featured-collections.test.ts
```

Expected: the new order assertion and/or Home Essentials lookup fails because the collection and asset do not yet exist.

### Task 2: Add the optimized category asset and collection definition

**Files:**
- Create: `client/public/categories/home-essentials-1-320.webp`
- Modify: `client/src/lib/featured-collections.ts:34-93`

**Interfaces:**
- Consumes: the source artwork in `/Users/noorkarimmehedi/Downloads/ChatGPT Image Sep 16, 2026, 10_50_18 PM.webp` and the collection contract from Task 1.
- Produces: the `home-essentials` `FeaturedCollection`, which is consumed automatically by `home.tsx`, `layout.tsx`, and `collection.tsx`.

- [ ] **Step 1: Generate the production category image without changing the source file**

Run:

```bash
cwebp -q 90 -resize 320 320 "/Users/noorkarimmehedi/Downloads/ChatGPT Image Sep 16, 2026, 10_50_18 PM.webp" -o client/public/categories/home-essentials-1-320.webp
sips -g pixelWidth -g pixelHeight -g format client/public/categories/home-essentials-1-320.webp
```

Expected: the generated file reports `pixelWidth: 320`, `pixelHeight: 320`, and `format: webp`.

- [ ] **Step 2: Insert the collection in the configured order**

Immediately after the existing `fresh-mango` object in `FEATURED_COLLECTIONS`, add:

```ts
{
  slug: "home-essentials",
  label: "Home Essentials",
  image: "/categories/home-essentials-1-320.webp",
  productSlugs: ["glass-water-bottles-with-time-marker"],
},
```

Do not edit `home.tsx` or `layout.tsx`: each already derives its category UI from this configuration. Update `collection.tsx` to render its Bengali heading suffix only when `bengaliName` exists, so `/collection/home-essentials` displays the English-only title cleanly.

- [ ] **Step 3: Run the focused tests to establish the green state**

Run:

```bash
npx tsx --test client/src/lib/featured-collections.test.ts client/src/pages/home.test.ts
```

Expected: all collection and homepage source tests pass. The existing `visibleFeaturedCollections.map(...)` contract confirms the homepage category strip renders the new configured collection once the assigned live product is present.

- [ ] **Step 4: Commit the functional change**

```bash
git add client/public/categories/home-essentials-1-320.webp client/src/lib/featured-collections.ts client/src/lib/featured-collections.test.ts
git commit -m "feat: add home essentials category"
```

### Task 3: Verify every required surface

**Files:**
- Verify: `client/src/lib/featured-collections.ts`
- Verify: `client/src/lib/featured-collections.test.ts`
- Verify: `client/src/pages/home.tsx`
- Verify: `client/src/components/layout.tsx`

**Interfaces:**
- Consumes: the collection configuration from Task 2.
- Produces: evidence that the category type-checks, renders from the shared source on the homepage and navigation, and does not introduce an unintended generated-catalog change.

- [ ] **Step 1: Type-check the storefront**

Run:

```bash
npm run check
```

Expected: exit code 0.

- [ ] **Step 2: Run the full requested source-test suite**

Run:

```bash
node --test client/src/pages/home.test.ts
node --test client/src/lib/storefront-products.test.ts
npx tsx --test client/src/lib/featured-collections.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Build and inspect generated output**

Run:

```bash
NODE_ENV=production npm run build
git status --short
git diff --check
```

Expected: the build exits 0, there are no whitespace errors, and any `generated-storefront-products.ts` diff is inspected rather than silently committed.

- [ ] **Step 4: Confirm the shared consumers need no duplicate implementation**

Confirm these existing code paths remain unchanged:

```ts
// client/src/pages/home.tsx
visibleFeaturedCollections.map(({ slug, label, image }, index) => /* category link */)

// client/src/components/layout.tsx
getVisibleFeaturedCollections(searchableProducts)

// client/src/pages/collection.tsx
const collection = getCollection(params.slug);
```

This proves the new category appears in the homepage rail and navigation, and `/collection/home-essentials` resolves and filters to the assigned product without separate UI code.
