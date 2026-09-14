# Cart English-Only Copy Design

## Goal

Make the storefront cart drawer English-only across desktop and mobile, while keeping the Continue Shopping action readable on narrow screens.

## Scope

- Remove Bengali companion text from every cart drawer label and message.
- Preserve the existing English wording and cart behavior.
- Add a no-wrap constraint to Continue Shopping actions so the label stays on one line on mobile.
- Cover the copy contract and responsive button class with a focused source-level regression test.

## Components

- `client/src/components/cart-drawer.tsx`: owns all cart drawer copy and responsive presentation. Remove Bengali spans from the header, item metadata/actions, empty state, subtotal area, checkout action, and Continue Shopping actions.
- `client/src/components/cart-drawer.test.tsx` or the existing cart test file: assert that Bengali cart copy is absent and Continue Shopping uses the no-wrap styling. Use the repository's existing lightweight source tests if no component test harness is present.

## Behavior

The cart drawer remains functionally unchanged. Closing the drawer, changing quantities, removing items, opening checkout, and continuing shopping retain their current handlers. Only visible copy and the Continue Shopping label's wrapping behavior change.

## Verification

- Focused cart drawer regression test passes.
- TypeScript check passes.
- Production build passes.
- `git diff --check` reports no whitespace errors.
