# Katimon WhatsApp Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every WhatsApp action on the Katimon landing page open WhatsApp with the exact Katimon order message while leaving other campaigns unchanged.

**Architecture:** Define a Katimon-specific encoded WhatsApp href in the Katimon page module. Extend the shared Kalojira checkout with an optional `whatsappHref` prop that defaults to the existing Kalojira href, then pass the Katimon href only from `KatimonMangoPage`; direct Katimon header, hero, and footer anchors to that href.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Node test runner, existing `lucide-react`/WhatsApp icon components.

## Global Constraints

- Exact message: `কাটিমন আম | Katimon Mango অর্ডার করতে চাই`.
- Encode the message with `encodeURIComponent`.
- Do not change Kalojira, Sundarbans Honey, Honey Nut, or site-wide WhatsApp messages.
- Keep gold hero/package CTAs as smooth-scroll links to `#order`.

---

### Task 1: Add Katimon-specific WhatsApp href wiring

**Files:**
- Create: `client/src/pages/katimon-mango.test.ts`
- Modify: `client/src/pages/katimon-mango.tsx`
- Modify: `client/src/features/kalojira-mixed/kalojira-checkout.tsx`

**Interfaces:**
- `KatimonMangoPage` consumes `KATIMON_CAMPAIGN_WHATSAPP_HREF` for its header, hero, footer, and checkout prop.
- `KalojiraCheckout` produces its existing default behavior when `whatsappHref` is omitted and uses the supplied href for both support-action instances.

- [ ] **Step 1: Write the failing source-level tests**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("./katimon-mango.tsx", import.meta.url), "utf8");
const checkoutSource = readFileSync(new URL("../features/kalojira-mixed/kalojira-checkout.tsx", import.meta.url), "utf8");

test("Katimon WhatsApp href uses the exact Bengali order message", () => {
  assert.match(pageSource, /KATIMON_CAMPAIGN_WHATSAPP_HREF/);
  assert.match(pageSource, /কাটিমন আম \| Katimon Mango অর্ডার করতে চাই/);
  assert.match(pageSource, /encodeURIComponent/);
});

test("Katimon header, hero, footer, and checkout use the Katimon WhatsApp href", () => {
  assert.ok((pageSource.match(/href=\{KATIMON_CAMPAIGN_WHATSAPP_HREF\}/g) ?? []).length >= 3);
  assert.match(pageSource, /<KalojiraCheckout[\s\S]*whatsappHref=\{KATIMON_CAMPAIGN_WHATSAPP_HREF\}/);
  assert.match(pageSource, /<a href=\{KATIMON_CAMPAIGN_WHATSAPP_HREF\}[^>]*>[\s\S]*WhatsAppBrandIcon/);
  assert.match(checkoutSource, /whatsappHref\?: string/);
  assert.match(checkoutSource, /href=\{whatsappHref\}/);
});

test("Katimon gold order CTAs remain checkout scroll actions", () => {
  assert.ok((pageSource.match(/href="#order" onClick=\{handleOrderClick\}/g) ?? []).length >= 3);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node --import tsx --test client/src/pages/katimon-mango.test.ts`

Expected: FAIL because the Katimon-specific href and checkout override do not exist yet.

- [ ] **Step 3: Implement the shared checkout override**

In `client/src/features/kalojira-mixed/kalojira-checkout.tsx`, change the support action signature and href selection:

```tsx
function SupportActions({ placement, whatsappHref }: { placement: string; whatsappHref: string }) {
  // preserve the existing phone link and tracking; only use the supplied WhatsApp href
  // for this campaign's support action.
  return (
    // existing JSX with the WhatsApp anchor changed to:
    <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
      {/* existing icon, tracking handler, and label */}
    </a>
  );
}

export function KalojiraCheckout({
  product,
  status,
  productQuery,
  inventoryQuery,
  onRetry,
  deliveryCharge = KALOJIRA_DELIVERY_CHARGE,
  whatsappHref = WHATSAPP_HREF,
}: KalojiraCheckoutProps & { deliveryCharge?: number; whatsappHref?: string }) {
  // pass whatsappHref to both existing SupportActions calls
}
```

- [ ] **Step 4: Add the Katimon href and wire all Katimon WhatsApp controls**

In `client/src/pages/katimon-mango.tsx`, define and use:

```ts
const KATIMON_CAMPAIGN_WHATSAPP_HREF =
  `https://wa.me/8801301636461?text=${encodeURIComponent("কাটিমন আম | Katimon Mango অর্ডার করতে চাই")}`;
```

Use `href={KATIMON_CAMPAIGN_WHATSAPP_HREF}` for the header and footer WhatsApp anchors. Change only the hero WhatsApp-styled anchor from the current `href="#order"`/`onClick={handleOrderClick}` pair to the Katimon href with `target="_blank"` and `rel="noopener noreferrer"`, retaining its icon and button styling. Pass `whatsappHref={KATIMON_CAMPAIGN_WHATSAPP_HREF}` to `KalojiraCheckout`.

- [ ] **Step 5: Run the focused test and confirm it passes**

Run: `node --import tsx --test client/src/pages/katimon-mango.test.ts`

Expected: PASS for all Katimon WhatsApp and CTA wiring assertions.

- [ ] **Step 6: Commit the implementation**

```bash
git add client/src/pages/katimon-mango.test.ts client/src/pages/katimon-mango.tsx client/src/features/kalojira-mixed/kalojira-checkout.tsx docs/superpowers/specs/2026-09-13-katimon-whatsapp-links-design.md docs/superpowers/plans/2026-09-13-katimon-whatsapp-links.md
git commit -m "fix: wire Katimon WhatsApp order links"
```

### Task 2: Run final verification

**Files:**
- Verify: `client/src/pages/katimon-mango.test.ts`
- Verify: `client/src/pages/katimon-mango.tsx`
- Verify: `client/src/features/kalojira-mixed/kalojira-checkout.tsx`

**Interfaces:**
- No additional runtime interfaces; this task validates Task 1 without changing its scope.

- [ ] **Step 1: Run TypeScript validation**

Run: `npm run check`

Expected: exit code 0.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: exit code 0 and Vite/server bundles are generated.

- [ ] **Step 3: Confirm unrelated campaign messages remain unchanged**

Run: `git diff -- client/src/features/kalojira-mixed/content.ts client/src/features/sundarbans-honey/content.ts client/src/features/honey-nut/content.ts client/src/lib/site-pages.ts`

Expected: no diff in those files.
