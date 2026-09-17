# Handle-Based Catalog API Design

## Goal

Move every storefront catalog read to Angonaloy's canonical public API base:

`https://angonaloy-commerceos.vercel.app/api/public/v1/angonaloy`

## Root cause

The browser catalog module and build snapshot script independently construct deprecated workspace-ID URLs under `/api/public/v1/storefronts/:id`. The legacy endpoint currently responds successfully but returns an empty catalog for its fallback workspace ID, while the canonical Angonaloy handle endpoint serves the catalog, product detail, and inventory data.

## Design

- `shared/angonaloy-catalog-api.ts` owns the fixed `angonaloy` handle and builds the public catalog base from a Merchant Suite origin.
- `client/src/lib/storefront-products.ts` and `script/build.ts` both call that helper, so runtime reads and the snapshot build cannot drift to different catalog paths.
- `VITE_STOREFRONT_ID` remains only for the visitor tracker, whose separate `/api/tracker.js?org=` contract still requires the fixed workspace ID. It is not used for catalog traffic.
- Checkout remains unchanged: its server-only `STOREFRONT_HANDLE` continues to target `/api/public/v1/angonaloy/orders`.
- `.env.example`, `README.md`, and the shared `CLAUDE.md`/`AGENTS.md` guide describe the fixed catalog handle and the server-only checkout handle as `angonaloy`, while distinguishing the tracker-only workspace ID.

## Constraints

- Do not add Supabase access, database credentials, hardcoded products, or product writes.
- All catalog, detail, inventory, and first-paint snapshot requests use the handle-based API; no active storefront source may use `/api/public/v1/storefronts/` for catalog data.
- Preserve the active working tree's unrelated product-detail and Mux changes.

## Verification

- Tests capture the browser catalog, detail, and inventory request URLs and reject the deprecated path.
- Browser catalog tests prove the canonical base and capture the list, detail, and inventory URLs; the production build verifies the snapshot consumes that same shared base.
- Run type-checking, focused catalog/build/checkout tests, and a production build.
