import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Honey Nut checkout submits live variant data through the COD API", () => {
  let source = "";
  try {
    source = readFileSync(new URL("./honey-nut-checkout.tsx", import.meta.url), "utf8");
  } catch {
    // The source assertion should fail until the checkout exists.
  }
  assert.match(source, /export function HoneyNutCheckout/);
  assert.match(source, /type="radio"/);
  assert.match(source, /name="quantity"/);
  assert.match(source, /apiRequest\("POST", "\/api\/orders", payload\)/);
  assert.match(source, /writeHoneyNutOrderConfirmation/);
  assert.match(source, /setLocation\("\/step\/honey-nut\/thank-you"\)/);
  assert.match(source, /হোম ডেলিভারি/);
});

test("Honey Nut checkout revalidates the selected live pack before ordering", () => {
  let source = "";
  try {
    source = readFileSync(new URL("./honey-nut-checkout.tsx", import.meta.url), "utf8");
  } catch {
    // The source assertion should fail until the checkout exists.
  }
  assert.match(source, /productQuery\.refetch\(\)/);
  assert.match(source, /inventoryQuery\.refetch\(\)/);
  assert.match(source, /variantId === selectedVariantId/);
  assert.doesNotMatch(source, /trackHoneyNutCampaignEvent/);
});
