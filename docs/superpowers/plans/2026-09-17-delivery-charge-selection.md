# Delivery Charge Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Require customers to choose a paid delivery zone before submitting checkout, without changing the automatic free-delivery behavior for orders over ৳2600.

**Architecture:** Keep the existing `deliveryCharge` state and submit validation in `OrderDialog`. Change only the paid-delivery default/reset from `80` to `null`; the existing free-delivery effect continues to set qualifying orders to `0`.

**Tech Stack:** React, TypeScript, Vitest-style Node tests, Vite.

## Global Constraints

- Paid-delivery checkout opens with no delivery option selected.
- Inside Dhaka remains ৳80 and Outside Dhaka remains ৳120.
- Orders meeting the existing ৳2600 threshold keep automatic ৳0 delivery.
- Do not alter API payload pricing, abandoned-cart capture, totals, or analytics after a valid selection.

---

### Task 1: Add the checkout regression test

**Files:**
- Modify: `client/src/components/order-dialog.test.ts` (create if absent)

**Interfaces:**
- Test the source-level behavior in `client/src/components/order-dialog.tsx`, matching the existing storefront test convention.

- [ ] **Step 1: Inspect existing order-dialog tests**

Run:

```bash
find client/src -name 'order-dialog.test.*' -print
```

If no test file exists, create `client/src/components/order-dialog.test.ts` using Node's built-in `node:test` and `node:fs` imports, matching `client/src/pages/product.test.ts`.

- [ ] **Step 2: Write the failing regression test**

Add a test that reads `order-dialog.tsx` and asserts all of the following:

```ts
test("requires a paid delivery option to be selected", () => {
  assert.match(orderDialogSource, /useState<number \| null>\(null\)/);
  assert.match(orderDialogSource, /setDeliveryCharge\(null\)/);
  assert.match(orderDialogSource, /if \(deliveryCharge === null\)/);
});
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run:

```bash
node --test client/src/components/order-dialog.test.ts
```

Expected: FAIL because the implementation still initializes and resets delivery to `80`.

### Task 2: Make paid delivery explicitly selectable

**Files:**
- Modify: `client/src/components/order-dialog.tsx:69,159`

**Interfaces:**
- Preserve `deliveryCharge: number | null`.
- Preserve the existing `deliveryCharge === null` submit guard.
- Preserve the existing `qualifiesForFreeDelivery` effect that sets `0` automatically.

- [ ] **Step 1: Change the initial state**

Replace:

```tsx
const [deliveryCharge, setDeliveryCharge] = useState<number | null>(80);
```

with:

```tsx
const [deliveryCharge, setDeliveryCharge] = useState<number | null>(null);
```

- [ ] **Step 2: Change the dialog reset state**

In `resetDialog`, replace:

```tsx
setDeliveryCharge(80);
```

with:

```tsx
setDeliveryCharge(null);
```

Do not change the free-delivery effect:

```tsx
if (open && qualifiesForFreeDelivery) {
  setDeliveryCharge(0);
}
```

- [ ] **Step 3: Run the focused regression test**

Run:

```bash
node --test client/src/components/order-dialog.test.ts
```

Expected: PASS.

### Task 3: Verify the storefront

**Files:**
- No additional files.

- [ ] **Step 1: Run the full storefront test suite**

Run:

```bash
npm test
```

Expected: all existing storefront tests pass.

- [ ] **Step 2: Build the storefront**

Run:

```bash
npm run build
```

Expected: Vite completes successfully.

- [ ] **Step 3: Inspect the final diff**

Run:

```bash
git diff -- client/src/components/order-dialog.tsx client/src/components/order-dialog.test.ts
```

Confirm only the delivery selection default/reset and its regression test changed.
