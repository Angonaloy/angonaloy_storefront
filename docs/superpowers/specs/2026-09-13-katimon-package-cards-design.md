# Katimon Mango Package Cards

## Goal

Add a focused two-package offer below the Katimon Mango hero content and above the existing checkout form.

## Design

The section contains two equal responsive cards:

- **6KG** — **৳1,080**
- **10KG** — **৳1,800**

Each card uses a white background, thin border, restrained rounded corners, compact Swiss-style typography, and a gold accent. The cards stack on narrow screens and sit in two columns on larger screens. Image space is reserved without adding placeholder artwork; final package images will be supplied later.

Each card includes Bengali benefits describing direct-from-orchard sourcing, natural ripening, aroma and sweetness, and chemical-free quality. The call-to-action is **অর্ডার করুন** and links to the existing `#order` checkout section.

## Data and behavior

The cards are presentation-only and do not create a second product or checkout flow. The existing checkout remains authoritative for variant selection, pricing, inventory, delivery charge, and order submission. Clicking either CTA scrolls to the current checkout form.

## Responsive behavior

- Mobile: one card per row, compact spacing, full-width CTA.
- Desktop: two equal cards in one row, balanced spacing and reserved image area.
- The section remains visually consistent with the existing white Swiss-style Katimon landing page.

## Acceptance criteria

- Both confirmed package sizes and prices are visible.
- Bengali benefits are visible under each package.
- Both CTAs scroll to the existing checkout form.
- No package image is invented or required before the user supplies one.
- Existing checkout and other landing-page behavior remain unchanged.
- `npm run check` passes.
