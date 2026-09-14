# Subtle Homepage Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage blur reveal with a subtle fade-and-lift animation.

**Architecture:** Preserve the existing shared `reveal` variants and IntersectionObserver trigger. Update the variants and their source regression test only.

**Tech Stack:** React, TypeScript, Framer Motion, Node test runner via `tsx`.

## Global Constraints

- Remove the homepage section blur effect.
- Use `translateY(12px)` as the hidden position and `translateY(0)` as the visible position.
- Preserve section triggers, timing, fallback behavior, and mobile layout.
- Do not change the separate highlighted-heading animation.

---

### Task 1: Replace the blur reveal

**Files:**
- Modify: `client/src/pages/home.tsx:103-106`
- Test: `client/src/pages/home.test.ts:263-269`

**Interfaces:**
- Consumes: the existing `reveal` variants used by homepage section motion elements.
- Produces: a shared opacity-and-translation reveal with no CSS filter blur.

- [x] Write the failing regression assertion and verify it fails against the old variants.
- [x] Update the variants to `hidden: { transform: "translateY(12px)", opacity: 0 }` and `visible: { transform: "translateY(0)", opacity: 1 }`.
- [x] Verify the focused test, TypeScript check, production build, and whitespace check.
