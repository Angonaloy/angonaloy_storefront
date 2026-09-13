# Homepage Heading Size Design

## Goal

Reduce the visual size of all homepage section headings so Featured Categories, Best Sellers, Newly Added, collection, and editorial sections have more breathing room without changing the hero or product-card typography.

## Design

- Apply one reduced responsive heading scale to every homepage section heading.
- Reduce the mobile heading range by about 10%, from `1.5rem–2.4rem` to `1.35rem–2.15rem`.
- Reduce the desktop heading range by about 10%, from `1.65rem–2.6rem` to `1.5rem–2.35rem`.
- Keep Bengali highlighted words italic, gold, and aligned with their English heading counterparts.
- Preserve section spacing, line breaks, links, animation, and all non-heading typography.

## Verification

- Add source-level regression assertions for the reduced shared scales.
- Run the focused homepage tests.
- Run the TypeScript check, production build, and whitespace validation.
