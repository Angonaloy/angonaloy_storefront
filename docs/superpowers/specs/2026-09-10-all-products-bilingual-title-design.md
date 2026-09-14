# All Products Bilingual Title Design

## Goal

Present the All Products page title in both English and Bengali while preserving the existing page structure and product behavior.

## Design

Change the heading from `All Products` to `All Products-সকল পণ্য`. Keep the English portion in the existing bold heading style and render the Bengali portion with the established italic display treatment used by collection headings. Do not change the `Shop` eyebrow, product query, filtering, grid, navigation, or mobile layout.

## Verification

Add a source regression assertion for the exact bilingual title and its styling classes. Run the focused page test, TypeScript checking, the production build, and `git diff --check`.
