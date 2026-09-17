# Homepage Bengali Title Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the homepage Bengali section-title type scale slightly while preserving the existing circled styling and responsive layout.

**Architecture:** Keep the change local to the existing homepage heading class names in `client/src/pages/home.tsx`. Extend the source-level homepage test to lock the smaller responsive ranges, then verify with the project check and build commands.

**Tech Stack:** React, TypeScript, Tailwind utility classes, Node test runner, Vite.

## Global Constraints

- Preserve the existing `IhtishamDeshlipi` Bengali font and yellow circled SVG treatment.
- Change homepage section-heading typography only; do not alter category labels, spacing, or content.
- Keep the existing responsive mobile and desktop breakpoints.

---

### Task 1: Reduce homepage Bengali section-heading sizes

**Files:**
- Modify: `client/src/pages/home.tsx:304-320, 468-482`
- Test: `client/src/pages/home.test.ts:33-45, 227-248`

**Interfaces:**
- Consumes: Existing responsive Tailwind clamp classes for the Featured Categories and Latest Drop headings.
- Produces: Slightly smaller responsive heading ranges validated by source-level tests.

- [ ] **Step 1: Write the failing test**

Update the existing heading-style assertions to expect the smaller mobile-first `1.4rem,4vw,2.15rem` range with `md:text-[clamp(1.9rem,5.2vw,2.8rem)]` for Featured Categories, and add the matching reduced mobile scale assertion for Latest Drop.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --import tsx --test client/src/pages/home.test.ts`

Expected: FAIL because the current homepage still contains the larger heading ranges.

- [ ] **Step 3: Write the minimal implementation**

Change only the two Bengali homepage heading class strings in `client/src/pages/home.tsx` to the smaller mobile-first clamp values from Step 1, leaving the desktop ranges unchanged.

- [ ] **Step 4: Run focused tests and build**

Run: `node --import tsx --test client/src/pages/home.test.ts && npm run check && npm run build`

Expected: All homepage tests pass, TypeScript exits successfully, and the Vite production build completes successfully.

- [ ] **Step 5: Review the diff**

Run: `git diff --check && git diff -- client/src/pages/home.tsx client/src/pages/home.test.ts`

Expected: Only the intended heading-size assertions and class values are changed, with no whitespace errors.
