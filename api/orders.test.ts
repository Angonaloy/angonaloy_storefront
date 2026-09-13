import assert from "node:assert/strict";
import test from "node:test";
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  OrderProtectionError,
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
  storefrontHandle: "mangolover",
  timeoutSignal: () => new AbortController().signal,
};

const canonicalItems = [{
  productId: "11111111-1111-4111-8111-111111111111",
  variantId: "22222222-2222-4222-8222-222222222222",
  quantity: 3,
}];

test("normalizes the tracking policy and rejects unknown modes", () => {
  assert.equal(validateOrder(validOrder).trackingMode, "default");
  assert.equal(validateOrder({ ...validOrder, trackingMode: "default" }).trackingMode, "default");
  assert.equal(validateOrder({ ...validOrder, trackingMode: "google_only" }).trackingMode, "google_only");
  assert.throws(() => validateOrder({ ...validOrder, trackingMode: "unknown" }));
  assert.equal(shouldSendMetaPurchase({ trackingMode: "default" }), true);
  assert.equal(shouldSendMetaPurchase({ trackingMode: "google_only" }), false);
});

test("accepts an optional checkout draft key only when it is a UUID", () => {
  assert.equal(
    validateOrder({ ...validOrder, draftKey: "7CB13B8E-B576-4FAA-B238-CC8B73059772" }).draftKey,
    "7cb13b8e-b576-4faa-b238-cc8b73059772",
  );
  assert.throws(() => validateOrder({ ...validOrder, draftKey: "not-a-draft" }));
});

test("accepts bounded order-protection signals and canonical items", () => {
  const order = validateOrder({
    ...validOrder,
    website: "",
    turnstileToken: "turnstile-token",
    clientSessionId: "session-123",
    checkoutStartedAt: "2026-09-12T10:00:00.000Z",
    items: canonicalItems,
    shippingZoneId: "inside-dhaka",
  });
  assert.deepEqual(order.items, canonicalItems);
  assert.equal(order.shippingZoneId, "inside-dhaka");
  assert.equal(order.turnstileToken, "turnstile-token");
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

  assert.deepEqual(result, { orderRef: "ML-150000", decision: "allow" });
  assert.deepEqual(outboundBody, {
    customerName: "Test Customer",
    phone: "01712345678",
    address: "House 1 Road 2 Dhaka",
    notes: "Test product - 1 kg",
  });
});

test("posts canonical checkout data to the public handle endpoint", async () => {
  let outboundUrl = "";
  let outboundBody: Record<string, unknown> | undefined;
  let outboundHeaders: Record<string, string> | undefined;
  const order = validateOrder({
    ...validOrder,
    items: canonicalItems,
    shippingZoneId: "inside-dhaka",
    website: "",
    turnstileToken: "turnstile-token",
    clientSessionId: "session-123",
    checkoutStartedAt: "2026-09-12T10:00:00.000Z",
  });
  const result = await processOrder(order, {
    ...dependencies,
    fetchImpl: async (input, init) => {
      outboundUrl = String(input);
      outboundHeaders = init?.headers as Record<string, string>;
      outboundBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ orderRef: "ML-150002", decision: "allow" }), { status: 201 });
    },
  });

  assert.equal(outboundUrl, "https://suite.invalid/api/public/v1/mangolover/orders");
  assert.deepEqual(outboundHeaders, { "Content-Type": "application/json" });
  assert.deepEqual(result, { orderRef: "ML-150002", decision: "allow" });
  assert.deepEqual(outboundBody, {
    customerName: "Test Customer",
    phone: "01712345678",
    address: "House 1 Road 2 Dhaka",
    items: canonicalItems,
    shippingZoneId: "inside-dhaka",
    website: "",
    turnstileToken: "turnstile-token",
    clientSessionId: "session-123",
    checkoutStartedAt: "2026-09-12T10:00:00.000Z",
    notes: "Test product - 1 kg",
  });
});

test("returns a review hold without turning it into an upstream failure", async () => {
  const order = validateOrder({ ...validOrder, items: canonicalItems });
  const result = await processOrder(order, {
    ...dependencies,
    fetchImpl: async () => new Response(JSON.stringify({ decision: "review", review_id: "review-1" }), { status: 202 }),
  });
  assert.deepEqual(result, { decision: "review", reviewId: "review-1" });
});

test("surfaces a customer-safe typed block error", async () => {
  const order = validateOrder({ ...validOrder, items: canonicalItems });
  await assert.rejects(
    () => processOrder(order, {
      ...dependencies,
      fetchImpl: async () => new Response(JSON.stringify({ decision: "block", retryable: false }), { status: 403 }),
    }),
    (error: unknown) => error instanceof OrderProtectionError
      && error.decision === "block"
      && error.retryable === false,
  );
});

test("forwards a validated checkout draft key only through the secret-backed order path", async () => {
  let outboundBody: unknown;
  const order = validateOrder({
    ...validOrder,
    draftKey: "7cb13b8e-b576-4faa-b238-cc8b73059772",
  });

  await processOrder(order, {
    ...dependencies,
    fetchImpl: async (_input, init) => {
      outboundBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ order_id: "ML-150001" }), { status: 200 });
    },
  });

  assert.deepEqual(outboundBody, {
    customerName: "Test Customer",
    phone: "01712345678",
    address: "House 1 Road 2 Dhaka",
    notes: "Test product - 1 kg",
    abandoned_checkout_draft_key: "7cb13b8e-b576-4faa-b238-cc8b73059772",
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

  assert.deepEqual(read(), { status: 201, body: { orderRef: "ORD-123", decision: "allow" } });
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

  assert.deepEqual(read(), { status: 201, body: { orderRef: "#fallback", decision: "allow" } });
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
