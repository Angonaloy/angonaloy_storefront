import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const homeSource = readFileSync(new URL("../pages/home.tsx", import.meta.url), "utf8");
const cardPath = new URL("./home-product-card.tsx", import.meta.url);
const cardSource = existsSync(cardPath) ? readFileSync(cardPath, "utf8") : "";

test("uses one styled product card across all homepage catalog sections", () => {
  assert.match(homeSource, /import HomeProductCard from "@\/components\/home-product-card"/);
  assert.equal((homeSource.match(/<HomeProductCard\b/g) ?? []).length, 4);
  assert.match(cardSource, /Save/);
  assert.match(cardSource, /compareAtPrice/);
  assert.match(cardSource, /Add to Cart/);
  assert.match(cardSource, /addToCart/);
  assert.match(cardSource, /disabled=\{product\.available === false\}/);
});
