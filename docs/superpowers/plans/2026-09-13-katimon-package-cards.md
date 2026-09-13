# Katimon Package Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add two responsive Katimon mango package cards below the hero copy and above checkout.

**Architecture:** Keep the cards local to `KatimonMangoPage`; they are presentation-only and link to the existing `#order` checkout. Use confirmed package sizes/prices and Bengali benefit copy, with reserved image space for later assets.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vite, Vitest.

## Global Constraints

- Preserve the existing checkout as the source of truth for variants, inventory, delivery charge, and order submission.
- Do not add placeholder package images.
- Use Bengali copy and the existing white Swiss-style visual language.
- Keep existing landing pages unchanged.

---

### Task 1: Add package-card section

**Files:**
- Modify: `client/src/pages/katimon-mango.tsx`

**Interfaces:**
- Consumes: existing page product data and checkout anchor `#order`.
- Produces: two responsive offer cards for `6KG` and `10KG`.

- [ ] **Step 1: Add the section below the hero copy**

Insert a section before the product description using two cards with:

```tsx
<section aria-labelledby="katimon-packages" className="mx-auto max-w-6xl px-5 pb-16">
  <h2 id="katimon-packages">আপনার পছন্দের প্যাক বেছে নিন</h2>
  <div className="grid gap-4 md:grid-cols-2">
    {/* 6KG and 10KG cards */}
  </div>
</section>
```

Each card must show the size, price, Bengali benefits, an empty reserved image area, and an `অর্ডার করুন` link with `href="#order"`.

- [ ] **Step 2: Verify the source and layout classes**

Run `npm run check`.

Expected: TypeScript passes with no errors.

- [ ] **Step 3: Commit the implementation**

```bash
git add client/src/pages/katimon-mango.tsx
git commit -m "feat: add Katimon mango package cards"
```

### Task 2: Verify the landing page

**Files:**
- Test: `client/src/pages/katimon-mango.tsx`

- [ ] **Step 1: Build the storefront**

Run `npm run build`.

Expected: Vite production build completes successfully.

- [ ] **Step 2: Confirm the existing checkout anchor remains intact**

Run `rg -n 'id="order"|href="#order"|6KG|10KG|৳1,080|৳1,800' client/src/pages/katimon-mango.tsx`.

Expected: both package CTAs target `#order`, both sizes and prices are present, and the checkout section still has `id="order"`.
