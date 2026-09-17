# Pure Ghee Editorial Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage Pure Ghee editorial copy with responsive supplied artwork linked to the products collection.

**Architecture:** Copy the two provided WebP assets into `client/public/`, then render them through one `<Link href="/products">` and a responsive `<picture>` element. Keep the existing editorial section and reveal wrapper, but remove the overlay and all visible copy.

**Tech Stack:** React, TypeScript, Wouter `Link`, Tailwind CSS, Node test runner, Vite.

## Global Constraints

- Keep the change limited to the Pure Ghee editorial section.
- Use cache-safe asset filenames rather than overwriting an existing image path.
- Preserve responsive mobile/desktop selection and accessible alt text.

---

### Task 1: Replace the Pure Ghee editorial content

**Files:**
- Add: `client/public/pure-ghee-editorial-mobile-20260917.webp`
- Add: `client/public/pure-ghee-editorial-desktop-20260917.webp`
- Modify: `client/src/pages/home.tsx:531-581`
- Test: `client/src/pages/home.test.ts`

**Interfaces:**
- Consumes: the supplied Downloads images and the existing `editorialRef`/`editorialInView` animation state.
- Produces: a full-width responsive image link to `/products` with no visible editorial copy.

- [ ] **Step 1: Copy the supplied images under cache-safe public names**

```bash
cp "$HOME/Downloads/ChatGPT Image Sep 17, 2026, 08_46_06 PM.webp" client/public/pure-ghee-editorial-mobile-20260917.webp
cp "$HOME/Downloads/ChatGPT Image Sep 17, 2026, 08_47_39 PM.webp" client/public/pure-ghee-editorial-desktop-20260917.webp
```

- [ ] **Step 2: Add a source-level regression test**

Add a test that reads `home.tsx` and asserts the editorial section contains both new asset paths and `href="/products"`, while it does not contain the old `curated-edit-bg-mobile.webp`, `curated-edit-bg.webp`, `PURE GHEE`, or `Shop Now` strings in that section.

- [ ] **Step 3: Run the focused test to verify the new assertions fail**

Run: `npx tsx --test client/src/pages/home.test.ts`

Expected: the new editorial asset assertion fails before the component is updated.

- [ ] **Step 4: Implement the responsive linked image**

Replace the editorial section's image, overlay, heading, description, and CTA contents with:

```tsx
<Link href="/products" className="block w-full">
  <picture>
    <source media="(min-width: 768px)" srcSet="/pure-ghee-editorial-desktop-20260917.webp" />
    <img
      src="/pure-ghee-editorial-mobile-20260917.webp"
      alt="Explore all Angonaloy products"
      loading="lazy"
      className="block w-full object-cover"
    />
  </picture>
</Link>
```

Keep the existing `motion.div` wrapper and its reveal state.

- [ ] **Step 5: Run the focused test to verify it passes**

Run: `npx tsx --test client/src/pages/home.test.ts`

Expected: all homepage tests pass.

- [ ] **Step 6: Run project verification**

Run: `npm run check && npm run build && git diff --check`

Expected: TypeScript, production build, and whitespace checks pass.

- [ ] **Step 7: Commit the implementation**

```bash
git add client/public/pure-ghee-editorial-mobile-20260917.webp client/public/pure-ghee-editorial-desktop-20260917.webp client/src/pages/home.tsx client/src/pages/home.test.ts
git commit -m "feat: refresh pure ghee editorial banner"
```
