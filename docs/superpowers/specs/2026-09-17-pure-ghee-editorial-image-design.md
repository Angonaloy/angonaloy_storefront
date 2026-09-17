# Pure Ghee Editorial Image Design

## Goal

Replace the homepage Pure Ghee editorial banner's copy and CTA with supplied responsive artwork, while making the complete banner link to the products collection.

## Behavior

- The editorial section remains in the same homepage position and keeps its existing reveal animation.
- Mobile view uses `pure-ghee-editorial-mobile-20260917.webp`.
- Desktop view uses `pure-ghee-editorial-desktop-20260917.webp`.
- The image has no dark overlay, heading, description, or visible button.
- The whole image is one link to `/products`.
- The image has meaningful alt text for assistive technology.

## Implementation boundary

- Add the two source images to `client/public/` under cache-safe names.
- Update only the editorial section in `client/src/pages/home.tsx`.
- Preserve the existing section wrapper and responsive full-width image treatment.
- Add a source-level regression assertion that the new asset paths and `/products` link are present and the old Pure Ghee copy is absent.

## Success criteria

- Mobile and desktop requests select their respective image assets.
- Clicking anywhere in the editorial image navigates to `/products`.
- No Pure Ghee heading, description, Shop Now button, or dark overlay remains in this section.
- Typecheck, focused tests, and production build pass.
