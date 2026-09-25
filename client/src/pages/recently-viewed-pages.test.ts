import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const homeSource = readFileSync(new URL("./home.tsx", import.meta.url), "utf8");
const productsSource = readFileSync(new URL("./products.tsx", import.meta.url), "utf8");

test("renders Recently Viewed on the homepage", () => {
  assert.match(homeSource, /import RecentlyViewed from "@\/components\/recently-viewed"/);
  assert.match(homeSource, /<RecentlyViewed products=\{homepageProducts\} \/>/);
});

test("renders Recently Viewed on the all-products page without replacing its catalog", () => {
  assert.match(productsSource, /import RecentlyViewed from "@\/components\/recently-viewed"/);
  assert.match(productsSource, /<RecentlyViewed products=\{products \?\? generatedStorefrontProducts\} \/>/);
  assert.match(productsSource, /<StorefrontProductCard key=\{product\.slug\} product=\{product\} index=\{index\} \/>/);
  assert.match(productsSource, /<\/div>\s*<RecentlyViewed products=\{products \?\? generatedStorefrontProducts\} \/>/);
});
