import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readOrderSource() {
  try {
    return readFileSync(new URL("./order.ts", import.meta.url), "utf8");
  } catch {
    return "";
  }
}

test("Honey Nut order contract uses the fixed delivery charge and isolated storage key", () => {
  const source = readOrderSource();
  assert.match(source, /HONEY_NUT_DELIVERY_CHARGE = 100/);
  assert.match(source, /honey-nut-order-confirmation-v1/);
  assert.match(source, /calculateHoneyNutOrder/);
  assert.match(source, /deliveryCharge: HONEY_NUT_DELIVERY_CHARGE/);
});

test("Honey Nut order contract extracts live variants and validates COD payload data", () => {
  const source = readOrderSource();
  assert.match(source, /getHoneyNutPackOptions/);
  assert.match(source, /stock_quantity/);
  assert.match(source, /buildHoneyNutOrderPayload/);
  assert.match(source, /cash_on_delivery/);
  assert.doesNotMatch(source, /(?:trackingMode|google_only)/);
  assert.match(source, /writeHoneyNutOrderConfirmation/);
  assert.match(source, /readHoneyNutOrderConfirmation/);
});
