# Compact Glass Bottle Bundle Cards

## Goal

Make the two bundle-selection cards on the Glass Water Bottles With Time Marker
product page shorter and more polished, while leaving product behavior and all
other product pages unchanged.

## Design

- Keep the existing two-column bundle layout and selection behavior.
- Reduce card vertical padding and internal gaps so both cards occupy less
  height.
- Keep the price as the strongest text element, with a clear piece label above
  it and the crossed-out regular total below or beside it where applicable.
- Keep the savings badge, but make it compact and align it cleanly within the
  card instead of letting it dominate the card height.
- Use a thin red selected border with a soft red-tinted background; retain a
  neutral white unselected state with a subtle hover border.
- Implement the styling inline in the existing product-page JSX. Do not create
  a shared component or alter other product variants.

## Interaction and scope

The cards continue to set the existing `quantity` state and use the current
pricing, cart, checkout, and analytics logic. Only the branch guarded by
`isGlassWaterBottleMuxProduct` changes visually.

## Verification

- Update the source-based product-page test only if needed to assert the new
  compact card classes.
- Run `npm run check`.
- Run the product, homepage, and storefront-products Node tests.
- Run `npm run build` and confirm no unexpected generated catalog changes.
