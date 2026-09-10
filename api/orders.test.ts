import assert from "node:assert/strict";
import test from "node:test";
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  OrderUpstreamError,
  createOrderHandler,
  processOrder,
  shouldSendMetaPurchase,
  validateOrder,
} from "./orders.ts";

const validOrder = {
  bundleTitle: "Test product",
  bundleDetails: "1 kg",
  bundlePrice: 1500,
  quantity: 3,
  deliveryCharge: 100,
  customerName: "Test Customer",
  phone: "01712345678",
  address: "House 1 Road 2 Dhaka",
  paymentMethod: "cash_on_delivery",
};

test("retains a positive whole-number quantity", () => {
  assert.equal(validateOrder(validOrder).quantity, 3);
});

test("trims whitespace around an otherwise valid phone number", () => {
  assert.equal(validateOrder({ ...validOrder, phone: " 01712345678 " }).phone, "01712345678");
});

test("rejects invalid quantities", () => {
  const { quantity: _quantity, ...withoutQuantity } = validOrder;
  assert.throws(() => validateOrder(withoutQuantity));

  for (const quantity of [0, -1, 1.5]) {
    assert.throws(() => validateOrder({ ...validOrder, quantity }));
  }
});

const dependencies = {
  merchantSuiteUrl: "https://suite.invalid",
  apiKey: "test-api-key",
  timeoutSignal: () => new AbortController().signal,
};

test("normalizes the tracking policy and rejects unknown modes", () => {
  assert.equal(validateOrder(validOrder).trackingMode, "default");
  assert.equal(validateOrder({ ...validOrder, trackingMode: "default" }).trackingMode, "default");
  assert.equal(validateOrder({ ...validOrder, trackingMode: "google_only" }).trackingMode, "google_only");
  assert.throws(() => validateOrder({ ...validOrder, trackingMode: "unknown" }));
  assert.equal(shouldSendMetaPurchase({ trackingMode: "default" }), true);
  assert.equal(shouldSendMetaPurchase({ trackingMode: "google_only" }), false);
});

test("matches the reviewed bounded validation contract without coercion", () => {
  const accepted = [
    { deliveryCharge: 0 },
    { bundleTitle: "T".repeat(200) },
    { bundleDetails: "D".repeat(300) },
    { bundlePrice: 10_000_000 },
    { quantity: 100 },
    { deliveryCharge: 100_000 },
    { customerName: "N".repeat(120) },
    { address: "A B " + "C".repeat(496) },
    { paymentMethod: undefined },
    { metaEventId: "E".repeat(128) },
  ];
  for (const override of accepted) {
    assert.doesNotThrow(() => validateOrder({ ...validOrder, ...override }));
  }

  const rejected = [
    { bundleTitle: "T".repeat(201) },
    { bundleDetails: "D".repeat(301) },
    { bundlePrice: 10_000_001 },
    { bundlePrice: Number.MAX_SAFE_INTEGER },
    { quantity: 101 },
    { quantity: Number.MAX_SAFE_INTEGER },
    { deliveryCharge: 100_001 },
    { customerName: "N".repeat(121) },
    { phone: "1234567890" },
    { phone: "০১৭১২৩৪৫৬৭৮" },
    { address: "Only two" },
    { address: "A B " + "C".repeat(497) },
    { paymentMethod: "card" },
    { bkashTrxId: "B".repeat(81) },
    { metaEventId: "E".repeat(129) },
  ];
  for (const override of rejected) {
    assert.throws(() => validateOrder({ ...validOrder, ...override }));
  }
});

test("forwards the exact allowlisted Merchant-Suite body and canonical ID", async () => {
  let outboundBody: unknown;
  const order = validateOrder({ ...validOrder, trackingMode: "google_only", metaEventId: "meta-secret" });
  const result = await processOrder(order, {
    ...dependencies,
    fetchImpl: async (_input, init) => {
      outboundBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ order_id: "ML-150000" }), { status: 200 });
    },
  });

  assert.deepEqual(result, { orderRef: "ML-150000" });
  assert.deepEqual(outboundBody, {
    customer_name: "Test Customer",
    phone: "01712345678",
    address: "House 1 Road 2 Dhaka",
    product: "Test product - 1 kg",
    quantity: 3,
    price: 1500,
    delivery_rate: 100,
  });
});

test("requires a canonical Merchant-Suite ID for Google-only orders", async () => {
  const order = validateOrder({ ...validOrder, trackingMode: "google_only" });
  const failures = [
    async () => new Response("failure", { status: 503 }),
    async () => { throw new Error("network"); },
    async () => { throw new DOMException("timed out", "TimeoutError"); },
    async () => new Response("not-json", { status: 200 }),
    async () => new Response("{}", { status: 200 }),
    async () => new Response(JSON.stringify({ order_id: false }), { status: 200 }),
  ];
  for (const fetchImpl of failures) {
    await assert.rejects(() => processOrder(order, { ...dependencies, fetchImpl }), OrderUpstreamError);
  }
});

test("rejects every default-order webhook failure without a fake reference", async () => {
  const order = validateOrder(validOrder);
  const failures = [
    async () => new Response("failure", { status: 503 }),
    async () => { throw new Error("network"); },
    async () => { throw new DOMException("timed out", "TimeoutError"); },
    async () => new Response("not-json", { status: 200 }),
    async () => new Response("{}", { status: 200 }),
  ];
  for (const fetchImpl of failures) {
    await assert.rejects(
      () => processOrder(order, { ...dependencies, fetchImpl }),
      OrderUpstreamError,
    );
  }
});

function createRequest(body?: unknown, rawBody?: string) {
  if (rawBody !== undefined) {
    const request = Readable.from([rawBody]) as IncomingMessage & { body?: unknown };
    request.method = "POST";
    request.headers = {};
    return request;
  }
  return {
    method: "POST",
    headers: {},
    body,
    async *[Symbol.asyncIterator]() {},
  } as unknown as IncomingMessage & { body?: unknown };
}

function createResponse() {
  let rawBody = "";
  const response = {
    statusCode: 0,
    setHeader() {},
    end(chunk?: string) { rawBody = chunk ?? ""; },
  } as unknown as ServerResponse;
  return {
    response,
    read: () => ({ status: response.statusCode, body: JSON.parse(rawBody) }),
  };
}

test("handler skips all Meta preparation for Google-only success and returns no PII", async () => {
  let metaPreparations = 0;
  const { response, read } = createResponse();
  const handler = createOrderHandler({
    processOrder: async () => ({ orderRef: "ORD-123" }),
    sendPurchaseCapi: async () => { metaPreparations += 1; },
  });
  await handler(createRequest({ ...validOrder, trackingMode: "google_only" }), response);

  assert.deepEqual(read(), { status: 201, body: { orderRef: "ORD-123" } });
  assert.equal(metaPreparations, 0);
  assert.equal(JSON.stringify(read()).includes("Test Customer"), false);
  assert.equal(JSON.stringify(read()).includes("01712345678"), false);
});

test("handler retains one non-blocking Meta attempt for default orders", async () => {
  let metaPreparations = 0;
  const { response, read } = createResponse();
  const handler = createOrderHandler({
    processOrder: async () => ({ orderRef: "#fallback" }),
    sendPurchaseCapi: async () => { metaPreparations += 1; },
  });
  await handler(createRequest(validOrder), response);

  assert.deepEqual(read(), { status: 201, body: { orderRef: "#fallback" } });
  assert.equal(metaPreparations, 1);
});

test("handler returns stable client errors and has no side effects for invalid requests", async () => {
  let processCalls = 0;
  let metaCalls = 0;
  const handler = createOrderHandler({
    processOrder: async () => { processCalls += 1; return { orderRef: "never" }; },
    sendPurchaseCapi: async () => { metaCalls += 1; },
  });
  for (const request of [
    createRequest({ ...validOrder, trackingMode: "unknown" }),
    createRequest(undefined, "{not-json"),
  ]) {
    const { response, read } = createResponse();
    await handler(request, response);
    assert.equal(read().status, 400);
  }
  assert.equal(processCalls, 0);
  assert.equal(metaCalls, 0);
});

test("handler rejects an oversized request before order side effects", async () => {
  let processCalls = 0;
  const { response, read } = createResponse();
  const handler = createOrderHandler({
    processOrder: async () => { processCalls += 1; return { orderRef: "never" }; },
    sendPurchaseCapi: async () => {},
  });
  await handler(createRequest(undefined, JSON.stringify({ value: "x".repeat(33 * 1024) })), response);
  assert.equal(read().status, 413);
  assert.equal(processCalls, 0);
});

test("handler maps strict campaign upstream failures to a stable 502 without Meta", async () => {
  let metaCalls = 0;
  const { response, read } = createResponse();
  const handler = createOrderHandler({
    processOrder: async () => { throw new OrderUpstreamError(); },
    sendPurchaseCapi: async () => { metaCalls += 1; },
  });
  await handler(createRequest({ ...validOrder, trackingMode: "google_only" }), response);
  assert.deepEqual(read(), {
    status: 502,
    body: { message: "Could not confirm order. Please try again." },
  });
  assert.equal(metaCalls, 0);
});
