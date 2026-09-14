import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const cartDrawerSource = readFileSync(new URL("./cart-drawer.tsx", import.meta.url), "utf8");

test("keeps the cart drawer English-only", () => {
  assert.doesNotMatch(cartDrawerSource, /[\u0980-\u09FF]/);
  assert.match(cartDrawerSource, /Your Cart/);
  assert.match(cartDrawerSource, /Your cart is empty/);
  assert.match(cartDrawerSource, /Proceed to Checkout/);
});

test("keeps both Continue Shopping actions on one line", () => {
  assert.equal((cartDrawerSource.match(/Continue Shopping/g) ?? []).length, 2);
  assert.equal((cartDrawerSource.match(/whitespace-nowrap/g) ?? []).length, 2);
});

test("renders the empty-cart Continue Shopping action as an underlined text control", () => {
  const emptyCartAction = cartDrawerSource.match(/<Button[\s\S]*?Continue Shopping[\s\S]*?<\/Button>/)?.[0] ?? "";

  assert.notEqual(emptyCartAction, "");
  assert.match(emptyCartAction, /variant="ghost"/);
  assert.match(emptyCartAction, /className="[^"]*rounded-none[^"]*border-0[^"]*border-b border-black/);
});
