# Storefront Responsive Image Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver appropriately sized product WebP images from the existing Supabase Storage bucket, make the first homepage screen start loading earlier, and preserve the current Merchant Suite-to-storefront data boundary.

**Architecture:** Merchant Suite keeps every source upload and writes 320 px, 640 px, and 960 px WebP variants under an immutable UUID directory in the existing `product-images` bucket. The public catalog adds optional, safe `sources` URLs while preserving current `image_url` and `image_urls` fields; the storefront uses `srcSet`/`sizes` in each display context and falls back to legacy single URLs. A dry-run-by-default script backfills the six existing image rows without deleting their legacy objects.

**Tech Stack:** Node 20 ESM, Express, `sharp@0.35.4`, Supabase Storage, Vitest, React 19, TanStack Query, Vite, TypeScript, WebP, Vercel.

## Global Constraints

- Keep Supabase as the only commerce database and product-image store; do not add a storefront Supabase client or external image vendor.
- Preserve the fixed Mango Lover BD workspace guard on every Merchant Suite data query. No HTTP endpoint accepts an arbitrary `org_id`.
- Use immutable object paths. Never overwrite an image object at an existing path.
- New assets use exactly four objects: `source`, `320.webp`, `640.webp`, and `960.webp` under `<org_id>/<product_id>/<asset_uuid>/`.
- Preserve the source bytes and MIME type. Generate WebP candidates with EXIF rotation, `withoutEnlargement: true`, quality `82`, and an input limit of `40_000_000` pixels.
- Apply `cacheControl: "31536000"` to every new source and delivery object. Verify the actual delivered Storage header after deployment before treating browser caching as fixed.
- Keep `product_images.image_url` as the 960 px public URL and `product_images.storage_path` as the source object path. No database migration is required.
- Public catalog output exposes delivery URLs only; never expose `storage_path` or another internal source path.
- Preserve legacy rows and clients: an image without a complete new variant directory continues returning only its current single URL.
- The backfill is a local, explicit maintenance script. It defaults to dry run, requires `--apply`, and never runs at application startup or through a public route.
- Homepage product cards read live Merchant Suite catalog data and cycle published products into the existing multiple row layouts. Do not reintroduce hard-coded product names, prices, stock, or image URLs.
- Do not use blurred/LQIP placeholders. Neutral card backgrounds remain until the full selected image loads.
- Do not commit or push as part of this work unless the user explicitly requests it.

---

## File Structure

### Merchant Suite: `../mangoloverbd_commerceos`

| File | Responsibility |
| --- | --- |
| `server/productImages.js` | Pure path derivation and `sharp` image-buffer generation shared by upload handling and backfill. |
| `server/productCache.js` | Builds all canonical and legacy storefront cache URLs and purges/warm them through Cloudflare. |
| `server/index.js` | Authenticated product image lifecycle, safe gallery serialization inputs, cache invalidation, and public catalog loading. |
| `server/ai-actions.js` | Passes product id and slug to the shared cache-purge wrapper after AI product mutations. |
| `server/publicCatalog.js` | Strict public `sources` contract and legacy fallback serializer. |
| `scripts/backfill-product-image-variants.mjs` | Explicit dry-run/apply migration of legacy image rows and objects. |
| `src/test/productImagePipeline.test.ts` | Derivative buffers, paths, legacy fallback, and cleanup-path unit coverage. |
| `src/test/productCache.test.ts` | Cache URL coverage for handle, versioned ID, and deprecated ID routes. |
| `src/test/productImageGallery.test.ts` | Server wiring and lifecycle source assertions. |
| `src/test/publicCatalog.test.ts` | Strict public catalog image contract coverage. |

### Storefront: `mangoloverbd_storefront`

| File | Responsibility |
| --- | --- |
| `client/src/lib/storefront-products.ts` | Rich image-source types, legacy resolver, responsive URL selection, and `srcSet` generation. |
| `client/src/lib/storefront-products.test.ts` | Rich-source precedence and legacy fallback tests. |
| `client/src/contexts/cart-context.tsx` | Persist optional 320 px delivery URL with cart items while preserving old localStorage items. |
| `client/src/pages/products.tsx` | Product-card responsive image rendering. |
| `client/src/pages/product.tsx` | Product gallery, related cards, cart handoff, and checkout handoff image candidates. |
| `client/src/components/product-grid.tsx` | Catalog grid responsive image rendering, even though it is not currently mounted. |
| `client/src/components/cart-drawer.tsx` | Select 320 px cart thumbnail URLs. |
| `client/src/components/order-dialog.tsx` | Select 320 px checkout thumbnail URLs. |
| `client/index.html` | Parser-discovered hero preload and Supabase preconnect. |
| `client/src/pages/home.tsx` | Live catalog cycling, above-fold priority, shorter visible-motion delay, and category references. |
| `client/src/pages/home.test.ts` | Homepage source-level contract assertions. |
| `client/public/categories/` | New, versioned 256 x 256 WebP category assets. |

---

### Task 1: Add the Pure Product Image Pipeline

**Files:**
- Modify: `../mangoloverbd_commerceos/package.json`
- Modify: `../mangoloverbd_commerceos/package-lock.json`
- Create: `../mangoloverbd_commerceos/server/productImages.js`
- Create: `../mangoloverbd_commerceos/src/test/productImagePipeline.test.ts`

**Interfaces:**
- Produces `PRODUCT_IMAGE_VARIANT_WIDTHS`, `PRODUCT_IMAGE_CACHE_SECONDS`, `createProductImageAssetPaths`, `isVariantAssetSourcePath`, `getProductImagePathsForCleanup`, `getProductImageVariantPaths`, and `buildProductImageBuffers`.
- Later tasks consume these functions from the product upload route and backfill script.

- [ ] **Step 1: Add failing unit tests for paths, legacy cleanup, source preservation, derivative dimensions, and no upscaling**

```ts
import sharp from "sharp";
import {
  buildProductImageBuffers,
  createProductImageAssetPaths,
  getProductImagePathsForCleanup,
  getProductImageVariantPaths,
} from "../../server/productImages.js";

it("uses an immutable directory and preserves a legacy flat path", () => {
  const asset = createProductImageAssetPaths({ orgId: "org", productId: "product", assetId: "asset" });
  expect(asset.sourcePath).toBe("org/product/asset/source");
  expect(asset.variantPaths).toEqual({
    "320": "org/product/asset/320.webp",
    "640": "org/product/asset/640.webp",
    "960": "org/product/asset/960.webp",
  });
  expect(getProductImageVariantPaths("org/product/legacy.webp")).toBeNull();
  expect(getProductImagePathsForCleanup("org/product/legacy.webp")).toEqual(["org/product/legacy.webp"]);
});

it("creates rotated WebP candidates without enlarging the source", async () => {
  const input = await sharp({ create: { width: 800, height: 400, channels: 3, background: "#fbbb14" } })
    .png()
    .toBuffer();
  const output = await buildProductImageBuffers(input, { mimeType: "image/png" });

  expect(output.source.buffer).toEqual(input);
  expect((await sharp(output.variants["320"].buffer).metadata()).width).toBe(320);
  expect((await sharp(output.variants["640"].buffer).metadata()).width).toBe(640);
  expect((await sharp(output.variants["960"].buffer).metadata()).width).toBe(800);
});
```

- [ ] **Step 2: Run the focused test to verify it fails because the module does not exist**

Run: `npx vitest run src/test/productImagePipeline.test.ts`

Expected: FAIL with a missing `server/productImages.js` module.

- [ ] **Step 3: Install the exact image-processing dependency**

Run: `npm install sharp@0.35.4 --save-exact`

Expected: `package.json` lists `"sharp": "0.35.4"` and `package-lock.json` records the matching platform package metadata.

- [ ] **Step 4: Implement the reusable path and buffer helpers**

```js
import sharp from "sharp";

export const PRODUCT_IMAGE_VARIANT_WIDTHS = [320, 640, 960];
export const PRODUCT_IMAGE_CACHE_SECONDS = 31_536_000;
export const PRODUCT_IMAGE_MAX_PIXELS = 40_000_000;

export function createProductImageAssetPaths({ orgId, productId, assetId }) {
  const prefix = `${orgId}/${productId}/${assetId}`;
  return {
    sourcePath: `${prefix}/source`,
    variantPaths: Object.fromEntries(
      PRODUCT_IMAGE_VARIANT_WIDTHS.map((width) => [String(width), `${prefix}/${width}.webp`]),
    ),
  };
}

export function isVariantAssetSourcePath(storagePath) {
  return typeof storagePath === "string" && storagePath.endsWith("/source");
}

export function getProductImageVariantPaths(storagePath) {
  if (!isVariantAssetSourcePath(storagePath)) return null;
  const prefix = storagePath.slice(0, -"/source".length);
  return Object.fromEntries(
    PRODUCT_IMAGE_VARIANT_WIDTHS.map((width) => [String(width), `${prefix}/${width}.webp`]),
  );
}

export function getProductImagePathsForCleanup(storagePath) {
  const variants = getProductImageVariantPaths(storagePath);
  return variants ? [storagePath, ...Object.values(variants)] : [storagePath];
}

export async function buildProductImageBuffers(buffer, { mimeType }) {
  const image = sharp(buffer, { limitInputPixels: PRODUCT_IMAGE_MAX_PIXELS }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new Error("Image dimensions are unavailable");

  const entries = await Promise.all(
    PRODUCT_IMAGE_VARIANT_WIDTHS.map(async (width) => {
      const { data, info } = await image.clone()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      return [String(width), { buffer: data, width: info.width, height: info.height }];
    }),
  );

  return { source: { buffer, mimeType }, variants: Object.fromEntries(entries) };
}
```

- [ ] **Step 5: Run the focused module test and the existing image-gallery test**

Run: `npx vitest run src/test/productImagePipeline.test.ts src/test/productImageGallery.test.ts`

Expected: PASS. The tests prove path semantics, exact candidate sizes, source preservation, and no regression in existing gallery expectations.

- [ ] **Step 6: Inspect the task diff without committing**

Run: `git diff --check && git diff -- package.json package-lock.json server/productImages.js src/test/productImagePipeline.test.ts`

Expected: no whitespace errors; only the dependency, helper, and tests are changed.

### Task 2: Centralize Product Catalog Cache URL Purging

**Files:**
- Create: `../mangoloverbd_commerceos/server/productCache.js`
- Create: `../mangoloverbd_commerceos/src/test/productCache.test.ts`
- Modify: `../mangoloverbd_commerceos/server/index.js:1167-1218`

**Interfaces:**
- Consumes an `orgId`, optional storefront `handle`, optional product `slug`, and configured public domain.
- Produces `buildProductCacheUrls` and `purgeProductCacheUrls`; the server wrapper and backfill script use the same URL list.

- [ ] **Step 1: Write failing tests for every storefront catalog URL family**

```ts
import { buildProductCacheUrls } from "../../server/productCache.js";

it("purges list and detail URLs for handle, v1 id, and deprecated id routes", () => {
  expect(buildProductCacheUrls({
    publicDomain: "merchant.example",
    orgId: "org-1",
    handle: "mango-lover",
    productSlug: "black-seed-honey",
    listChanged: true,
  })).toEqual([
    "https://merchant.example/api/public/v1/mango-lover/products",
    "https://merchant.example/api/public/v1/mango-lover/products/black-seed-honey",
    "https://merchant.example/api/public/v1/storefronts/org-1/products",
    "https://merchant.example/api/public/v1/storefronts/org-1/products/black-seed-honey",
    "https://merchant.example/api/public/storefronts/org-1/products",
    "https://merchant.example/api/public/storefronts/org-1/products/black-seed-honey",
  ]);
});
```

- [ ] **Step 2: Run the test to confirm the helper is absent**

Run: `npx vitest run src/test/productCache.test.ts`

Expected: FAIL with a missing `server/productCache.js` module.

- [ ] **Step 3: Implement cache URL generation and Cloudflare purge/warming**

```js
export function buildProductCacheUrls({ publicDomain, orgId, handle, productSlug, listChanged }) {
  const bases = [
    handle ? `/api/public/v1/${handle}` : null,
    `/api/public/v1/storefronts/${orgId}`,
    `/api/public/storefronts/${orgId}`,
  ].filter(Boolean);

  return bases.flatMap((base) => [
    ...(listChanged ? [`https://${publicDomain}${base}/products`] : []),
    ...(productSlug ? [`https://${publicDomain}${base}/products/${encodeURIComponent(productSlug)}`] : []),
  ]);
}

export async function purgeProductCacheUrls({ zoneId, apiToken, urls, warmToken, fetchImpl = fetch }) {
  if (!zoneId || !apiToken || urls.length === 0) return { purged: false };
  const response = await fetchImpl(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ files: urls }),
  });
  if (!response.ok) throw new Error(`Cloudflare purge failed: ${await response.text()}`);
  if (warmToken) await Promise.all(urls.map((url) => fetchImpl(url, { headers: { "X-Warm-Token": warmToken } })));
  return { purged: true };
}
```

- [ ] **Step 4: Refactor `purgeProductCache` in `server/index.js` to call the module**

Replace the hand-built handle-only URL list with a wrapper that:

1. Accepts `product` as `{ id, slug } | null` rather than a raw id.
2. Resolves the optional handle with `getStorefrontHandle(orgId)`.
3. Calls `buildProductCacheUrls` with `PUBLIC_DOMAIN`, `orgId`, handle, `product?.slug`, and `listChanged`.
4. Calls `purgeProductCacheUrls` with the existing Cloudflare credentials and `WARM_TOKEN`.
5. Logs a warning instead of throwing from fire-and-forget call sites.

Update existing callers that already have product data to pass `{ id: data.id, slug: data.slug }`; preserve `null` for product-list-only writes. Update the two AI action callers in `server/ai-actions.js` too. Preserve the handle, v1-storefront-id, and deprecated storefront-id catalog URL families, plus each available product-detail inventory URL.

- [ ] **Step 5: Run the focused cache test and the existing public catalog suite**

Run: `npx vitest run src/test/productCache.test.ts src/test/publicCatalog.test.ts`

Expected: PASS. Cache URLs cover the storefront's current v1 ID base, canonical handle base, and deprecated ID base.

- [ ] **Step 6: Inspect the task diff without committing**

Run: `git diff --check && git diff -- server/productCache.js server/index.js src/test/productCache.test.ts`

Expected: no whitespace errors and no unrelated server route changes.

### Task 3: Integrate Variants Into Merchant Suite Uploads And The Public Contract

**Files:**
- Modify: `../mangoloverbd_commerceos/server/index.js:1-26, 1342-1364, 8517-8523, 9581-9818`
- Modify: `../mangoloverbd_commerceos/server/publicCatalog.js:14-100`
- Modify: `../mangoloverbd_commerceos/src/test/productImageGallery.test.ts`
- Modify: `../mangoloverbd_commerceos/src/test/publicCatalog.test.ts`

**Interfaces:**
- Consumes Task 1 path/buffer helpers and Task 2 cache wrapper.
- Produces public image objects with optional `sources: { "320": string, "640": string, "960": string }` and existing `url`, `image_url`, and `image_urls` fallback fields.

- [ ] **Step 1: Extend public-contract tests before changing production code**

Add one rich gallery fixture and one legacy fixture to `src/test/publicCatalog.test.ts`:

```ts
expect(product.images[0]).toEqual({
  id: "img-1",
  url: "https://cdn.test/960.webp",
  sources: {
    "320": "https://cdn.test/320.webp",
    "640": "https://cdn.test/640.webp",
    "960": "https://cdn.test/960.webp",
  },
  alt_text: "Canvas bag",
  sort_order: 0,
  is_primary: true,
});
expect(product.images[0]).not.toHaveProperty("storage_path");
expect(toPublicProduct(legacyProduct, [], []).images[0]).not.toHaveProperty("sources");
```

Add source assertions in `src/test/productImageGallery.test.ts` for `buildProductImageBuffers`, `getProductImagePathsForCleanup`, `cacheControl: String(PRODUCT_IMAGE_CACHE_SECONDS)`, and cache purge calls after upload/reorder/delete.

- [ ] **Step 2: Run the focused tests to verify the new contract fails**

Run: `npx vitest run src/test/publicCatalog.test.ts src/test/productImageGallery.test.ts`

Expected: FAIL because `sources` is not part of the strict image schema and upload code still writes one raw object.

- [ ] **Step 3: Enrich `loadProductImagesMap` without exposing storage paths**

Import the Task 1 helpers. Select `storage_path` internally, derive variant paths only when the row ends in `/source`, and call `supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)` for each delivery path. Return gallery objects shaped as:

```js
{
  id: image.id,
  url: image.image_url,
  sources: variantPaths
    ? Object.fromEntries(Object.entries(variantPaths).map(([width, path]) => [
        width,
        supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl,
      ]))
    : undefined,
  alt_text: image.alt_text || null,
  sort_order: image.sort_order || 0,
  is_primary: image.is_primary === true,
}
```

Do not check object existence during catalog reads. The upload/backfill flows guarantee that rows are updated only after the full asset set is written; legacy rows omit `sources`.

- [ ] **Step 4: Make `PublicImageSchema` strict but backward compatible**

Add an optional strict `sources` object with exactly the string keys `"320"`, `"640"`, and `"960"`. In `toPublicProduct`, copy `image.sources` only when all three strings are present; keep the legacy fallback generated from `products.image_url` unchanged. Add `sources` to the image allowlist in the test, never to `LEAKY_FIELDS`.

- [ ] **Step 5: Include image data in catalog ETags and refactor cache purge call sites**

Replace the current `catalogEtag` fingerprint with a stable public-render fingerprint that includes each serialized product's `id`, `slug`, `price`, `image_url`, `image_urls`, and gallery `images` including `sources`. This prevents a product-image-only update from returning a stale `304`.

Update existing product mutation calls to pass `{ id, slug }` to the Task 2 wrapper. For every upload, reorder, single-image delete, and product delete, pass `listChanged: true` so product-list cards and product details are invalidated. Extend product selections in those handlers to include `slug` before cache invalidation.

- [ ] **Step 6: Replace the single-object upload flow with an all-or-cleanup asset flow**

Inside `POST /api/products/:id/images`:

1. Select `id, name, slug` under the resolved `org_id` guard.
2. For every input file, call `parseProductImagePayload`, generate a UUID, call `createProductImageAssetPaths`, and await `buildProductImageBuffers` before inserting database metadata.
3. Upload `source` using the submitted MIME type and the three WebP buffers using `image/webp`; each upload uses `upsert: false` and `cacheControl: String(PRODUCT_IMAGE_CACHE_SECONDS)`.
4. Track every successfully uploaded object path. If an upload or insert fails, remove all tracked paths for that asset before rethrowing.
5. Get the public 960 px URL, insert it as `image_url`, and store the `sourcePath` as `storage_path`.
6. Update `products.image_url` from the first primary gallery row as today, then purge the list and product cache using the product id and slug.

- [ ] **Step 7: Update all cleanup paths**

Use `getProductImagePathsForCleanup(storage_path)` in all three places below instead of removing one path:

```text
DELETE /api/products/:id
DELETE /api/products/:id/images/:imageId
upload rollback after an insert failure
```

Legacy flat paths must still produce a one-item removal list. New `/source` paths must remove source plus all three delivery files.

- [ ] **Step 8: Run focused tests and the full Merchant Suite test suite**

Run: `npx vitest run src/test/productImagePipeline.test.ts src/test/productCache.test.ts src/test/productImageGallery.test.ts src/test/publicCatalog.test.ts`

Expected: PASS.

Run: `npm test`

Expected: PASS with no existing test regressions.

- [ ] **Step 9: Inspect the task diff without committing**

Run: `git diff --check && git diff -- server/index.js server/publicCatalog.js src/test/productImageGallery.test.ts src/test/publicCatalog.test.ts`

Expected: no whitespace errors; `org_id` filters remain present on every image query.

### Task 4: Add the Explicit Legacy Image Backfill Script

**Files:**
- Create: `../mangoloverbd_commerceos/scripts/backfill-product-image-variants.mjs`
- Modify: `../mangoloverbd_commerceos/package.json`
- Modify: `../mangoloverbd_commerceos/src/test/productImagePipeline.test.ts`

**Interfaces:**
- Consumes Task 1 image helpers and Task 2 cache URL helpers.
- Accepts only `--org-id=<uuid>` and optional `--apply`; defaults to read-only dry-run output.
- Produces no public HTTP route and no startup side effect.

- [ ] **Step 1: Add a failing path-classification test for an already-backfilled row**

```ts
it("does not schedule a source-path row for legacy backfill", () => {
  expect(isVariantAssetSourcePath("org/product/asset/source")).toBe(true);
  expect(isVariantAssetSourcePath("org/product/legacy.webp")).toBe(false);
});
```

- [ ] **Step 2: Run the focused test before implementing the script**

Run: `npx vitest run src/test/productImagePipeline.test.ts`

Expected: PASS after Task 1; this confirms the script has a reliable idempotency predicate before it is written.

- [ ] **Step 3: Implement strict argument parsing and dry-run behavior**

The script must:

```js
const orgId = process.argv.find((arg) => arg.startsWith("--org-id="))?.slice("--org-id=".length);
const apply = process.argv.includes("--apply");
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orgId || "")) {
  throw new Error("Pass a valid --org-id=<uuid>");
}
```

Load `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `node --env-file=.env`; fail before any read when either is absent. Select only `id, product_id, image_url, storage_path, is_primary` from `product_images` under `.eq("org_id", orgId)`, then skip every row where `isVariantAssetSourcePath(storage_path)` is true.

When `--apply` is absent, print the exact legacy row count and each `product_images.id`; do not upload, update, remove, or purge anything.

- [ ] **Step 4: Implement one safe row migration**

For each legacy row during `--apply`:

1. Download `storage_path` from the existing bucket.
2. Read and validate the downloaded Blob MIME type as JPEG, PNG, or WebP before generating a new UUID directory and calling Task 1 helpers. Report and skip unknown MIME types without changing the row.
3. Upload source plus all variants with immutable cache control, keeping a per-row `uploadedPaths` array.
4. On any error, remove only `uploadedPaths`, log the image row id, and continue to the next row without updating its database row.
5. On complete uploads, update exactly that image row with `.eq("id", image.id).eq("org_id", orgId)` to set `storage_path` to the new source path and `image_url` to the 960 px public URL.
6. When the migrated row is primary, update the matching `products.image_url` under both its `id` and `org_id` guards so the existing summary-image invariant remains true.
7. Leave the old flat object untouched.

- [ ] **Step 5: Purge all storefront catalog URL families after each successful row**

Query the affected product's slug with `.eq("id", image.product_id).eq("org_id", orgId).maybeSingle()`. Read the optional handle from the `<orgId>:public_storefront_handle` app setting, call Task 2's `buildProductCacheUrls`, and call `purgeProductCacheUrls` when `PUBLIC_DOMAIN`, `CLOUDFLARE_ZONE_ID`, and `CLOUDFLARE_API_TOKEN` are configured. If Cloudflare settings are absent, log the explicit warning and continue; the public catalog TTL remains the fallback.

- [ ] **Step 6: Add an npm script and execute dry-run only**

Add this script entry to Merchant Suite `package.json`:

```json
"backfill:product-image-variants": "node --env-file=.env scripts/backfill-product-image-variants.mjs"
```

Run: `npm run backfill:product-image-variants -- --org-id=3cd26e57-85ef-4970-94a4-cd99c0f1b554`

Expected: a dry-run report identifying the current six legacy rows and confirming zero writes.

- [ ] **Step 7: Inspect the task diff without applying production changes or committing**

Run: `git diff --check && git diff -- scripts/backfill-product-image-variants.mjs package.json src/test/productImagePipeline.test.ts`

Expected: no whitespace errors. Do not add `--apply` until all code, test, and deployment checks in Task 7 are complete.

### Task 5: Add Responsive Image Selection Across Storefront Product Surfaces

**Files:**
- Modify: `client/src/lib/storefront-products.ts`
- Modify: `client/src/lib/storefront-products.test.ts`
- Modify: `client/src/contexts/cart-context.tsx`
- Modify: `client/src/pages/products.tsx`
- Modify: `client/src/pages/product.tsx`
- Modify: `client/src/components/product-grid.tsx`
- Modify: `client/src/components/cart-drawer.tsx`
- Modify: `client/src/components/order-dialog.tsx`

**Interfaces:**
- Consumes public gallery objects with optional `sources` maps from Task 3.
- Produces `ResolvedStorefrontImage`, `getProductImageData`, `getProductGalleryData`, `getResponsiveImageSrc`, and `toResponsiveSrcSet` from `storefront-products.ts`.
- Cart and checkout accept optional `imageSources` but preserve old persisted cart items with only `image`.

- [ ] **Step 1: Write failing storefront resolver tests for rich-source precedence and legacy fallback**

```ts
import {
  getProductImageData,
  getResponsiveImageSrc,
  toResponsiveSrcSet,
} from "./storefront-products.ts";

test("prefers object sources over image_urls and retains the 960 fallback", () => {
  const image = getProductImageData({
    name: "Honey",
    slug: "honey",
    image_urls: ["https://cdn.test/legacy.webp"],
    images: [{
      url: "https://cdn.test/960.webp",
      sources: { "320": "https://cdn.test/320.webp", "640": "https://cdn.test/640.webp", "960": "https://cdn.test/960.webp" },
    }],
  });
  assert.equal(image?.src, "https://cdn.test/960.webp");
  assert.equal(getResponsiveImageSrc(image, 320), "https://cdn.test/320.webp");
  assert.equal(toResponsiveSrcSet(image), "https://cdn.test/320.webp 320w, https://cdn.test/640.webp 640w, https://cdn.test/960.webp 960w");
});

test("falls back to a legacy single URL", () => {
  const image = getProductImageData({ name: "Legacy", slug: "legacy", image_url: "https://cdn.test/legacy.jpg" });
  assert.equal(image?.src, "https://cdn.test/legacy.jpg");
  assert.equal(toResponsiveSrcSet(image), undefined);
});
```

- [ ] **Step 2: Run the resolver tests to confirm the new exports are absent**

Run: `node --test client/src/lib/storefront-products.test.ts`

Expected: FAIL because rich image objects and responsive helpers do not yet exist.

Before running these Node-native tests, make the existing Vite environment lookup runtime-safe: use an empty environment fallback when `import.meta.env` is undefined. This is required because Node 24 executes `.ts` tests directly but does not inject Vite's `import.meta.env`; retain the existing Vite behavior in browsers and builds.

- [ ] **Step 3: Implement the storefront image model without breaking legacy callers**

Add these types and helpers in `storefront-products.ts`:

```ts
export type ProductImageSources = Partial<Record<"320" | "640" | "960", string>>;
export type ResolvedStorefrontImage = { src: string; sources?: ProductImageSources; altText?: string | null };

export function getProductGalleryData(product: Pick<StorefrontProduct, "image_urls" | "images" | "image_url">): ResolvedStorefrontImage[];
export function getProductImageData(product: Pick<StorefrontProduct, "image_urls" | "images" | "image_url">): ResolvedStorefrontImage | null;
export function getResponsiveImageSrc(image: ResolvedStorefrontImage | null | undefined, requestedWidth: 320 | 640 | 960): string;
export function toResponsiveSrcSet(image: ResolvedStorefrontImage | null | undefined): string | undefined;
```

`getProductGalleryData` must prefer rich `images` objects containing `sources`, then string `image_urls`, then legacy `image_url`. Keep existing `getProductGallery` and `getProductImage` string helpers as compatibility wrappers around the new data helpers until every current caller has been migrated.

- [ ] **Step 4: Thread image candidates through cart and checkout state**

Extend `CartItem` and `addToCart` input with optional `imageSources?: ProductImageSources`. Persist the field to localStorage when present; existing stored items without it remain valid. In `CartDrawer`, render:

```tsx
<img
  src={item.imageSources?.["320"] || item.image}
  alt={item.title}
  sizes="(min-width: 768px) 112px, 80px"
  className="w-full h-full object-cover transition-all duration-700"
/>
```

Extend `OrderDialogBundle.images` with optional `sources`; render the 320 px URL in its thumbnail with the existing `src` fallback.

- [ ] **Step 5: Update every product-image renderer**

Use rich data helpers and standard responsive image attributes in each context:

```tsx
<img
  src={image.src}
  srcSet={toResponsiveSrcSet(image)}
  sizes="(min-width: 1024px) 25vw, 50vw"
  alt={product.name}
  loading="lazy"
  className="h-full w-full object-cover object-center"
/>
```

- `pages/products.tsx` and `components/product-grid.tsx`: use card sizes `"(min-width: 1024px) 25vw, 50vw"`.
- `pages/product.tsx`: map `getProductGalleryData(product)` and use gallery sizes `"(min-width: 1024px) 58vw, 100vw"`; key Embla slides by `image.src`.
- `pages/product.tsx` related cards: stop bypassing the resolver with raw `p.image_url`.
- `pages/product.tsx` cart and order payloads: keep `image` as the 960 fallback and pass `imageSources`/`sources` alongside it.
- `cart-drawer.tsx` and `order-dialog.tsx`: select 320 px URLs as described in Step 4.

- [ ] **Step 6: Run storefront tests and the type checker**

Run: `node --test client/src/lib/storefront-products.test.ts && npm run check`

Expected: PASS. Existing generated catalog data and old cart localStorage shapes compile because all responsive fields are optional.

- [ ] **Step 7: Inspect the task diff without committing**

Run: `git diff --check && git diff -- client/src/lib/storefront-products.ts client/src/contexts/cart-context.tsx client/src/pages/products.tsx client/src/pages/product.tsx client/src/components/product-grid.tsx client/src/components/cart-drawer.tsx client/src/components/order-dialog.tsx`

Expected: no whitespace errors and no direct Supabase client import in the storefront.

### Task 6: Make Homepage Catalog And First-Visit Assets Fast

**Files:**
- Modify: `client/index.html`
- Modify: `client/src/pages/home.tsx`
- Modify: `client/src/pages/home.test.ts`
- Create: `client/public/categories/category-default-1.webp`
- Create: `client/public/categories/honey-5.webp`
- Create: `client/public/categories/oil-2.webp`
- Create: `client/public/categories/jaggery-2.webp`
- Create: `client/public/categories/lachcha-2.webp`
- Create: `client/public/categories/mango-2.webp`
- Create: `client/public/categories/dates-2.webp`
- Create: `client/public/categories/nuts-2.webp`

**Interfaces:**
- Consumes `fetchStorefrontProducts`, responsive image helpers, `formatProductPriceRange`, and `getProductNumericId` from Task 5.
- Produces live, repeated homepage product data with all existing product-section layouts preserved.

- [ ] **Step 1: Update homepage source tests to express the desired live-data contract**

Remove assertions for the hard-coded arrays and old clothing image paths. Add source assertions for:

```ts
assert.match(homeSource, /useQuery/);
assert.match(homeSource, /fetchStorefrontProducts/);
assert.match(homeSource, /repeatProducts/);
assert.match(homeSource, /getProductImageData/);
assert.match(homeSource, /srcSet=\{toResponsiveSrcSet/);
assert.doesNotMatch(homeSource, /const whatsNewProducts = \[/);
assert.doesNotMatch(homeSource, /image: "\/new1\.webp"/);
assert.match(homeSource, /fetchPriority="high"/);
assert.match(homeSource, /loading="eager"/);
```

- [ ] **Step 2: Run the homepage test to verify it fails on hard-coded catalog data**

Run: `node --test client/src/pages/home.test.ts`

Expected: FAIL because the current home page still defines product arrays and lazy-only category images.

- [ ] **Step 3: Replace hard-coded products with a live, repeatable catalog feed**

In `Home`:

1. Fetch products through TanStack Query with `fetchStorefrontProducts` and the existing `STOREFRONT_POLL_INTERVAL_MS`.
2. Add a local helper that returns `[]` for no products and otherwise repeats catalog items until a requested count is reached:

```ts
function repeatProducts(products: StorefrontProduct[], count: number) {
  if (products.length === 0) return [];
  return Array.from({ length: count }, (_, index) => products[index % products.length]);
}
```

3. Use repeated live products for the existing What’s New, Latest Drop, Just Arrived, and Special Collections layouts. Use `formatProductPriceRange(product)` for price, `product.variants?.length || 1` for the visible size count, `getProductNumericId(product)` for quick-add, and a unique key containing both slug and section index.
4. Preserve the current headings, card layouts, links, and quick-add buttons. For the Special Collections decorative ordinal, use `String(index + 1).padStart(2, "0")`; use the live product name rather than a hard-coded category name.
5. Hide a section’s product grid when no published products are returned instead of rendering stale sample products.

- [ ] **Step 4: Use responsive delivery and priority in homepage cards**

For each live home card, derive `const image = getProductImageData(product)`. Render `src`, `srcSet`, and card `sizes`. The first What’s New row uses `loading="eager"`; later home grids remain `loading="lazy"` so the whole page is not downloaded immediately.

```tsx
{image ? (
  <img
    src={image.src}
    srcSet={toResponsiveSrcSet(image)}
    sizes="(min-width: 768px) 25vw, 78vw"
    alt={product.name}
    loading={index < 4 ? "eager" : "lazy"}
    fetchPriority={index === 0 ? "high" : "auto"}
    className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
  />
) : null}
```

- [ ] **Step 5: Remove first-visit request delays from fixed assets and immediate content**

In `client/index.html`, add both head hints before the Vite module script:

```html
<link rel="preconnect" href="https://ldiktvcavyabivpxfwpn.supabase.co" crossorigin>
<link rel="preload" as="image" href="/hero-mango-lover.webp" type="image/webp" fetchpriority="high">
```

In `home.tsx`, set the hero image to `loading="eager" fetchPriority="high"`. Reduce `useReveal`'s fallback from 1000 ms to 250 ms and the shared visible-section transition from 1 second to 0.25 seconds. Render the category heading/grid without initial opacity animation so the first post-hero section does not wait on Framer Motion.

- [ ] **Step 6: Generate compact, cache-busted category assets and update all references**

Run one `cwebp` conversion per current category source. Use `-q 86 -resize 256 256 -blend_alpha 0xf5f5f5`, write the eight exact new filenames listed in this task, and update the category array to reference only those versioned names.

Example:

```bash
cwebp -q 86 -resize 256 256 -blend_alpha 0xf5f5f5 \
  "client/public/categories/category-default.png" \
  -o "client/public/categories/category-default-1.webp"
```

Set the compact category `<img>` elements to `loading="eager" fetchPriority="low"`; these are the first section after the hero, but the resized files prevent them from competing heavily with LCP.

- [ ] **Step 7: Run source tests, verify category dimensions, and type-check**

Run: `node --test client/src/pages/home.test.ts client/src/lib/storefront-products.test.ts && npm run check`

Expected: PASS.

Run: `sips -g pixelWidth -g pixelHeight client/public/categories/category-default-1.webp client/public/categories/honey-5.webp client/public/categories/oil-2.webp client/public/categories/jaggery-2.webp client/public/categories/lachcha-2.webp client/public/categories/mango-2.webp client/public/categories/dates-2.webp client/public/categories/nuts-2.webp`

Expected: every new category image reports `pixelWidth: 256` and `pixelHeight: 256`.

- [ ] **Step 8: Inspect the task diff without committing**

Run: `git diff --check && git diff -- client/index.html client/src/pages/home.tsx client/src/pages/home.test.ts client/public/categories`

Expected: no whitespace errors, no old hard-coded catalog arrays, and only versioned new asset URLs.

### Task 7: Verify Both Applications And Run the Controlled Backfill

**Files:**
- Modify only if verification exposes a defect in a prior task.

**Interfaces:**
- Consumes the completed Merchant Suite and storefront pipeline from Tasks 1-6.
- Produces a validated, reviewed worktree and an explicit backfill run record.

- [ ] **Step 1: Run all Merchant Suite checks**

Run: `npm run verify:supabase-project && npm run verify:supabase-baseline && npm test && npm run lint && npm run build`

Expected: all commands pass. `verify:supabase-baseline` confirms this no-migration feature did not alter the canonical schema baseline.

- [ ] **Step 2: Run all storefront checks**

Run: `node --test client/src/pages/home.test.ts client/src/lib/storefront-products.test.ts && npm run check && npm run build`

Expected: all commands pass.

Immediately run: `git status --short`

Expected: review `client/src/lib/generated-storefront-products.ts` carefully because the known build script may rewrite it. Do not revert unrelated user changes; only restore a generated artifact if the build changed it solely as a side effect and the repository's current committed catalog content is the intended source.

- [ ] **Step 3: Perform the explicit backfill dry run**

Run from Merchant Suite:

```bash
npm run backfill:product-image-variants -- --org-id=3cd26e57-85ef-4970-94a4-cd99c0f1b554
```

Expected: zero writes, six legacy rows reported in the current environment, and no newly created Storage objects.

- [ ] **Step 4: Review dry-run output before mutating production image rows**

Confirm all reported rows belong to the Mango Lover BD workspace and match the expected six current product-image records. Stop if the script reports an unexpected workspace, count, or path shape.

- [ ] **Step 5: Apply the verified backfill only after explicit user authorization**

Run from Merchant Suite only after Step 4 passes and the user explicitly authorizes the production mutation:

```bash
npm run backfill:product-image-variants -- --org-id=3cd26e57-85ef-4970-94a4-cd99c0f1b554 --apply
```

Expected: every successful row reports one preserved legacy object, one source object, three delivery objects, one guarded database update, and catalog cache purge attempts. A failed row remains legacy and is reported for retry.

- [ ] **Step 6: Validate data and headers after deployment**

Use read-only Supabase inspection to confirm every migrated `product_images.storage_path` ends with `/source` and every `image_url` ends with `/960.webp`. Confirm legacy raw URLs remain present in Storage as rollback objects.

Use a newly uploaded product image and run:

```bash
curl --silent --show-error --location --head "<new-960-image-url>"
```

Expected: record the actual delivered `Cache-Control`, CDN cache status, and content length. If the response still returns `no-cache`, do not mass-update object metadata; document the Supabase Storage/Smart CDN discrepancy for follow-up.

- [ ] **Step 7: Validate first-visit behavior in a clean browser profile after deploy**

Confirm all of the following on `https://angonaloy.shop/`:

1. The parser starts `/hero-mango-lover.webp` before React finishes mounting.
2. The eight category requests use versioned 256 px WebP files.
3. First What’s New cards request 320/640/960 candidates according to viewport and device pixel ratio, never an original source object.
4. Product listing, product detail, cart, checkout, and related product cards retain a full-image fallback for legacy data.
5. A second visit remains fast from normal browser caching, but the first visit no longer presents multi-megabyte category downloads or a one-second artificial reveal delay.

- [ ] **Step 8: Final diff review without committing**

Run in both repositories: `git diff --check && git status --short`

Expected: no whitespace errors, no secret files, no accidental `.env` changes, and no unexpected generated catalog artifact changes.

## Plan Self-Review

- **Spec coverage:** Task 1 implements source and variants; Task 2 fixes canonical/legacy cache invalidation; Task 3 integrates the image lifecycle and public contract; Task 4 backfills existing images; Task 5 renders all responsive contexts; Task 6 replaces hard-coded homepage product data and accelerates initial assets; Task 7 verifies, applies the controlled backfill, and measures delivery.
- **Placeholder scan:** No `TBD`, `TODO`, deferred implementation, or unnamed error handling remains. Every failure path has a concrete cleanup or fallback behavior.
- **Type consistency:** `sources` uses the same string keys (`"320"`, `"640"`, `"960"`) from asset creation through public serialization and React helpers. `storage_path` always names `source` for a new asset and is the only input to cleanup/variant derivation.
