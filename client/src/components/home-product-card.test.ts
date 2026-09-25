import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const homeSource = readFileSync(new URL("../pages/home.tsx", import.meta.url), "utf8");
const cardPath = new URL("./home-product-card.tsx", import.meta.url);
const cardSource = existsSync(cardPath) ? readFileSync(cardPath, "utf8") : "";

test("uses one styled product card across all homepage catalog sections", () => {
  assert.match(homeSource, /import HomeProductCard from "@\/components\/home-product-card"/);
  assert.match(homeSource, /items\.map\(\(product\) => <HomeProductCard/);
  assert.match(homeSource, /renderProductGrid\(products\.slice\(0, 4\)/);
  assert.match(homeSource, /renderProductGrid\(topSellingProducts\.slice\(0, 8\)/);
  assert.match(homeSource, /renderProductGrid\(homepageProducts\.slice\(0, 4\)/);
  assert.match(cardSource, /aspect-\[4\/5\] overflow-hidden rounded-\[20px\] bg-bloop-card/);
  assert.match(cardSource, /hasDiscount && product\.available !== false[\s\S]*?rounded-full bg-bloop-red[\s\S]*?Sale/);
  assert.match(cardSource, /rounded-full bg-bloop-cream\/90[\s\S]*?Sold out/);
  assert.doesNotMatch(cardSource, /Save \{/);
  assert.match(cardSource, /compareAtPrice/);
  assert.match(cardSource, /line-through/);
  assert.match(cardSource, /flex flex-col items-center[^"]*text-center/);
  assert.match(cardSource, /Add to cart/);
  assert.match(cardSource, /add-to-cart-button/);
  assert.match(cardSource, /add-to-cart-button[^"]*rounded-full bg-bloop-red/);
  assert.match(cardSource, /add-to-cart-icon/);
  assert.match(cardSource, /<BagIcon className="add-to-cart-icon/);
  assert.match(cardSource, /addToCart/);
  assert.match(cardSource, /disabled=\{product\.available === false\}/);
});
