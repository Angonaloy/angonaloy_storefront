import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import test from "node:test";
import {
  OrderUpstreamError,
  orderRequestSchema,
  processOrder,
  shouldSendMetaPurchase,
} from "./order-service.ts";
import { registerRoutes } from "./routes.ts";

const validOrder = {
  bundleTitle: "Test bundle",
  bundleDetails: "Test details",
  bundlePrice: 500,
  quantity: 2,
  deliveryCharge: 100,
  customerName: "Test Customer",
  phone: "০১৭১২৩৪৫৬৭৮",
  address: "House 1 Road 2 Dhaka",
  paymentMethod: "cash_on_delivery" as const,
};
const validEnglishOrder = { ...validOrder, phone: "01712345678" };

const dependencies = {
  merchantSuiteUrl: "https://suite.invalid",
  apiKey: "test-api-key",
  timeoutSignal: () => new AbortController().signal,
};

test("accepts exactly 11 English phone digits", () => {
  const order = orderRequestSchema.parse(validEnglishOrder);

  assert.equal(order.phone, "01712345678");
});

test("trims whitespace around an otherwise valid phone number", () => {
  const order = orderRequestSchema.parse({ ...validEnglishOrder, phone: " 01712345678 " });
  assert.equal(order.phone, "01712345678");
});

test("rejects Bengali phone digits", () => {
  assert.throws(() => orderRequestSchema.parse(validOrder));
});

test("rejects an address with fewer than three words", () => {
  assert.throws(() => orderRequestSchema.parse({ ...validOrder, address: "Dhaka" }));
});

test("requires a positive whole-number quantity", () => {
  assert.equal(orderRequestSchema.parse(validEnglishOrder).quantity, 2);
  assert.throws(() => orderRequestSchema.parse({ ...validEnglishOrder, quantity: 0 }));
  assert.throws(() => orderRequestSchema.parse({ ...validEnglishOrder, quantity: 1.5 }));

  const { quantity: _quantity, ...withoutQuantity } = validEnglishOrder;
  assert.throws(() => orderRequestSchema.parse(withoutQuantity));
});

test("normalizes the tracking policy and rejects unknown modes", () => {
  assert.equal(orderRequestSchema.parse(validEnglishOrder).trackingMode, "default");
  assert.equal(orderRequestSchema.parse({ ...validEnglishOrder, trackingMode: "default" }).trackingMode, "default");
  assert.equal(orderRequestSchema.parse({ ...validEnglishOrder, trackingMode: "google_only" }).trackingMode, "google_only");
  assert.throws(() => orderRequestSchema.parse({ ...validEnglishOrder, trackingMode: "unknown" }));
  assert.equal(shouldSendMetaPurchase({ trackingMode: "default" }), true);
  assert.equal(shouldSendMetaPurchase({ trackingMode: "google_only" }), false);
});

test("enforces the reviewed bounded order contract", () => {
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
    assert.doesNotThrow(() => orderRequestSchema.parse({ ...validEnglishOrder, ...override }));
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
    assert.throws(() => orderRequestSchema.parse({ ...validEnglishOrder, ...override }));
  }
});

test("forwards the exact allowlisted Merchant-Suite body and canonical ID", async () => {
  let outboundBody: unknown;
  let outboundSignal: AbortSignal | null | undefined;
  const order = orderRequestSchema.parse({
    ...validEnglishOrder,
    trackingMode: "google_only",
    metaEventId: "meta-secret",
  });

  const result = await processOrder(order, {
    ...dependencies,
    fetchImpl: async (_input, init) => {
      outboundBody = JSON.parse(String(init?.body));
      outboundSignal = init?.signal;
      return new Response(JSON.stringify({ order_id: "ML-150000" }), { status: 200 });
    },
  });

  assert.deepEqual(result, { orderRef: "ML-150000" });
  assert.deepEqual(outboundBody, {
    customer_name: "Test Customer",
    phone: "01712345678",
    address: "House 1 Road 2 Dhaka",
    product: "Test bundle - Test details",
    quantity: 2,
    price: 500,
    delivery_rate: 100,
  });
  assert.ok(outboundSignal);
});

test("requires a canonical Merchant-Suite ID for Google-only orders", async () => {
  const order = orderRequestSchema.parse({ ...validEnglishOrder, trackingMode: "google_only" });
  const failures = [
    async () => new Response("failure", { status: 503 }),
    async () => { throw new Error("network"); },
    async () => { throw new DOMException("timed out", "TimeoutError"); },
    async () => new Response("not-json", { status: 200 }),
    async () => new Response("{}", { status: 200 }),
    async () => new Response(JSON.stringify({ order_id: "  " }), { status: 200 }),
  ];

  for (const fetchImpl of failures) {
    await assert.rejects(
      () => processOrder(order, { ...dependencies, fetchImpl }),
      OrderUpstreamError,
    );
  }
});

test("rejects every default-order webhook failure without a fake reference", async () => {
  const order = orderRequestSchema.parse(validEnglishOrder);
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

async function invokeLocalOrder(body: unknown, routeDependencies: Record<string, unknown>) {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  const server = createServer(app);
  await registerRoutes(server, app, routeDependencies);
  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof OrderUpstreamError) {
      response.status(502).json({ message: "Could not confirm order. Please try again." });
      return;
    }
    response.status(500).json({ message: "unexpected" });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("local handler skips the entire Meta preparation path for Google-only success", async () => {
  let userDataCalls = 0;
  let metaCalls = 0;
  const response = await invokeLocalOrder(
    { ...validEnglishOrder, trackingMode: "google_only", metaEventId: "event-1" },
    {
      processOrder: async () => ({ orderRef: "ORD-123" }),
      getMetaUserDataFromRequest: () => { userDataCalls += 1; return {}; },
      sendMetaCapiEvent: async () => { metaCalls += 1; },
    },
  );
  assert.deepEqual(response, { status: 201, body: { orderRef: "ORD-123" } });
  assert.equal(userDataCalls, 0);
  assert.equal(metaCalls, 0);
  assert.equal(JSON.stringify(response).includes("Test Customer"), false);
  assert.equal(JSON.stringify(response).includes("01712345678"), false);
});

test("local handler retains one non-blocking Meta attempt for default orders", async () => {
  let metaCalls = 0;
  const response = await invokeLocalOrder(validEnglishOrder, {
    processOrder: async () => ({ orderRef: "#fallback" }),
    getMetaUserDataFromRequest: () => ({}),
    sendMetaCapiEvent: async () => { metaCalls += 1; },
  });
  assert.deepEqual(response, { status: 201, body: { orderRef: "#fallback" } });
  assert.equal(metaCalls, 1);
});

test("local handler rejects validation before webhook or Meta side effects", async () => {
  let processCalls = 0;
  let metaCalls = 0;
  const response = await invokeLocalOrder({ ...validEnglishOrder, trackingMode: "unknown" }, {
    processOrder: async () => { processCalls += 1; return { orderRef: "never" }; },
    getMetaUserDataFromRequest: () => ({}),
    sendMetaCapiEvent: async () => { metaCalls += 1; },
  });
  assert.deepEqual(response, { status: 400, body: { message: "Invalid order details" } });
  assert.equal(processCalls, 0);
  assert.equal(metaCalls, 0);
});

test("local handler returns a stable 502 and no Meta for strict campaign failures", async () => {
  let metaCalls = 0;
  const response = await invokeLocalOrder({ ...validEnglishOrder, trackingMode: "google_only" }, {
    processOrder: async () => { throw new OrderUpstreamError(); },
    getMetaUserDataFromRequest: () => ({}),
    sendMetaCapiEvent: async () => { metaCalls += 1; },
  });
  assert.deepEqual(response, {
    status: 502,
    body: { message: "Could not confirm order. Please try again." },
  });
  assert.equal(metaCalls, 0);
});
