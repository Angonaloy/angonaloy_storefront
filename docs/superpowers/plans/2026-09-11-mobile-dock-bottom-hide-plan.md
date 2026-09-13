# Mobile Dock Bottom Hide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the main storefront mobile navigation dock at the bottom of the page with a smooth Framer Motion transition while leaving desktop behavior unchanged.

**Architecture:** `Layout` will track document-bottom visibility and animate its existing mobile navigation with `motion.nav` using `y: 0` and `y: "110%"`. The existing `md:hidden` class remains the desktop boundary.

**Tech Stack:** React, TypeScript, Framer Motion, CSS media queries, Node test runner via `tsx`.

## Global Constraints

- Apply to the global mobile navigation dock in `client/src/components/layout.tsx`.
- Hide when the document bottom is reached.
- Use Framer Motion for the mobile hide/show transition.
- Do not change desktop behavior at `min-width: 768px`.
- Respect `prefers-reduced-motion`.

---

### Task 1: Add bottom detection and Framer Motion to the global dock

**Files:**
- Modify: `client/src/components/layout.tsx`
- Test: `client/src/components/layout.test.ts`

**Interfaces:**
- Consumes: the existing `Layout` location state and mobile navigation markup.
- Produces: `atPageBottom` state and a Framer Motion `motion.nav` animation.

- [x] Add a passive scroll listener that updates bottom state when `window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24`, with resize and route-change support plus cleanup.
- [x] Import `useReducedMotion` and render the existing dock as `motion.nav` with `initial={false}` and `animate={{ y: isAtPageBottom ? "110%" : 0 }}`.
- [x] Preserve all existing links, cart behavior, dock classes, and `md:hidden` desktop boundary.

### Task 2: Add regression coverage

**Files:**
- Modify: `client/src/components/layout.test.ts`

- [x] Assert the layout has bottom detection, Framer Motion animation, and the existing mobile-only class.
- [x] Run the focused layout test and TypeScript validation.

### Task 3: Verify and commit

- [x] Run `git diff --check`.
- [x] Run the focused test and `npm run check`.
- [ ] Run the production build and confirm no generated data-file changes were introduced.
- [ ] Commit with `feat: hide main mobile dock at page bottom`.
