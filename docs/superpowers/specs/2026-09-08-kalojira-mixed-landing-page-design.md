# Kalojira Mixed Landing Page Design

## Goal

Add a dedicated conversion-focused campaign page at
`/step/kalojira-mixed`, visually and behaviorally related to the existing
`/step/sundarbans-natural-honey` page, but with Kalojira Mixed-specific content,
assets, colors, and messaging from the supplied 14-page blueprint.

The product already exists in Merchant Suite and remains the source of truth for
price, variant availability, inventory, and product identity.

## Product source of truth

- Product slug: `kalojira-mixed`
- Merchant Suite product: `কালোজিরা মিক্সড | Kalojira Mixed`
- Live variants currently resolve to 500g at ৳990 and 1kg at ৳1,600.
- The page must read product and inventory through the existing public catalog
  API helpers. It must not hardcode prices, stock, or variant IDs.
- The supplied jar images will be used as-is, including the visible 400g label.
  On-page purchase options will still reflect the live Merchant Suite variants.

## Page experience

The page is a standalone campaign surface with no normal storefront navigation
or product-page chrome. It uses the existing campaign conventions: warm editorial
layout, Framer Motion for restrained transitions, responsive one-column mobile
layout, accessible buttons and accordion behavior, and a sticky mobile order bar.

### Sections

1. **Hero** — split desktop layout with Bengali campaign title, concise
   ingredient-led positioning, live pack prices, free-delivery message, primary
   order CTA, and a supplied product hero image. Mobile places copy and CTA before
   the image.
2. **Product story** — problem, convenience, and honest food-mix positioning.
3. **Ingredient transparency** — the eight ingredients, using the supplied
   ingredient infographic and real product/ingredient photography. Copy explains
   food context without medical promises.
4. **Nutrition and practical reasons** — category-first explanation of fruit,
   carbohydrate-containing, plant-compound, and fat-containing ingredients.
5. **Who may consider it** — practical audience groups from the blueprint.
6. **Expert section** — supplied nutritionist portrait, credentials, and a
   carefully edited statement that positions the product as food, not medicine.
7. **Customer experiences** — Bengali demo cards with star ratings and Bengali
   names, each visibly labeled as a demo placeholder and not a verified customer
   review. This makes later replacement with approved customer material a data-only
   content edit and avoids presenting invented testimonials as genuine.
8. **Serving guidance** — simple daily-use guidance with a lifestyle-first note
   and no treatment claims.
9. **FAQ** — short Bengali answers covering ingredients, product category, sizes,
   delivery, and storage; one answer open at a time.
10. **Final order** — live pack selection and shared checkout behavior, with the
    1kg value pack visually emphasized and the mobile bar showing selected pack and
    current price.

The product video and process/packing sections from the blueprint are deliberately
omitted until the user supplies those assets. No stock icons or fabricated process
imagery will be used.

## Components and boundaries

Create a new `client/src/features/kalojira-mixed/` feature area containing:

- `content.ts` for campaign copy, ingredient data, FAQ data, audience points,
  serving guidance, and clearly labeled demo review placeholders.
- `campaign-layout.tsx` for campaign header/footer framing.
- `documentary-sections.tsx` for the narrative sections and asset presentation.
- `kalojira-checkout.tsx` and supporting order/state modules for campaign-specific
  labels and tracking while preserving the existing custom-order payload contract.
- `tracking.ts` for a distinct `kalojira_mixed` campaign identifier.
- focused tests for route wiring, source copy/asset references, checkout state, and
  tracking payloads.

The page entry point will be
`client/src/pages/kalojira-mixed.tsx`, and the route plus metadata will be added
to `client/src/App.tsx` using this repository's existing wouter conventions.

The checkout implementation may share extracted order/inventory primitives with
the Sundarbans campaign, but campaign copy, event names, storage keys, and
confirmation wording must remain distinct so the two campaigns cannot overwrite
each other's state or analytics.

## Asset plan

Copy the supplied assets from
`/Users/noorkarimmehedi/Downloads/untitled folder 6` into the versioned campaign
asset directory `client/public/step/kalojira-mixed/`, optimizing them for web
delivery without altering their visual content. Use stable descriptive filenames:

- product-white hero shot
- ingredient infographic
- warm studio product shot
- product-with-plants shot
- product-in-hand expert shot
- ingredients-and-product composition
- nutritionist portrait

The exact source images remain unchanged; only format/size optimization and file
names may change. The hero image should be prioritized for loading, while below-
fold images use lazy loading and descriptive Bengali alt text.

## Content and claims

The PDF is the content source, with light rewriting for clarity and conversion.
The page will consistently describe Kalojira Mixed as a food mix made from eight
familiar ingredients. It will not claim to cure disease, guarantee outcomes, or
replace medical care. Ingredient descriptions will stay nutrition- and routine-
focused.

Demo review cards must carry an explicit Bengali label such as
`ডেমো রিভিউ — প্রকৃত গ্রাহক মতামত নয়` until approved customer material replaces
them.

## Data and checkout flow

1. Page requests `kalojira-mixed` using the existing catalog helper.
2. Page requests authoritative inventory using the existing inventory helper and
   merges it with product data.
3. UI derives orderable pack options from live variants; sold-out options are
   disabled using the existing orderability rules.
4. Customer submits the existing custom-store order flow with the selected live
   variant, quantity, name, phone, and address.
5. Successful checkout stores a Kalojira-specific confirmation and routes to a
   Kalojira thank-you page or campaign-specific confirmation state.
6. Product/checkout failures show retry and support actions without exposing
   credentials or internal API details.

## Accessibility and responsive behavior

- Semantic main/section headings and Bengali alt text for all meaningful images.
- Minimum 44px touch targets for CTAs, accordion controls, and mobile bar actions.
- Visible keyboard focus states and `aria-expanded`/`aria-controls` on FAQ items.
- Respect `prefers-reduced-motion` for scroll, carousel, and section transitions.
- Desktop uses the 55/45 hero split and generous spacing; mobile uses a single
  column with the sticky order bar and no horizontal overflow.

## Verification criteria

- Route resolves at `/step/kalojira-mixed` and does not change the existing
  Sundarbans route.
- Live Merchant Suite product and inventory determine displayed price,
  availability, and variant selection.
- All supplied campaign assets render from versioned paths with no missing-image
  errors.
- Demo reviews are visibly labeled and contain no claim that they are verified.
- Product video and process/packing sections are absent.
- Checkout success, unavailable-product, sold-out, validation, retry, and
  thank-you states are covered by tests.
- `npm run check`, relevant `node --test` files, and `npm run build` pass.
