# Functional Food Category Design

## Goal

Create a visible `Functional Food-ফাংশনাল ফুড` category for the Kalojira Mixed and Beetroot Powder products.

## Approved behavior

- Add the collection slug `functional-food`.
- Use the label `Functional Food-ফাংশনাল ফুড`.
- Assign `kalojira-mixed` and `beetroot-powder` to this collection.
- Remove those two products from `homemade` so every product remains assigned to one collection.
- Place Functional Food after Homemade in the featured collection order and homepage category sequence.
- Use the existing generic category fallback image until dedicated artwork is provided.

## Architecture

The existing `getVisibleFeaturedCollections()` helper will make the collection appear in Featured Categories when either product exists in the catalog. `layout.tsx` already derives desktop navigation and the mobile Menu from that helper, so no navigation component change is needed. Add the homepage render call and regression coverage for collection assignments, visibility, ordering, and the label.

No product data, pricing, checkout, API, or database changes are required.
