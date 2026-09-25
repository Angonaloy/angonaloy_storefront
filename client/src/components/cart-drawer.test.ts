import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const cartDrawerSource = readFileSync(new URL("./cart-drawer.tsx", import.meta.url), "utf8");

test("keeps the cart drawer English-only (the ৳ currency sign is the only Bengali-block glyph)", () => {
  assert.doesNotMatch(cartDrawerSource, /[ঀ-৲৴-৿]/);
  assert.match(cartDrawerSource, /\{itemCount\} \{itemCount === 1 \? 'Product' : 'Products'\}/);
  assert.match(cartDrawerSource, /Your cart is empty/);
  assert.match(cartDrawerSource, />\s*Checkout\s*<\/Button>/);
});

test("formats every drawer amount in taka, never BDT", () => {
  assert.doesNotMatch(cartDrawerSource, /BDT/);
  assert.match(cartDrawerSource, /return `৳\$\{amount\.toLocaleString\("en-US"\)\}`;/);
  assert.match(cartDrawerSource, /\{formatTaka\(subtotal\)\}/);
  assert.match(cartDrawerSource, /\{formatTaka\(cartUnitPrice\(item\.price\) \* item\.quantity\)\}/);
});

test("keeps both Continue Shopping actions on one line", () => {
  assert.equal((cartDrawerSource.match(/Continue Shopping/g) ?? []).length, 2);
  assert.equal((cartDrawerSource.match(/whitespace-nowrap/g) ?? []).length, 2);
});

test("renders the empty-cart Continue Shopping action as a Bloop red pill", () => {
  const emptyStart = cartDrawerSource.indexOf("Your cart is empty");
  const emptyCartAction = cartDrawerSource.slice(emptyStart, cartDrawerSource.indexOf("</button>", emptyStart));

  assert.notEqual(emptyStart, -1);
  assert.match(emptyCartAction, /Continue Shopping\s*$/);
  assert.match(emptyCartAction, /onClick=\{\(\) => setIsOpen\(false\)\}/);
  assert.match(emptyCartAction, /className="[^"]*rounded-full bg-\[#DB2828\][^"]*font-bloop[^"]*text-white/);
});

test("uses the Bloop header, line items and footer", () => {
  assert.match(cartDrawerSource, /aria-label="Close cart"[\s\S]*?className="flex h-11 w-11[^"]*rounded-\[12px\] bg-\[#333333\] text-white/);
  assert.match(cartDrawerSource, /d="M20\.707 4\.70697L19\.293 3\.29297/);
  assert.match(cartDrawerSource, /<span>Product<\/span>\s*<span>Total<\/span>/);
  assert.match(cartDrawerSource, /h-\[125px\] w-\[100px\] shrink-0 overflow-hidden rounded-\[12px\] bg-bloop-card/);
  assert.match(cartDrawerSource, /font-bloop text-\[17px\] font-bold/);
  assert.match(cartDrawerSource, /h-11 w-\[124px\][^"]*border-2 border-\[#333333\]/);
  assert.match(cartDrawerSource, /aria-label=\{`Decrease quantity of \$\{item\.title\}`\}/);
  assert.match(cartDrawerSource, /aria-label=\{`Increase quantity of \$\{item\.title\}`\}/);
  assert.match(cartDrawerSource, /aria-label=\{`Remove \$\{item\.title\}`\}/);
  assert.match(cartDrawerSource, /<Trash2 /);
  assert.match(cartDrawerSource, /Bag total/);
  assert.match(cartDrawerSource, /font-bloop text-\[26px\] font-bold[^"]*">\s*Subtotal/);
  assert.match(cartDrawerSource, /Shipping and taxes calculated at checkout/);
  assert.match(cartDrawerSource, /<Button\s+onClick=\{openCheckout\}\s+className="[^"]*rounded-full bg-\[#DB2828\]/);
  assert.match(cartDrawerSource, /rounded-full border-2 border-\[#DB2828\][^"]*text-\[#DB2828\]/);
  assert.doesNotMatch(cartDrawerSource, /discount|order note/i);
});

test("recommends live-catalog products that are not already in the cart", () => {
  assert.match(cartDrawerSource, /queryKey: \["merchant-suite-products-listing"\]/);
  assert.match(cartDrawerSource, /queryFn: fetchStorefrontProducts/);
  assert.match(cartDrawerSource, /\.\.\.STOREFRONT_CATALOG_QUERY_OPTIONS/);
  assert.match(cartDrawerSource, /initialData: generatedStorefrontProducts/);
  assert.match(cartDrawerSource, /!items\.some\(\(item\) => item\.productUuid === product\.id \|\| item\.productId === getProductNumericId\(product\)\)/);
  assert.match(cartDrawerSource, /You may also like/);
  assert.match(cartDrawerSource, /<HomeProductCard key=/);
});

test("keeps the drawer open/close motion unchanged", () => {
  assert.match(cartDrawerSource, /duration: 0\.58,\s*ease: cartEase,\s*staggerChildren: 0\.07,\s*delayChildren: 0\.08/);
  assert.match(cartDrawerSource, /closed: \{ opacity: 0, y: 16 \}/);
  assert.match(cartDrawerSource, /initial=\{\{ opacity: 0, scale: 0\.96 \}\}/);
  assert.match(cartDrawerSource, /animate=\{\{ opacity: 1, scale: 1, transition: \{ duration: 0\.58, ease: \[0\.22, 1, 0\.36, 1\] \} \}\}/);
  assert.match(cartDrawerSource, /exit=\{\{ opacity: 0, scale: 0\.96, transition: \{ duration: 0\.42, ease: \[0\.22, 1, 0\.36, 1\] \} \}\}/);
  assert.match(cartDrawerSource, /className="fixed inset-0 z-\[100\] w-full h-\[100dvh\] supports-\[height:100dvh\]:h-dvh p-3 sm:p-4 pointer-events-none"/);
  assert.match(cartDrawerSource, /<SheetContent\s+side="right"/);
});
