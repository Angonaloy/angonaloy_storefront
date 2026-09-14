# All Products Bilingual Title Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the All Products page heading as `All Products-সকল পণ্য` with the existing bilingual styling pattern.

**Architecture:** Keep the change local to `ProductsPage`. Extend the existing source-level page test to protect the exact text and styling, then update only the `<h1>` markup.

**Tech Stack:** React, TypeScript, Tailwind CSS, Node test runner via `tsx`.

## Global Constraints

- Change only the All Products title.
- Preserve product fetching, filtering, grid behavior, navigation, and mobile behavior.
- Use the existing `font-display italic` styling for Bengali title text.
- Do not introduce dependencies.

---

### Task 1: Update the All Products bilingual heading

**Files:**
- Modify: `client/src/pages/products.tsx:33-35`
- Test: `client/src/pages/products-loading.test.ts`

**Interfaces:**
- Consumes: existing ProductsPage heading markup.
- Produces: exact title text `All Products-সকল পণ্য`, with Bengali text wrapped in `font-display italic`.

- [ ] **Step 1: Add the failing regression assertion**

Add a test that reads `products.tsx` and asserts the heading contains `All Products`, `সকল পণ্য`, and `font-display italic`.

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npx tsx --test --test-name-pattern='bilingual All Products title' client/src/pages/products-loading.test.ts
```

Expected: FAIL because the current heading does not contain Bengali title text or its styling class.

- [ ] **Step 3: Implement the minimal heading change**

Replace the current title with:

```tsx
<h1 className="mt-3 text-[clamp(2.2rem,6vw,3.4rem)] font-bold leading-none tracking-[-0.04em] text-black">
  All Products-<span className="font-display italic">সকল পণ্য</span>
</h1>
```

Do not modify surrounding layout or page logic.

- [ ] **Step 4: Run focused and project checks**

Run:

```bash
npx tsx --test --test-name-pattern='bilingual All Products title' client/src/pages/products-loading.test.ts
npm run check
NODE_ENV=production npm run build
git diff --check
```

Expected: the focused test passes, TypeScript exits successfully, the production build completes, and `git diff --check` reports no whitespace errors.
