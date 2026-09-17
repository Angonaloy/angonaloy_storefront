# Handle-Based Catalog API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route browser catalog traffic and the build-generated first-paint snapshot through Angonaloy's canonical handle-based Merchant Suite API.

**Architecture:** A shared URL builder derives the public catalog base from the Merchant Suite origin plus the fixed Angonaloy handle. The catalog module and build script consume that builder; the existing workspace ID remains only for the visitor tracker, while server-side checkout continues to use its established handle-based order route.

**Tech Stack:** React 19, Vite, TypeScript, Node `node:test`, tsx, esbuild.

## Global Constraints

- Catalog, product-detail, inventory, and build snapshot requests use `/api/public/v1/angonaloy/...`.
- Do not add Supabase access, secrets, hardcoded product data, or product writes.
- Preserve `VITE_STOREFRONT_ID` solely for the existing tracker contract.
- Keep server-side checkout on `/api/public/v1/angonaloy/orders` through `STOREFRONT_HANDLE`.
- Do not modify the active working tree's existing product-detail, Mux, or dependency changes.

---

### Task 1: Prove the handle-based catalog contract

**Files:**
- Modify: `client/src/lib/storefront-products.test.ts`

**Interfaces:**
- Consumes: `fetchStorefrontProducts()`, `fetchStorefrontProduct(slug)`, and `fetchStorefrontProductInventory(slug)` from `client/src/lib/storefront-products.ts`.
- Produces: Regression coverage that proves the browser's shared catalog base and captures browser catalog request URLs.

- [x] **Step 1: Write failing browser catalog URL tests**

```ts
assert.deepEqual(requestUrls, [
  "/api/public/v1/angonaloy/products",
  "/api/public/v1/angonaloy/products/seasonal-mango",
  "/api/public/v1/angonaloy/products/seasonal-mango/inventory",
]);
assert.ok(requestUrls.every((url) => !url.includes("/api/public/v1/storefronts/")));
```

- [x] **Step 2: Run the test to verify the legacy implementation fails**

Run: `node --test client/src/lib/storefront-products.test.ts`

Expected: FAIL because the captured URLs include `/api/public/v1/storefronts/`.

- [x] **Step 3: Assert the canonical browser catalog base**

```ts
assert.equal(STOREFRONT_API_BASE, "/api/public/v1/angonaloy");
```

- [x] **Step 4: Run the catalog test to verify it fails**

Run: `node --test client/src/lib/storefront-products.test.ts`

Expected: FAIL because the existing browser catalog base contains `/api/public/v1/storefronts/`.

### Task 2: Move browser and build catalog reads to the Angonaloy handle

**Files:**
- Create: `shared/angonaloy-catalog-api.ts`
- Modify: `client/src/lib/storefront-products.ts:1-9`
- Modify: `script/build.ts:12-20`
- Test: `client/src/lib/storefront-products.test.ts`

**Interfaces:**
- Consumes: `VITE_MERCHANT_SUITE_URL` as the public Merchant Suite origin.
- Produces: `getAngonaloyCatalogApiBase(merchantSuiteUrl: string)`, `STOREFRONT_API_BASE`, and `storefrontProductsUrl` based on the fixed `angonaloy` handle.

- [x] **Step 1: Implement the shared canonical catalog base**

```ts
export const ANGONALOY_STOREFRONT_HANDLE = "angonaloy";

export function getAngonaloyCatalogApiBase(merchantSuiteUrl: string) {
  return `${merchantSuiteUrl.replace(/\/+$/, "")}/api/public/v1/${ANGONALOY_STOREFRONT_HANDLE}`;
}
```

- [x] **Step 2: Replace the browser's workspace-ID catalog base**

```ts
export const STOREFRONT_API_BASE = getAngonaloyCatalogApiBase(MERCHANT_SUITE_URL);
```

- [x] **Step 3: Replace the build snapshot's workspace-ID catalog URL**

```ts
const storefrontProductsUrl = `${getAngonaloyCatalogApiBase(MERCHANT_SUITE_URL)}/products`;
```

- [x] **Step 4: Run the focused tests**

Run: `node --test client/src/lib/storefront-products.test.ts`

Expected: PASS; every asserted catalog URL begins with `/api/public/v1/angonaloy` and no test permits the deprecated base.

### Task 3: Align configuration and operator documentation

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `CLAUDE.md` (also updates the `AGENTS.md` symlink)

**Interfaces:**
- Consumes: the fixed public catalog handle and `STOREFRONT_HANDLE` for server-only checkout.
- Produces: A documented `angonaloy` catalog and checkout configuration, with `VITE_STOREFRONT_ID` explicitly scoped to visitor tracking.

- [x] **Step 1: Update the environment template**

```dotenv
# Catalog API base: {VITE_MERCHANT_SUITE_URL}/api/public/v1/angonaloy
# Tracker-only workspace ID; never use it for catalog requests.
VITE_STOREFRONT_ID=3cd26e57-85ef-4970-94a4-cd99c0f1b554
STOREFRONT_HANDLE=angonaloy
```

- [x] **Step 2: Update README and agent documentation**

Document the exact production catalog base `https://angonaloy-commerceos.vercel.app/api/public/v1/angonaloy`, the handle-based product and inventory routes, and the tracker-only role of `VITE_STOREFRONT_ID`. Keep checkout documented as the existing server-side handle-based order route.

- [x] **Step 3: Verify documentation no longer presents the deprecated catalog route**

Run: `grep -R "api/public/v1/storefronts" .env.example README.md CLAUDE.md AGENTS.md`

Expected: no output.

### Task 4: Verify checkout and production output

**Files:**
- Verify only: `api/orders.ts`, `server/order-service.ts`, `api/orders.test.ts`, `server/order-service.test.ts`

**Interfaces:**
- Consumes: existing server-only `STOREFRONT_HANDLE` checkout configuration.
- Produces: Evidence that checkout remains handle-based while catalog migration passes type-checking and production build.

- [x] **Step 1: Run checkout regression tests**

Run: `npx tsx --test api/orders.test.ts server/order-service.test.ts`

Expected: PASS; both implementations POST to `/api/public/v1/<handle>/orders`.

- [x] **Step 2: Run type-checking**

Run: `npm run check`

Expected: PASS with no emitted files.

- [x] **Step 3: Run a production build**

Run: `NODE_ENV=production VITE_MERCHANT_SUITE_URL=https://angonaloy-commerceos.vercel.app npm run build`

Expected: PASS; the build retrieves the snapshot from the handle-based catalog URL, emits the client and server bundles, and may refresh only the generated catalog snapshot.

- [x] **Step 4: Inspect the final working tree**

Run: `git status --short`

Expected: the migration files and any generated catalog snapshot are distinguishable from the pre-existing product-detail, Mux, and package changes.
