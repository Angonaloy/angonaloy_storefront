# Shared Search Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the shared search popup as a solid-white menu-like overlay on mobile and desktop, with left-aligned typing.

**Architecture:** Keep the existing `isSearchOpen`, suggestion query, submit handler, and Framer Motion tree. Change only responsive overlay/panel/form/input classes in `layout.tsx`, then lock the visual contract with source-level assertions in the existing layout test.

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion, Node test runner via `tsx`.

## Global Constraints

- Both the desktop header search trigger and mobile dock search trigger must continue using the shared `openSearch` handler.
- Mobile search must use a full-screen solid-white surface matching the mobile menu language.
- Desktop search must use a centered solid-white panel without the translucent glass treatment.
- Search input text and caret must start from the left.
- Search suggestions, routing, close behavior, and animations must remain unchanged.
- Do not change the mobile menu, cart drawer, or mobile dock layout.

---

### Task 1: Restyle the shared search overlay

**Files:**
- Modify: `client/src/components/layout.tsx:337-394`
- Test: `client/src/components/layout.test.ts:103-123`

**Interfaces:**
- Consumes: Existing `isSearchOpen`, `searchQuery`, `suggestions`, `submitSearch`, `setIsSearchOpen`, and `setLocation` behavior.
- Produces: The same search interactions with responsive solid-white presentation and left-aligned input.

- [ ] **Step 1: Write the failing regression assertions**

Append these tests to `client/src/components/layout.test.ts`:

```ts
test("uses the mobile menu white treatment for the shared search overlay", () => {
  assert.match(layoutSource, /className="fixed inset-0 z-\[100\][^"]*bg-white/);
  assert.match(layoutSource, /className="w-full max-w-none[^"]*min-h-\[100dvh\][^"]*bg-white[^"]*md:max-w-xl/);
});

test("keeps search typing aligned to the left", () => {
  assert.match(layoutSource, /<form onSubmit=\{submitSearch\} className="[^"]*justify-start/);
  assert.match(layoutSource, /<input[^>]*className="[^"]*text-left/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx tsx --test client/src/components/layout.test.ts`

Expected: FAIL because the current overlay uses the translucent `bg-black/15`, glass panel styling, and does not explicitly set left alignment.

- [ ] **Step 3: Apply the responsive white overlay styling**

Update the existing search overlay classes without changing its event handlers or animation props:

```tsx
className="fixed inset-0 z-[100] flex items-start justify-center bg-white px-5 pt-5 md:bg-black/10 md:px-4 md:pt-[16vh] md:backdrop-blur-md"
```

Update the panel to be full-screen and borderless on mobile, while retaining a centered desktop panel:

```tsx
className="min-h-[100dvh] w-full max-w-none overflow-hidden bg-white px-5 pb-8 pt-5 md:min-h-0 md:max-w-xl md:rounded-2xl md:border md:border-black/10 md:p-3 md:shadow-2xl"
```

Update the form and input to remove the glass styling and force left alignment:

```tsx
className="flex items-center justify-start gap-3 border-b border-black/10 px-0 py-4 md:rounded-xl md:border md:bg-[#fafafa] md:px-4 md:py-3"
```

```tsx
className="min-w-0 flex-1 bg-transparent text-left text-base outline-none placeholder:text-black/40"
```

Keep the existing close button, suggestions, product click handlers, and submit handler intact. Use responsive `md:` classes so desktop remains a focused panel and mobile matches the full-screen menu.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npx tsx --test client/src/components/layout.test.ts`

Expected: PASS with all layout tests passing.

- [ ] **Step 5: Run project verification**

Run: `npm run check && NODE_ENV=production npm run build && git diff --check`

Expected: TypeScript check, production build, and whitespace validation pass. Restore `client/src/lib/generated-storefront-products.ts` if the build refreshes it in this environment.

- [ ] **Step 6: Commit the implementation**

```bash
git add client/src/components/layout.tsx client/src/components/layout.test.ts
git commit -m "fix: align search overlay with mobile menu"
```
