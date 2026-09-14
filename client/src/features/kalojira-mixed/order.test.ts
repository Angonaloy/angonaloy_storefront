import assert from "node:assert/strict";
import test from "node:test";
import {
  KALOJIRA_CONFIRMATION_KEY,
  buildKalojiraOrderPayload,
  calculateKalojiraOrder,
  getKalojiraPackOptions,
  readKalojiraOrderConfirmation,
  writeKalojiraOrderConfirmation,
} from "./order.ts";

const product = {
  slug: "kalojira-mixed",
  name: "কালোজিরা মিক্সড | Kalojira Mixed",
  available: true,
  variants: [
    { id: "v500", attributes: { size: "৫০০ গ্রাম" }, price: 990, stock_quantity: 100 },
    { id: "v1kg", attributes: { size: "১ কেজি" }, price: 1600, stock_quantity: 100 },
  ],
};

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

test("extracts live Kalojira pack labels and prices", () => {
  assert.deepEqual(getKalojiraPackOptions(product), [
    { variantId: "v500", label: "৫০০ গ্রাম", unitPrice: 990 },
    { variantId: "v1kg", label: "১ কেজি", unitPrice: 1600 },
  ]);
});

test("calculates Kalojira order totals with home delivery", () => {
  assert.deepEqual(calculateKalojiraOrder(1600, 1), {
    unitPrice: 1600,
    quantity: 1,
    subtotal: 1600,
    deliveryCharge: 0,
    total: 1600,
  });
});

test("builds COD payload and persists only safe confirmation data", () => {
  const payload = buildKalojiraOrderPayload({
    productName: product.name,
    pack: { variantId: "v1kg", label: "১ কেজি", unitPrice: 1600 },
    quantity: 1,
    customerName: "পরীক্ষা গ্রাহক",
    phone: "01712345678",
    address: "বাড়ি ১২ সাভার ঢাকা",
  });
  assert.equal(payload.paymentMethod, "cash_on_delivery");
  assert.equal(payload.trackingMode, "google_only");
  const storage = createMemoryStorage();
  assert.equal(writeKalojiraOrderConfirmation(storage, {
    orderRef: "ORD-123",
    productName: product.name,
    variantLabel: "১ কেজি",
    quantity: 1,
    unitPrice: 1600,
    subtotal: 1600,
    deliveryCharge: 0,
    total: 1600,
    customerName: "পরীক্ষা গ্রাহক",
    phone: "01712345678",
    address: "বাড়ি ১২ সাভার ঢাকা",
  }), true);
  assert.ok(storage.getItem(KALOJIRA_CONFIRMATION_KEY));
  assert.equal(readKalojiraOrderConfirmation(storage)?.orderRef, "ORD-123");
});
