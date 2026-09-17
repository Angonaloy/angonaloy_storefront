# Pure Ghee Editorial Image Design

## Goal

Replace the homepage Pure Ghee editorial banner with supplied responsive artwork and original Angonaloy home-and-kitchen brand copy, while making the complete banner link to the products collection.

## Behavior

- The editorial section remains in the same homepage position and keeps its existing reveal animation.
- Mobile view uses `pure-ghee-editorial-mobile-20260917.webp`.
- Desktop view uses `pure-ghee-editorial-desktop-20260917.webp`.
- The image has direct text over the artwork and a strongly frosted-glass button containing:
  - `FOR THE HEART OF HOME`
  - `ঘর ও রান্নাঘরের প্রতিদিনের জন্য বেছে নেওয়া সুন্দর, দরকারি জিনিস।`
  - `EXPLORE HOME & KITCHEN`
- The CTA is part of one link to `/products`; no nested interactive elements are used.
- The image has meaningful alt text for assistive technology.

## Implementation boundary

- Add the two source images to `client/public/` under cache-safe names.
- Update only the editorial section in `client/src/pages/home.tsx`.
- Preserve the existing section wrapper and responsive full-width image treatment.
- Add a source-level regression assertion for the asset paths, `/products` link, button glass styling, and new copy.

## Success criteria

- Mobile and desktop requests select their respective image assets.
- Clicking anywhere in the editorial image navigates to `/products`.
- No old Pure Ghee heading, description, Shop Now button, or dark overlay remains in this section.
- Typecheck, focused tests, and production build pass.
