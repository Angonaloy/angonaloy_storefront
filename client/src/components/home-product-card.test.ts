import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const homeSource = readFileSync(new URL("../pages/home.tsx", import.meta.url), "utf8");
const cardPath = new URL("./home-product-card.tsx", import.meta.url);
const cardSource = existsSync(cardPath) ? readFileSync(cardPath, "utf8") : "";

test("uses one styled product card across all homepage catalog sections", () => {
  assert.match(homeSource, /import HomeProductCard from "@\/components\/home-product-card"/);
  assert.match(homeSource, /products\.slice\(0, 4\)\.map\(\(product\) => <HomeProductCard/);
  assert.match(homeSource, /topSellingProducts\.slice\(0, 6\)\.map\(\(product\) => <HomeProductCard/);
  assert.match(homeSource, /homepageProducts\.slice\(0, 4\)\.map\(\(product\) => <HomeProductCard/);
  assert.match(cardSource, /Save/);
  assert.match(cardSource, /compareAtPrice/);
  assert.match(cardSource, /Add to Cart/);
  assert.match(cardSource, /add-to-cart-button/);
  assert.match(cardSource, /bg-\[#d92c2d\]/);
  assert.match(cardSource, /rounded-\[4px\]/);
  assert.match(cardSource, /add-to-cart-icon/);
  assert.match(cardSource, /<BagIcon className="add-to-cart-icon/);
  assert.match(cardSource, /addToCart/);
  assert.match(cardSource, /disabled=\{product\.available === false\}/);
});
