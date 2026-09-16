# Home Essentials Category Design

## Goal

Add a visible `Home Essentials` category for the Glass Water Bottles With Time Marker product.

## Approved behavior

- Add the `home-essentials` featured collection after Fresh Mango.
- Use the English-only label `Home Essentials`.
- Assign the existing `glass-water-bottles-with-time-marker` product slug to it.
- Resize `/Users/noorkarimmehedi/Downloads/ChatGPT Image Sep 16, 2026, 10_50_18 PM.webp` to `client/public/categories/home-essentials-1-320.webp` and use it as the category thumbnail.
- Preserve the current collection-driven behavior: the category appears only while its assigned product is live, and links to `/collection/home-essentials`.

## Architecture

`FEATURED_COLLECTIONS` remains the single source for the homepage category rail, desktop and mobile navigation, and collection-page filtering. The collection heading renders its Bengali suffix only when one exists, so the English-only label has no empty visual element. Add regression coverage for the new collection definition and product assignment.

## Scope

No product, price, inventory, checkout, API, or database changes are required.
