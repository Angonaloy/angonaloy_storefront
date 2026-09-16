# Angonaloy-আঙ্গনালয় Storefront

The public storefront for **Angonaloy-আঙ্গনালয়**. React + Vite + Express, deployed on Vercel,
connected to the Merchant Suite dashboard (a separate repo) for catalog data and order submission.

- **Repo:** `github.com/Angonaloy/angonaloy_storefront`
- **Live:** https://angonaloy.shop (Vercel project `angonaloy-storefront`)
- **Dashboard repo:** Merchant Suite / commerceos — separate repository, separate Vercel project

> **Read `CLAUDE.md` before making changes.** It explains the two-repo boundary and what does
> and does not belong in this codebase.

---

## Quick start

```bash
npm install
cp .env.example .env      # then fill in the real values (see "Environment" below)
npm run dev               # http://localhost:5003
```

`npm run dev` starts Express, which serves both the API routes and the Vite dev server with HMR.
There is no separate frontend process. `npm run dev:client` runs Vite alone on port 5000 if you
ever need it, but the checkout API will not work in that mode.

The dev script loads `.env` via Node's `--env-file-if-exists` flag. There is intentionally no
`dotenv` dependency. The `-if-exists` variant matters: on Vercel there is no `.env` file (env vars
are injected), so the strict `--env-file` flag would break production builds.

Other commands:

| Command | What it does |
|---|---|
| `npm run dev` | Express + Vite dev server on **port 5003** |
| `npm run build` | Prefetches the catalog, builds the client to `dist/public`, bundles the server |
| `npm run start` | Runs the production bundle (`dist/index.cjs`) |
| `npm run check` | `tsc` type-check, no emit |
| `node --test client/src/pages/home.test.ts` | Source-text tests (see "Testing") |

---

## Environment

Four variables, in `.env` locally and in Vercel project settings for deploys. `.env` is gitignored —
never commit it. `.env.example` is the committed template.

| Variable | Scope | Purpose |
|---|---|---|
| `VITE_MERCHANT_SUITE_URL` | client (browser) | Base URL of the Merchant Suite. Catalog/inventory reads. **Baked into the bundle at build time.** |
| `VITE_STOREFRONT_ID` | client (browser) | The fixed Angonaloy workspace id: `3cd26e57-85ef-4970-94a4-cd99c0f1b554` |
| `MERCHANT_SUITE_URL` | server | Same URL as above, for the server-side checkout POST |
| `CUSTOM_ORDERS_API_KEY` | server, **secret** | Authenticates the order webhook. Must match `<orgId>:custom_store_api_key` in the Suite's `app_settings`. Never expose this via a `VITE_` variable. |

Anything prefixed `VITE_` is compiled into the public JavaScript bundle and is readable by
anyone. Only put non-secret values there.

GTM `GTM-5KKTRHFD` owns GA4 `G-Q7J7KV6ZVC`, Meta Pixel `337187585388165`, and Meta CAPI. The
storefront emits only safe ecommerce `dataLayer` events; do not add direct analytics, Pixel, or CAPI
configuration to this application.

Before deploying tracking changes, verify the GTM container has one GA4 configuration tag, one Meta
Pixel/CAPI path, and one trigger per ecommerce event. Use a History Change or virtual page-view trigger
for SPA navigation without duplicating the initial page view, then validate GA4 DebugView, Meta Test
Events, and Meta Pixel Helper on the deployed storefront.

### Local development

Point both URLs at your locally running Merchant Suite:

```
VITE_MERCHANT_SUITE_URL=http://localhost:5002
MERCHANT_SUITE_URL=http://localhost:5002
```

Start the Suite first (`npm run dev` in the commerceos repo, port 5002), then this storefront on 5003.

### Production (Vercel)

The Vercel project `angonaloy-storefront` already has all four required variables set on production,
preview, and development targets. `CUSTOM_ORDERS_API_KEY` and `MERCHANT_SUITE_URL` are encrypted;
the two `VITE_` ones are plaintext by nature.

**While the Suite runs on localhost, an ngrok tunnel bridges Vercel to it.** Vercel's serverless
checkout handler posts from Vercel's own infrastructure, so a `localhost` URL there always fails —
even though browser-side catalog reads appear to work when you are testing from your own machine.
Free ngrok URLs change on every restart, so after restarting the tunnel you must update **both**
Vercel env vars and redeploy (the client bundle bakes `VITE_MERCHANT_SUITE_URL` in at build time).
The durable fix is deploying the Suite to a real public URL.

---

## How the storefront connects to the dashboard

Two directions, two different mechanisms:

**Catalog reads — browser → Suite, unauthenticated public API.**
`client/src/lib/storefront-products.ts` builds every URL from
`${VITE_MERCHANT_SUITE_URL}/api/public/v1/storefronts/${VITE_STOREFRONT_ID}`:

| Call | Endpoint |
|---|---|
| `fetchStorefrontProducts()` | `GET .../products` |
| `fetchStorefrontProduct(slug)` | `GET .../products/:slug` |
| `fetchStorefrontProductInventory(slug)` | `GET .../products/:slug/inventory` |

`STOREFRONT_POLL_INTERVAL_MS` (8s) is how often the storefront re-checks stock, prices, and images.
`mergeInventory()` overlays live stock truth onto a cached catalog product. This is why **publishing
a product or editing stock in the dashboard shows up on the storefront within seconds and does not
require a redeploy.**

Requests carry an `ngrok-skip-browser-warning: true` header so free-tier tunnels return JSON
instead of their HTML interstitial. Harmless once the Suite is on a real domain.

**Checkout — storefront server → Suite, authenticated webhook.**
`api/orders.ts` (Vercel serverless) and `server/order-service.ts` (local Express) both POST to
`${MERCHANT_SUITE_URL}/api/custom-orders/webhook` with an `x-api-key: ${CUSTOM_ORDERS_API_KEY}`
header. The Suite matches that key against `app_settings` to resolve the workspace and returns the
canonical `order_id`. The order then appears in the dashboard with `source: custom_store`.

This never happens from the browser — the API key must stay server-side.

### Verifying the connection

```bash
# Catalog reachable?
curl -s "$MERCHANT_SUITE_URL/api/public/v1/storefronts/3cd26e57-85ef-4970-94a4-cd99c0f1b554/products" | head -c 300

# Checkout wired up? (creates a REAL order in the dashboard — delete it afterwards)
curl -s -X POST "$MERCHANT_SUITE_URL/api/custom-orders/webhook" \
  -H "Content-Type: application/json" -H "x-api-key: $CUSTOM_ORDERS_API_KEY" \
  -d '{"customer_name":"Test","phone":"01700000000","address":"Test address, Dhaka","product":"Test","quantity":1,"price":100,"delivery_rate":60}'
```

A 201 with an `order_id` means the link is live. An empty `products` array means nothing is
published in the dashboard yet — that is a dashboard-side task, not a storefront bug.

---

## Supabase and products — where product data actually lives

Products live in the **Angonaloy Supabase project** (`ldiktvcavyabivpxfwpn`), shared with the
dashboard. This repo has **no Supabase client and no database credentials**; it reads products over
the Suite's public HTTP API and writes nothing.

### Adding a product

**You cannot add a product from this repo.** Products are created on the **dashboard's Products page**
(`/products` in the Merchant Suite). The dashboard's server writes to Supabase using the service-role
key; this storefront then reads the result — within about 8 seconds, with no commit and no deploy.

That restriction is enforced by the database, not just by convention: `products`, `product_images`,
and `product_variants` have RLS enabled with **only a `service_role` policy**. A browser holding a
publishable/anon key can neither read nor write them. The only way to write from here would be to ship
a service-role key into public JavaScript, which would hand anyone full control of the database.

End to end:

1. Dashboard → Products → add name, price, COG, description.
2. Upload product images there — they go to Supabase Storage (`product-images` bucket), **not** to
   `client/public/`.
3. Add variants if the product has size/weight options.
4. **Publish it.** This is the step people miss.
5. Refresh the storefront. It appears within ~8s, and the same product shows on the dashboard's
   Products page because both sides are reading one Supabase row.

### Catalog snapshot and live refresh

The storefront ships with a build-generated catalog snapshot in
`client/src/lib/generated-storefront-products.ts`. It lets a new device render product names,
prices, and images immediately instead of waiting for the first Merchant Suite request. The
storefront still requests the live catalog in the background and replaces the snapshot when the
response arrives. Supabase remains the source of truth.

A newly published product can appear from the live API within about 8 seconds without a storefront
deploy. It becomes part of the built-in first-paint snapshot on the next successful production
build. To refresh that snapshot deliberately, run `NODE_ENV=production npm run build` from this repo
and deploy the resulting commit to `main`. Do not edit the generated file by hand.

### `published = true` is the gate

The Suite serves only rows matching `org_id = <workspace>` **and** `published = true`. A saved but
unpublished product exists in Supabase and is visible in the dashboard, yet is invisible on the
storefront. An empty `products` array from the API almost always means "nothing published yet" rather
than a storefront bug. `selling_price` must also be set, or the API returns `available: false` and the
card renders greyed out.

### Tables (read-only reference)

| Table | Holds |
|---|---|
| `products` | name, slug, description, `selling_price`, `compare_at_price`, `cog`, `published`, `image_url` |
| `product_images` | gallery rows: `image_url`, `storage_path`, `alt_text`, `sort_order`, `is_primary` |
| `product_variants` | `attributes` jsonb, `stock_quantity`, `cog`, `price_adjustment` (variant price = product `selling_price` + adjustment) |

Every row carries `org_id`, the fixed Angonaloy workspace. Note the rename across the boundary:
Supabase stores `selling_price`, the public API emits `price`. Code here should follow the API shape
(`StorefrontProduct` in `client/src/lib/storefront-products.ts`).

Stock is deliberately served by a separate `/inventory` endpoint with a much shorter cache TTL than
the catalog, so add-to-cart is never acting on stale stock. Read it via
`fetchStorefrontProductInventory()` / `mergeInventory()`; don't infer stock from a catalog field.

### Homepage product sections

The homepage sections use the live catalog, with the build-generated snapshot as immediate initial
data. Do not add hardcoded product arrays or product images to `home.tsx`; dashboard products should
drive every section.

`client/public/` is for fixed brand assets — logo, hero poster, favicons. Product photos belong in
Supabase Storage.

### Supabase MCP (optional, for agents)

`.mcp.json` (Claude Code) and `.codex/config.toml` (Codex/OpenCode) configure a project-scoped Supabase
MCP server so an AI agent working in this repo can inspect the shared database — confirm a product row
exists, check whether it is published, see why the catalog came back empty. Both are **read-only** and
limited to the `docs,database,debugging,development` tool groups.

Claude Code needs a one-time OAuth: run `/mcp`, select `supabase`, authenticate.

This is developer tooling only. It runs in your agent's process under your own Supabase credentials,
is not part of the shipped bundle, and gives the deployed storefront no database access. Schema
changes and migrations stay in the dashboard repo.

---

## Layout

```
client/
  index.html                        page title + OG/Twitter meta
  public/                           static assets served at /
  src/
    App.tsx                         routes (wouter)
    pages/       home.tsx  products.tsx  product.tsx  booking.tsx  not-found.tsx
    components/  layout.tsx (nav + footer)  cart-drawer.tsx  product-grid.tsx  ui/ (shadcn)
    contexts/    cart-context.tsx
    lib/
      storefront-products.ts        ← the Suite API client
      generated-storefront-products.ts  ← build-generated first-paint snapshot
api/orders.ts                       Vercel serverless checkout
server/                             local Express (dev + self-hosted prod)
script/build.ts                     build: catalog prefetch → vite → esbuild
attached_assets/                    imported via the @assets alias
```

Path aliases (`vite.config.ts`): `@` → `client/src`, `@shared` → `shared`, `@assets` → `attached_assets`.

Routing uses **wouter**, not React Router. That is the opposite of the dashboard repo's rule —
do not carry that convention across.

### Build-generated catalog file

`script/build.ts` refreshes `client/src/lib/generated-storefront-products.ts` from the live public
catalog before building. A production build fails if the API is unavailable, so it never deploys stale
static product SEO files. Local fallback builds keep the previous snapshot. If the catalog is genuinely
empty, check the product API and `git diff` before committing a snapshot refresh.

---

## Branding

Current brand assets and where they are wired:

| Asset | File | Used in |
|---|---|---|
| Nav logo | `attached_assets/angonaloy-logo.webp` | `client/src/components/layout.tsx` |
| Hero poster | `client/public/hero-mango-lover.webp` | `client/src/pages/home.tsx` (inline, ~line 289) |
| Brand yellow | `#FBBB14` | hero background |
| Brand ink | `#163B33` | hero CTA |
| Wordmark | `Angonaloy-আঙ্গনালয়` | `layout.tsx` footer, `client/index.html` titles |

**The homepage hero is inline in `client/src/pages/home.tsx`.** `client/src/components/hero.tsx`
exists but is dead code — nothing imports it. Editing it has no visible effect.

Currency is always `৳`, never "BDT" or "Tk".

### Known branding gaps

Template cleanup is done (Stepprs fallback, makeup-template components and their
orphaned media removed; canonical Angonaloy meta in `client/index.html`).
Still open: no loaded webfont contains Bengali glyphs — the Bangla wordmark
falls back to a system font. Adding Hind Siliguri or Anek Bangla would fix that.

---

## Testing

There is no vitest here. Tests are `node:test` files that assert against **source text**:

```bash
node --test client/src/pages/home.test.ts
node --test client/src/lib/storefront-products.test.ts
```

Because they match on markup strings, any className or copy change in `home.tsx` will break the
corresponding assertion. Update the assertion to describe the new markup rather than reverting the
change. Run `npm run check` too — `tsc` catches what source-text tests cannot.

---

## Deploying

Vercel auto-deploys on push to `main`. `vercel.json` sets `outputDirectory: dist/public`, SPA
rewrites, and immutable cache headers on hashed assets.

Published product and static SEO metadata changes are rebuilt automatically: Merchant Suite queues a
production Vercel deployment, which fetches the current public catalog to generate product pages and
the sitemap. Staff should publish or unpublish products in Merchant Suite, never edit storefront catalog
data. An unpublished seasonal product returns `404` until it is republished. See
[`docs/superpowers/specs/2026-09-09-dynamic-product-seo-remediation-design.md`](docs/superpowers/specs/2026-09-09-dynamic-product-seo-remediation-design.md)
for the exact legacy-URL and Google cleanup policy.

Before pushing: `npm run check` and run the tests. After pushing, run `git status` again — the
global pre-push hook builds, which clobbers `generated-storefront-products.ts`.
