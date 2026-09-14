import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (() => {
  try {
    return readFileSync(new URL("./kalojira-checkout.tsx", import.meta.url), "utf8");
  } catch {
    return "";
  }
})();
const contentSource = readFileSync(new URL("./content.ts", import.meta.url), "utf8");

test("checkout submits the live Kalojira variant through the COD API", () => {
  assert.match(source, /export function KalojiraCheckout/);
  assert.match(source, /bdi dir="ltr" className="whitespace-nowrap text-lg font-bold/);
  assert.match(source, /type="radio"/);
  assert.match(source, /name="quantity"/);
  assert.match(source, /apiRequest\("POST", "\/api\/orders", payload\)/);
  assert.match(source, /writeKalojiraOrderConfirmation/);
  assert.match(source, /setLocation\("\/step\/kalojira-mixed\/thank-you"\)/);
  assert.match(contentSource, /কালোজিরা মিক্সড/);
  assert.match(source, /კ্যাশ অন ডেলিভারি|ক্যাশ অন ডেলিভারি/);
});

test("checkout revalidates the selected live pack before creating an order", () => {
  assert.match(source, /productQuery\.refetch\(\)/);
  assert.match(source, /inventoryQuery\.refetch\(\)/);
  assert.match(source, /variantId === selectedVariantId/);
  assert.doesNotMatch(source, /trackKalojiraCampaignEvent/);
});
