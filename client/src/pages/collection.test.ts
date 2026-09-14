import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const collectionSource = readFileSync(new URL("./collection.tsx", import.meta.url), "utf8");
const productsSource = readFileSync(new URL("./products.tsx", import.meta.url), "utf8");

test("loads the live catalog and filters it through the configured collection", () => {
  assert.match(collectionSource, /fetchStorefrontProducts/);
  assert.match(collectionSource, /getCollection\(params\.slug\)/);
  assert.match(collectionSource, /getProductsForCollection/);
  assert.match(collectionSource, /initialData: generatedStorefrontProducts/);
});

test("uses the complete ordered catalog for Top Selling Products", () => {
  assert.match(collectionSource, /getTopSellingProducts/);
  assert.match(collectionSource, /getTopSellingProducts\(products \?\? \[\]\)/);
});

test("renders the exact empty collection message", () => {
  assert.match(collectionSource, /No product found/);
});

test("reuses the shared inventory-aware product card", () => {
  assert.match(collectionSource, /StorefrontProductCard/);
  assert.match(productsSource, /StorefrontProductCard/);
});
