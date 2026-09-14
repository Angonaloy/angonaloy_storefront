# GTM Single-Owner Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make GTM `GTM-5KKTRHFD` the sole owner of GA4 `G-Q7J7KV6ZVC`, Meta Pixel `337187585388165`, and Meta CAPI while the storefront emits only safe ecommerce `dataLayer` events.

**Architecture:** The storefront keeps the GTM bootstrap and pushes canonical ecommerce events to `window.dataLayer`. GTM maps each event once to GA4 and Meta. The storefront no longer initializes a Pixel, calls `fbq`, calls direct `gtag`, or sends a Meta CAPI request.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query, GTM, GA4, Meta Pixel, Node test runner.

## Global Constraints

- Retain GTM `GTM-5KKTRHFD` in `client/index.html`.
- Configure GA4 `G-Q7J7KV6ZVC`, Meta Pixel `337187585388165`, and one Meta CAPI path in GTM, not application code.
- Retain `view_item`, `add_to_cart`, `begin_checkout`, `select_item`, and `purchase` ecommerce `dataLayer` contracts.
- Do not put names, emails, phone numbers, addresses, or other customer PII in `dataLayer`.
- Retain the Merchant Suite visitor tracker because it is unrelated first-party operational telemetry.
- Keep Vercel and local checkout behavior in sync.

---

### Task 1: Make GTM the only browser tag loader

**Files:**
- Modify: `client/index.html:5-21,101-104`
- Modify: `client/src/lib/google-analytics.ts:8-13,195-211`
- Modify: `client/src/pages/analytics-snippets.test.ts`
- Modify: `client/src/lib/google-analytics.test.ts`

**Interfaces:**
- Consumes: existing `trackGoogleEcommerceEvent(event, input)` callers.
- Produces: one safe `window.dataLayer.push()` ecommerce payload per client action.

- [ ] **Step 1: Write a failing browser-bootstrap regression test**

Update `analytics-snippets.test.ts` to keep the GTM script and noscript iframe while asserting the HTML has no `googletagmanager.com/gtag/js` script and no `gtag('config'` call.

- [ ] **Step 2: Verify the regression test fails**

Run: `node --test client/src/pages/analytics-snippets.test.ts`

Expected: FAIL because the direct GA4 loader is still present.

- [ ] **Step 3: Remove direct GA4 ownership**

Remove the `gtag.js` snippet from `client/index.html`. Remove `GoogleInteractionEventName`, the `gtag` browser type, and `trackGoogleInteractionEvent()` from `google-analytics.ts`. Leave `trackGoogleEcommerceEvent()` unchanged as the one `dataLayer.push()` pathway.

- [ ] **Step 4: Verify the focused tests pass**

Run: `node --test client/src/pages/analytics-snippets.test.ts client/src/lib/google-analytics.test.ts`

Expected: PASS.

### Task 2: Remove direct Meta Pixel and CAPI ownership

**Files:**
- Delete: `client/src/lib/meta.ts`
- Delete: `client/src/lib/meta.test.ts`
- Delete: `api/meta.ts`
- Delete: `server/meta-capi.ts`
- Modify: `client/src/App.tsx`
- Modify: `client/src/pages/product.tsx`
- Modify: `client/src/contexts/cart-context.tsx`
- Modify: `client/src/components/order-dialog.tsx`
- Modify: `api/orders.ts`
- Modify: `server/order-service.ts`
- Modify: `server/routes.ts`
- Modify: `api/orders.test.ts`
- Modify: `server/order-service.test.ts`
- Modify: `script/vercel-routing.test.mjs`

**Interfaces:**
- Consumes: the ecommerce `dataLayer` helper retained in Task 1.
- Produces: no direct Pixel load, `fbq` event, `/api/meta` request, Meta CAPI purchase, `trackingMode`, or `metaEventId` checkout contract.

- [ ] **Step 1: Write failing direct-Meta absence and checkout-contract tests**

Update existing source-level tests so they assert the app keeps the canonical ecommerce calls but no longer imports `@/lib/meta`, registers `/api/meta`, or carries `trackingMode` and `metaEventId` through Vercel or local checkout handling.

- [ ] **Step 2: Verify the regression tests fail**

Run: `node --test api/orders.test.ts server/order-service.test.ts script/vercel-routing.test.mjs client/src/pages/google-analytics-wiring.test.ts`

Expected: FAIL because direct Meta/CAPI behavior still exists.

- [ ] **Step 3: Delete the direct Meta paths**

Delete the Pixel/CAPI modules and remove their imports, event calls, routes, API dependencies, request fields, and server Purchase dispatches. Keep all ecommerce `dataLayer` events, order validation, Suite order submission, and confirmation behavior.

- [ ] **Step 4: Verify checkout parity**

Run: `node --test api/orders.test.ts server/order-service.test.ts script/vercel-routing.test.mjs client/src/pages/google-analytics-wiring.test.ts`

Expected: PASS.

### Task 3: Retire direct campaign interaction tracking

**Files:**
- Modify: `client/src/features/sundarbans-honey/tracking.ts`
- Modify: `client/src/features/kalojira-mixed/tracking.ts`
- Modify: `client/src/features/honey-nut/tracking.ts`
- Modify: campaign page, layout, mobile bar, and checkout call sites under `client/src/features/{sundarbans-honey,kalojira-mixed,honey-nut}/`
- Modify: `client/src/pages/{sundarbans-honey,kalojira-mixed,honey-nut}.tsx`
- Modify: campaign tracking, checkout, and routing tests

**Interfaces:**
- Consumes: marker helpers that prevent a thank-you page from duplicating a purchase event.
- Produces: campaigns with marker-only tracking modules and GTM-readable ecommerce events only.

- [ ] **Step 1: Write failing campaign contract tests**

Replace direct interaction expectations with assertions for retained ecommerce events and retained purchase idempotency markers. Assert campaign source does not import a direct interaction tracker or `trackingMode: "google_only"`.

- [ ] **Step 2: Verify the campaign tests fail**

Run: `node --test client/src/features/sundarbans-honey/tracking.test.ts client/src/features/kalojira-mixed/tracking.test.ts client/src/features/honey-nut/tracking.test.ts client/src/pages/sundarbans-honey-thank-you.test.ts`

Expected: FAIL because campaign interaction tracking still exists.

- [ ] **Step 3: Remove direct interactions without breaking purchase markers**

Delete campaign interaction functions and their call sites. Retain `markPurchaseTracked`, `markKalojiraPurchaseTracked`, and `markHoneyNutPurchaseTracked`, plus all existing ecommerce calls.

- [ ] **Step 4: Verify the campaign tests pass**

Run: `node --test client/src/features/sundarbans-honey/tracking.test.ts client/src/features/kalojira-mixed/tracking.test.ts client/src/features/honey-nut/tracking.test.ts client/src/pages/sundarbans-honey-thank-you.test.ts`

Expected: PASS.

### Task 4: Align configuration documentation and complete verification

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: tracking-related tests identified in Tasks 1-3

**Interfaces:**
- Consumes: the GTM-only contract from Tasks 1-3.
- Produces: no advertised direct Meta CAPI variables and correct operator guidance.

- [ ] **Step 1: Update the environment and tracking documentation**

Remove retired Meta CAPI environment variables and state that GTM owns GA4, Meta Pixel, and Meta CAPI while the storefront emits ecommerce `dataLayer` events.

- [ ] **Step 2: Run type-check and all affected tests**

Run: `npm run check && node --test client/src/pages/analytics-snippets.test.ts client/src/lib/google-analytics.test.ts api/orders.test.ts server/order-service.test.ts script/vercel-routing.test.mjs`

Expected: PASS. Record unrelated baseline test failures separately.

- [ ] **Step 3: Build and inspect generated output**

Run: `npm run build && git status --short`

Expected: build succeeds. Retain only intentional source, test, documentation, and plan changes.

- [ ] **Step 4: Validate GTM before deployment**

In GTM, retain exactly one GA4 configuration tag for `G-Q7J7KV6ZVC`, one Meta Pixel/CAPI path for `337187585388165`, and one trigger per ecommerce event. Configure SPA page views with a History Change or virtual page-view trigger that does not duplicate the initial page load.

## Review Notes

- The full cleanup is necessary: suppressing duplicate app events cannot prevent separate GTM and app CAPI events from being counted as unique conversions.
- The Merchant Suite tracker remains because its live script only posts first-party visitor pings to the Suite and does not load or call GA4, GTM, or Meta.
- The existing `main` ecommerce payload has no customer PII. Preserve that property rather than changing unrelated confirmation storage.
