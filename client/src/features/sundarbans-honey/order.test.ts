import assert from "node:assert/strict";
import test from "node:test";
import {
  HONEY_CONFIRMATION_KEY,
  buildHoneyAddress,
  buildHoneyOrderConfirmation,
  buildHoneyOrderPayload,
  calculateHoneyOrder,
  clearHoneyOrderConfirmation,
  getHoneyPackOptions,
  readHoneyOrderConfirmation,
  writeHoneyOrderConfirmation,
} from "./order.ts";

const product = {
  id: "honey-id",
  slug: "sundarbans-natural-honey",
  name: "সুন্দরবনের চাকের মধু",
  price: 800,
  variants: [
    { id: "half", attributes: { size: "0.5KG" }, price: 800, available: true },
    { id: "one", attributes: { size: "1KG" }, price: 1600, available: true },
  ],
};

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}

test("extracts pack labels and live variant prices in API order", () => {
  assert.deepEqual(getHoneyPackOptions(product).map(({ label, unitPrice }) => ({ label, unitPrice })), [
    { label: "0.5KG", unitPrice: 800 },
    { label: "1KG", unitPrice: 1600 },
  ]);
  assert.deepEqual(getHoneyPackOptions({
    ...product,
    variants: [{ ...product.variants[0], price: "850" }],
  }), [{ variantId: "half", label: "0.5KG", unitPrice: 850 }]);
});

test("omits packs that cannot be safely ordered without substituting a base price", () => {
  assert.deepEqual(getHoneyPackOptions({ ...product, available: false }), []);
  assert.deepEqual(getHoneyPackOptions({
    ...product,
    price: 999,
    variants: [
      { id: "unavailable", attributes: { size: "A" }, price: 100, available: false },
      { id: "empty", attributes: { size: "B" }, price: 100, stock_quantity: 0 },
      { id: "negative", attributes: { size: "C" }, price: 100, stock_quantity: -1 },
      { attributes: { size: "D" }, price: 100 },
      { id: "missing-size", attributes: {}, price: 100 },
      { id: "blank-size", attributes: { size: "  " }, price: 100 },
      { id: "missing-price", attributes: { size: "E" } },
      { id: "fraction", attributes: { size: "F" }, price: 100.5 },
      { id: "unsafe", attributes: { size: "G" }, price: Number.MAX_SAFE_INTEGER },
      { id: "boolean", attributes: { size: "H" }, price: true as unknown as number },
    ],
  }), []);
});

test("returns no pack options when product-level stock is sold out", () => {
  assert.deepEqual(getHoneyPackOptions({ ...product, stock_quantity: 0 }), []);
});

test("calculates exact integer taka totals with the fixed delivery charge", () => {
  assert.deepEqual(calculateHoneyOrder(1600, 2), {
    unitPrice: 1600,
    quantity: 2,
    subtotal: 3200,
    deliveryCharge: 100,
    total: 3300,
  });
});

test("rejects unsafe, fractional, non-positive, and over-limit price or quantity", () => {
  for (const unitPrice of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 10_000_001, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => calculateHoneyOrder(unitPrice, 1));
  }
  for (const quantity of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 101, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => calculateHoneyOrder(800, quantity));
  }
  assert.throws(() => calculateHoneyOrder(10_000_000, 2));
});

test("builds the combined address with optional upazila and district", () => {
  assert.equal(buildHoneyAddress("বাড়ি ১২, রোড ৩", "ঢাকা", "সাভার"), "বাড়ি ১২, রোড ৩, সাভার, ঢাকা");
  assert.equal(buildHoneyAddress("  House 12  ", " Dhaka ", " Savar "), "House 12, Savar, Dhaka");
  assert.equal(buildHoneyAddress("বাড়ি ১২, রোড ৩, সাভার, ঢাকা"), "বাড়ি ১২, রোড ৩, সাভার, ঢাকা");
  assert.throws(() => buildHoneyAddress(""));
  assert.throws(() => buildHoneyAddress("  "));
});

test("builds an allowlisted COD order payload from the selected live pack", () => {
  const payload = buildHoneyOrderPayload({
    productName: product.name,
    pack: { variantId: "one", label: "1KG", unitPrice: 1600 },
    quantity: 2,
    customerName: "Test Customer",
    phone: "01712345678",
    address: "House 12 Savar Dhaka",
  });

  assert.deepEqual(payload, {
    bundleTitle: "সুন্দরবনের চাকের মধু",
    bundleDetails: "1KG",
    bundlePrice: 3200,
    quantity: 2,
    deliveryCharge: 100,
    customerName: "Test Customer",
    phone: "01712345678",
    address: "House 12 Savar Dhaka",
    paymentMethod: "cash_on_delivery",
  });
});

test("rejects unbounded or malformed customer fields before building a payload", () => {
  const base = {
    productName: product.name,
    pack: { variantId: "one", label: "1KG", unitPrice: 1600 },
    quantity: 1,
    customerName: "Test Customer",
    phone: "01712345678",
    address: "House 12 Savar Dhaka",
  };
  for (const override of [
    { customerName: "A" },
    { customerName: "N".repeat(121) },
    { phone: "0171234567" },
    { phone: "০১৭১২৩৪৫৬৭৮" },
    { address: "Only two" },
    { address: "A B " + "C".repeat(497) },
  ]) {
    assert.throws(() => buildHoneyOrderPayload({ ...base, ...override }));
  }
});

test("confirmation persistence serializes and returns only the non-sensitive allowlist", () => {
  const storage = createMemoryStorage();
  const payload = buildHoneyOrderPayload({
    productName: product.name,
    pack: { variantId: "one", label: "1KG", unitPrice: 1600 },
    quantity: 2,
    customerName: "Secret Name",
    phone: "01712345678",
    address: "Secret House Savar Dhaka",
  });
  const confirmation = buildHoneyOrderConfirmation("ORD-123", payload);

  assert.equal(writeHoneyOrderConfirmation(storage, {
    ...confirmation,
    customerName: "Must not persist",
    phone: "Must not persist",
    address: "Must not persist",
  } as typeof confirmation), true);

  const serialized = storage.getItem(HONEY_CONFIRMATION_KEY);
  assert.ok(serialized);
  assert.equal(serialized.includes("Secret Name"), false);
  assert.equal(serialized.includes("01712345678"), false);
  assert.equal(serialized.includes("Secret House"), false);
  assert.deepEqual(readHoneyOrderConfirmation(storage), {
    orderRef: "ORD-123",
    productName: product.name,
    variantLabel: "1KG",
    quantity: 2,
    unitPrice: 1600,
    subtotal: 3200,
    deliveryCharge: 100,
    total: 3300,
  });

  clearHoneyOrderConfirmation(storage);
  assert.equal(readHoneyOrderConfirmation(storage), null);
});

test("confirmation reads reject malformed, wrong-shaped, and inconsistent data", () => {
  const storage = createMemoryStorage();
  for (const value of [
    "{not-json",
    JSON.stringify({}),
    JSON.stringify({
      orderRef: "ORD-123",
      productName: product.name,
      variantLabel: "1KG",
      quantity: 2,
      unitPrice: 1600,
      subtotal: 999,
      deliveryCharge: 100,
      total: 1099,
    }),
    JSON.stringify({
      orderRef: "ORD-123",
      productName: product.name,
      variantLabel: "1KG",
      quantity: Number.MAX_SAFE_INTEGER,
      unitPrice: 1600,
      subtotal: 3200,
      deliveryCharge: 100,
      total: 3300,
    }),
  ]) {
    storage.setItem(HONEY_CONFIRMATION_KEY, value);
    assert.equal(readHoneyOrderConfirmation(storage), null);
  }
});

test("confirmation storage failures never throw after an accepted order", () => {
  const throwingStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  const confirmation = {
    orderRef: "ORD-123",
    productName: product.name,
    variantLabel: "1KG",
    quantity: 1,
    unitPrice: 1600,
    subtotal: 1600,
    deliveryCharge: 100 as const,
    total: 1700,
  };

  assert.equal(writeHoneyOrderConfirmation(throwingStorage, confirmation), false);
  assert.equal(readHoneyOrderConfirmation(throwingStorage), null);
  assert.doesNotThrow(() => clearHoneyOrderConfirmation(throwingStorage));
});
