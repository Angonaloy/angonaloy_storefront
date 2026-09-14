# Shared Search Overlay Design

## Goal

Make the search popup opened from either the desktop header or mobile dock use the same solid-white menu language, with left-aligned typing on every viewport.

## Scope

- Keep the existing search query state, product suggestions, submit routing, close behavior, and Framer Motion transitions.
- Replace the translucent glass overlay/panel styling with a solid white search surface.
- Use a full-screen white search surface on mobile, matching the mobile menu's visual treatment.
- Use a centered solid-white panel on desktop, preserving a focused max width.
- Explicitly align the form and input to the left so the caret and entered text begin at the search field's left edge.
- Keep the mobile navigation menu and cart drawer unchanged.

## Components

- `client/src/components/layout.tsx`: owns the shared search overlay rendered for both search triggers. Update only the overlay's responsive layout and styling classes.
- `client/src/components/layout.test.ts`: add source-level regression assertions for the solid white overlay, mobile full-screen layout, desktop panel sizing, and left-aligned input.

## Behavior

Search remains dismissible by the close button or backdrop, supports product suggestion selection, and routes submitted queries to `/products?search=...`. No search data flow or navigation behavior changes.

## Verification

- Focused layout tests pass.
- TypeScript check passes.
- Production build passes.
- `git diff --check` reports no whitespace errors.
