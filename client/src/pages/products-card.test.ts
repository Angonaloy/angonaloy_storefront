import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const productsSource = readFileSync(new URL("./products.tsx", import.meta.url), "utf8");

test("uses the shared styled card for the all-products catalog", () => {
  assert.match(productsSource, /import HomeProductCard from "@\/components\/home-product-card"/);
  assert.match(productsSource, /<HomeProductCard product=\{merged\} \/>/);
  assert.match(productsSource, /mergeInventory\(product, inventory\?\.inventory\)/);
});
