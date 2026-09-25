# Product page redesign — Bloop style

Reference: https://food-preset-staylime.myshopify.com/products/blueberry-brain (Bloop preset, Avante theme).
Continues `2026-09-25-bloop-home-redesign.md` (tokens, fonts, product card, header, footer already done).

## Rulings (no user input needed; reversible)
- Keep every commerce behaviour: variant/size selection, bundle offers (keep their current "Tk" pricing copy — it was an intentional recent commit), quantity, Add to cart, COD order dialog, phone + WhatsApp order links, delivery timeline, live inventory/`verifyOrderable`, analytics, recently-viewed recording, reels (Mux), related products, RecentlyViewed, OrderDialog. Restyle only.
- Only real data. Do not add Bloop sections we have no data for (certification badges, nutrition facts, formula/ingredients copy, packaging block, stockists).
- Low-stock line ("Only N left in stock") only when inventory reports a real `stock_quantity` ≤ 10 for the selected variant/product.

## Layout
### Above the fold (desktop ≥1024px)
- Left (≈7/12): gallery. First image large, `rounded-[28px]`, `bg-bloop-card`; remaining images below in a 2-col grid with the same radius, 8px gaps. Column is sticky (`lg:sticky top-[header]`) only if the info column is taller.
- Right (≈5/12, max ~420px content width, like Bloop's narrow buy box):
  1. Breadcrumb: Home / Products / {name} — Bricolage 12–13px bold, ink, "/" separators.
  2. `<h1>` name: Bricolage 700, ~40px, tracking −0.02em, `text-bloop-red`.
  3. Short description: DM Sans 14px, ink/80, leading 1.6.
  4. Price: Bricolage 700 24px ink (keep the animated `Counter`), compare-at price grey strikethrough; if discounted, price in red.
  5. Size/variant: label "Size — {selected}" (DM Sans 13px), options as pill buttons (`rounded-full`, 2px border ink when selected, transparent border otherwise, uppercase 12px bold) — keep price per option in small text if it differs.
  6. Bundle offers (when present): radio cards restyled — `rounded-[20px]`, 2px border, selected = red border + cream fill, Bricolage label.
  7. Low-stock line in red + a thin ink progress rule under it (when applicable).
  8. Quantity stepper: pill outline (2px ink, rounded-full, 44px tall, ~128px wide).
  9. Primary CTA: full-width red pill, 52px, Bricolage 700 17px — **"ক্যাশ অন ডেলিভারিতে অর্ডার করুন"** (opens order dialog). Secondary: full-width outlined red pill "Add to cart" (existing add-to-cart handler).
  10. "অথবা" divider, then phone + WhatsApp as two outlined pills (icon + label), same height 44px.
  11. Delivery timeline restyled: three steps in a `rounded-[20px] bg-bloop-card` panel, icons red, Bangla labels in `font-bangla`.
  12. Share row (Facebook / WhatsApp / copy-link) small 24px ink icons — only if cheap; optional.
- Mobile: gallery as the existing swipe carousel but `rounded-[20px]`, full-width with 16px gutters, thumbnails replaced by a thin progress bar under the image (Bloop style); then the same buy box stack at 16px gutters.
- Mobile sticky mini bar (Bloop): when the primary CTA scrolls out of view, show a bottom bar with thumbnail, name, price, selected size and a red round bag button that triggers the COD order dialog. Must not collide with the existing mobile bottom nav — hide the site bottom nav on this page while the mini bar is visible, or stack above it; pick the cleaner option and state it.

### Below the fold
1. Anchor link row (Bloop style underlined red links): "Description", "Details", "Reels", "You may also like" → jump to sections that exist.
2. Product details block: eyebrow "PRODUCT DETAILS", huge gradient title = product name (Bricolage 700, clamp 40–88px, `bloop-gradient-text`), full description text left, product image in a `rounded-[28px] bg-bloop-card` tile right (desktop), stacked on mobile.
3. Detail sections (`getProductDetailSections`) as Bloop accordion rows: full-width rows with top/bottom 1px rules, Bricolage 600 17px label, "+"/"−" toggle, body DM Sans 14px. Keep existing data; replace the tabs + scribble heading.
4. Reels: heading "আমরা ও আমাদের সত্যতা" in Bricolage/Anek Bangla style (no scribble), cards `rounded-[20px]`, keep the Embla carousel behaviour, Bloop arrow buttons (thin long arrows).
5. "You may also like": centred red grotesk heading "You may also like" + Bangla sub-line "আমাদের আরও কিছু পণ্য", product grid with `HomeProductCard`, red pill "View all" → /products.
6. RecentlyViewed unchanged.

Remove: yellow scribble SVGs and IhtishamDeshlipi/KaiumSimanto heading styles on this page, `#f6f6f6` backgrounds (use cream).

## Also fix
- Nested `<a>` hydration warning in layout.tsx announcement bar ("Shop now": `<Link><a>` → single `<Link className=…>`).

## Files touched
- `client/src/pages/product.tsx`
- `client/src/components/layout.tsx` (nested-anchor fix; bottom-nav hide hook only if needed for the sticky mini bar)
- `client/src/index.css` (only small utilities if needed)
- Tests asserting on product.tsx: `client/src/pages/product.test.ts`, `product-related-card.test.ts`, `product-recently-viewed.test.ts`, `google-analytics-wiring.test.ts`, `products-loading.test.ts`, and `layout.test.ts` if touched. Update assertions to the new markup; keep behavioural coverage (analytics events, add-to-cart payload, order dialog, inventory checks).

## Verify
1. `npm run check` clean.
2. `node --test $(find client/src -name '*.test.ts')` — baseline 264 / 248 pass / 16 pre-existing failures; no new failures.
3. Screenshots of `/product/glass-honey-dispenser-jar` (variant) and `/product/glass-water-bottles-with-time-marker` (bundle offers + reels) at 1440 and 390; click-test COD dialog opens, Add to cart opens drawer, size switch updates price; mobile scrollWidth 390.
