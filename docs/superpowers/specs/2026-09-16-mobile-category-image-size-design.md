# Mobile Category Image Size Design

## Goal

Make category imagery in the homepage `আমাদের ক্যাটাগরিসমূহ` rail more prominent on mobile.

## Approved behavior

- Increase each category image from 104px to 120px below the `sm` breakpoint.
- Increase each mobile category link's width to 120px so its tap target matches the image.
- Preserve the horizontal, snap-scroll category rail on mobile.
- Preserve the existing 112px image size and layout from `sm` upward.

## Scope

Update only the mobile utility classes in `client/src/pages/home.tsx` and its source-level regression coverage. Do not change category order, product assignments, imagery, or desktop/tablet layout.
