# Mobile Hero Edge-to-Edge Design

## Goal

Remove the left and right gap around the homepage hero on mobile screens.

## Decision

The hero media wrapper will use zero horizontal padding below the `md` breakpoint. Its two mobile-only vertical grid lines will move to the viewport edges so they remain aligned with the image.

## Scope

- Keep the existing mobile top spacing (`pt-4`), image border, gradient, and click target.
- Keep all desktop (`md` and above) layout unchanged.
- Do not change any other homepage section or hero asset.

## Verification

- Update the existing source-text hero assertion to require the edge-to-edge mobile classes.
- Run the focused homepage test, TypeScript check, required storefront tests, and production build.
