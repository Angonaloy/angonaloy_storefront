# Mobile Editorial Text Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the first homepage editorial banner's text and CTA to the centered top on mobile while preserving its desktop layout.

**Architecture:** Adjust the existing responsive Tailwind alignment classes in `client/src/pages/home.tsx`. Extend the source-level homepage regression test in `client/src/pages/home.test.ts` to lock the mobile top alignment and unchanged desktop alignment.

**Tech Stack:** React, Tailwind CSS, TypeScript, Node test runner via `tsx`.

## Global Constraints

- Keep the first editorial banner linked to `/products`.
- Keep the existing copy, responsive artwork, and frosted CTA styling unchanged.
- Change positioning only below the existing `md` breakpoint.
- Use the project's existing homepage test command.

---

### Task 1: Align the first editorial copy at the mobile top

**Files:**
- Modify: `client/src/pages/home.tsx:555-570`
- Test: `client/src/pages/home.test.ts:92-123`

**Interfaces:**
- Consumes: Existing first editorial overlay markup and responsive Tailwind classes.
- Produces: A mobile overlay using centered horizontal alignment and top vertical alignment, with the current `md:` desktop alignment retained.

- [x] **Step 1: Write the failing regression assertion**

Add these assertions to the existing editorial test after the first editorial CTA assertions:

```ts
  assert.match(editorialSource, /absolute inset-0 flex items-start justify-center p-8 text-center md:items-center md:justify-start md:p-12 lg:p-16/);
```

- [x] **Step 2: Run the focused test to verify it fails**

Run: `npx tsx --test client/src/pages/home.test.ts`

Expected: The editorial regression test fails because the current mobile classes use `items-end` and `p-4`.

- [x] **Step 3: Implement the responsive class change**

Change the first editorial overlay wrapper to:

```tsx
<div className="pointer-events-none absolute inset-0 flex items-start justify-center p-8 text-center md:items-center md:justify-start md:p-12 lg:p-16">
```

Leave the inner copy, CTA, link, artwork, and desktop breakpoint behavior unchanged.

- [x] **Step 4: Run the focused test to verify it passes**

Run: `npx tsx --test client/src/pages/home.test.ts`

Expected: All homepage tests pass.

- [x] **Step 5: Run final checks**

Run: `npm run check && git diff --check`

Expected: TypeScript and whitespace checks pass.

- [x] **Step 6: Commit the implementation**

```bash
git add client/src/pages/home.tsx client/src/pages/home.test.ts
git commit -m "fix: center first editorial copy on mobile"
```
