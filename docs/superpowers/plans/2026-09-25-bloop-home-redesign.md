# Homepage redesign — Bloop (Shopify Avante) style

Reference: https://themes.shopify.com/themes/avante/presets/bloop (demo: food-preset-staylime.myshopify.com)

## Decisions (from the user, 2026-09-25)
- Colours: Bloop palette built around the existing Angonaloy red `#D92C2D`.
- Type: bold English grotesk headlines + italic serif accent, with a real Bangla webfont for Bangla lines.
- Top of page: Bloop-style (category bubbles → giant headline → rounded image mosaic).
- Header, announcement bar and footer are restyled as well (they're shared with every page).

## Design tokens (add to `client/src/index.css` `@theme inline`)
| Token | Value | Use |
|---|---|---|
| `--color-bloop-cream` | `#FFFBF1` | page background (replaces `#f6f6f6` on home + chrome) |
| `--color-bloop-card` | `#F6F1E4` | product image tile background |
| `--color-bloop-red` | `#D92C2D` | headings, buttons, prices, footer bg |
| `--color-bloop-orange` | `#F08A3C` | end stop of red→orange heading gradient |
| `--color-bloop-purple` | `#4B2E83` | colour-block section bg, marquee text |
| `--color-bloop-lime` | `#E8F78F` | "Best Sellers" tile, pill on photos |
| `--color-bloop-yellow` | `#F6C84C` | announcement bar |
| `--color-bloop-ink` | `#1F1A17` | body text |
| gradient | `linear-gradient(90deg,#6CF7B2,#C9F77A,#FFF35C)` | highlights band |

Fonts (Google Fonts, add to the existing `<link>` in `client/index.html`):
- `Bricolage Grotesque` 600–800 → `--font-bloop` (headlines, tracking `-0.04em`, leading `0.95`)
- `DM Serif Display` regular + italic → `--font-bloop-serif` (accent words)
- `Anek Bangla` 500–700 → `--font-bangla` (all Bangla copy on the homepage)
- Body stays Inter.

Utility classes in `index.css`: `.bloop-gradient-text` (red→orange text clip), `.bloop-pill` (rounded-full, 2px border, semibold), `.bloop-marquee` (CSS keyframe scroll; paused under `prefers-reduced-motion`).

## Homepage (`client/src/pages/home.tsx`) — new order
1. **Category bubbles** — `visibleFeaturedCollections`, 64px (mobile 84px) circles with a 3px orange ring, 2-line label; horizontal scroll on mobile, centred row on desktop. Replaces the current "আমাদের ক্যাটাগরিসমূহ" block.
2. **Headline** — `Angonaloy—Made for Home` (grotesk, gradient) / `and Everyday Living` (serif). Bangla sub-line `আপনার ঘর ও জীবনযাত্রার জন্য একটি সম্পূর্ণ সমাধান` in Anek Bangla. Outlined red pill "Explore" → `/products`. Keep an `<h1>`.
3. **Image mosaic** (rounded `28px`, 4px gaps) using existing assets only: large tile `hero-desktop.webp` ("Everything for your kitchen" + lime pill "Shop the collection" → `/products`); two small tiles `pure-ghee-editorial-*` and `glass-bottle-editorial-*` with white label + underlined link (existing hrefs); lime "Best Sellers" type tile → `/collection/top-selling-products`. Mobile: stacks like Bloop (big tile, 2 small side by side, best-sellers block).
4. **Best sellers grid** — eyebrow `POPULAR CHOICE`, red grotesk heading `Best Sellers` + Bangla `সবচেয়ে জনপ্রিয় পণ্য`, red pill "View all". `topSellingProducts.slice(0, 8)`, 2 cols mobile / 4 desktop.
5. **Highlights band** — mint→yellow gradient, purple heading "Why Angonaloy", 3 icon features (lucide) using only claims already on the site (free shipping over ৳2600, the footer trust badges), then a purple marquee of short brand phrases.
6. **New arrivals grid** — same pattern as 4 with `homepageProducts.slice(0, 4)`.
7. **Shop by category list** — eyebrow `SHOP BY CATEGORY`, huge red stacked collection names separated by thin rules, each linking to `/collection/{slug}`, "View all" pill.
8. **Category sections** (`renderCategorySection`, unchanged data logic) restyled to the new heading + card pattern.
9. **Purple colour block** — ghee editorial image left (rounded), right: lime→mint gradient heading "For the Heart of Home", Bangla line, lime pill "Explore" (replaces the current full-bleed ghee banner).
10. Remaining category sections, glass-bottle banner restyled as a rounded split with lime bg, `RecentlyViewed`.

Keep: live catalog query + snapshot `initialData`, loading skeletons, error state, `useReveal`, no hardcoded product data.
Remove from home: `HighlightedWord`, the yellow scribble SVGs, `HERO_CTA_CLASS_NAME` if unused (keep `.hero-frosted-cta` CSS only if another file uses it).

## Product card (`client/src/components/home-product-card.tsx`)
Used by home, `product.tsx`, `recently-viewed.tsx`, `storefront-product-card.tsx` — change is intentional site-wide.
- Image tile: `aspect-[4/5]`, `rounded-[20px]`, `bg-bloop-card`, gentle hover scale.
- `SALE` red micro-label top-left when discounted; existing "Sold out" badge restyled as a pill.
- Centred text: name (Inter semibold 14/15px, sentence case, 2-line clamp), price row `৳580` red when discounted + grey strikethrough compare price; no "Save" chip.
- Button: full-width red `rounded-full` pill "Add to cart" with `BagIcon`, black on hover. Keep all `addToCart` / analytics logic identical.

## Chrome (`client/src/components/layout.tsx`)
- Announcement bar: `bg-bloop-yellow`, red bold uppercase text, no black border.
- Nav: `bg-bloop-cream`, red link text, semibold. Keep existing structure/behaviour (search, cart, mobile bottom bar, drawer); do not re-architect.
- Footer: `bg-bloop-red`, cream text, remove background photo overlays, large grotesk column headings, keep every existing link, logo in cream.

## Files touched
- `client/index.html`
- `client/src/index.css`
- `client/src/pages/home.tsx`
- `client/src/components/home-product-card.tsx`
- `client/src/components/layout.tsx`
- Tests whose source-text assertions describe changed markup: `client/src/pages/home.test.ts`, `client/src/components/home-product-card.test.ts`, `client/src/components/layout.test.ts`, plus any other `*.test.ts` that asserts on these files (update assertions to the new markup; never delete behavioural coverage).

Not touched: `hero.tsx` (dead code), product/catalog API code, checkout, `.env`.

## Verify
1. `npm run check` → no errors (baseline: clean).
2. `node --test client/src/**/*.test.ts` → all pass (baseline for home/card/layout: 40/40).
3. Desktop 1440px + mobile 390px screenshots of `http://localhost:5003/` compared against the reference shots.
4. `git status` shows only the files above.
