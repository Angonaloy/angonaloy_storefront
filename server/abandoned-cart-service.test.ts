import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import test from "node:test";
import { registerRoutes } from "./routes.ts";

const testHeaderValue = ["fixture", "token"].join("-");

const validCapture = {
  draftKey: "7cb13b8e-b576-4faa-b238-cc8b73059772",
  source: "sundarbans_honey",
  sourcePath: "/step/sundarbans-natural-honey",
  customerName: "Test Customer",
  phone: "01712345678",
  address: "House 1 Road 2 Dhaka",
  items: [{
    productName: "Sundarbans Honey",
    variantName: "1 kg",
    quantity: 2,
    unitPrice: 750,
  }],
  subtotal: 1500,
  deliveryRate: 100,
  total: 1600,
  campaign: { utmSource: "facebook" },
};

const dependencies = {
  merchantSuiteUrl: "https://suite.invalid",
  apiKey: testHeaderValue,
  timeoutSignal: () => new AbortController().signal,
};

test("accepts only the bounded capture contract and normalizes optional fields", async () => {
  const { parseAbandonedCartCapture } = await import("./abandoned-cart-service.ts");
  const capture = parseAbandonedCartCapture({
    ...validCapture,
    customerName: " Test Customer ",
    address: " ",
    campaign: { utmSource: " facebook ", utmMedium: "" },
  });

  assert.deepEqual(capture, {
    ...validCapture,
    customerName: "Test Customer",
    address: undefined,
    campaign: { utmSource: "facebook" },
  });
});

test("rejects unknown fields, invalid sources, bad phones, and inconsistent totals before forwarding", async () => {
  const { parseAbandonedCartCapture } = await import("./abandoned-cart-service.ts");

  for (const invalidCapture of [
    { ...validCapture, unexpected: true },
    { ...validCapture, sourcePath: "/checkout" },
    { ...validCapture, phone: "0181234567" },
    { ...validCapture, total: 1601 },
    { ...validCapture, items: [{ ...validCapture.items[0], quantity: 101 }] },
    { ...validCapture, campaign: { notAllowed: "value" } },
  ]) {
    assert.throws(() => parseAbandonedCartCapture(invalidCapture));
  }
});

test("forwards exactly the validated capture with a server-only API key", async () => {
  const { processAbandonedCartCapture } = await import("./abandoned-cart-service.ts");
  let requestUrl = "";
  let requestInit: RequestInit | undefined;

  await processAbandonedCartCapture(validCapture, {
    ...dependencies,
    fetchImpl: async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  });

  assert.equal(requestUrl, "https://suite.invalid/api/custom-orders/abandoned-checkouts");
  assert.deepEqual(requestInit?.headers, {
    "Content-Type": "application/json",
    "x-api-key": testHeaderValue,
  });
  assert.deepEqual(JSON.parse(String(requestInit?.body)), validCapture);
});

test("forwards a trusted Vercel client IP only through the server-to-server header", async () => {
  const { processAbandonedCartCapture } = await import("./abandoned-cart-service.ts");
  let requestInit: RequestInit | undefined;

  await processAbandonedCartCapture(validCapture, {
    ...dependencies,
    forwardedClientIp: "203.0.113.42",
    fetchImpl: async (_input, init) => {
      requestInit = init;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  });

  assert.deepEqual(requestInit?.headers, {
    "Content-Type": "application/json",
    "x-api-key": testHeaderValue,
    "x-storefront-client-ip": "203.0.113.42",
  });
});

test("maps upstream failures to one non-PII capture error", async () => {
  const { AbandonedCartUpstreamError, processAbandonedCartCapture } = await import("./abandoned-cart-service.ts");

  await assert.rejects(
    () => processAbandonedCartCapture(validCapture, {
      ...dependencies,
      fetchImpl: async () => new Response("nope", { status: 503 }),
    }),
    AbandonedCartUpstreamError,
  );
});

async function invokeLocalCapture(body: unknown, routeDependencies: Record<string, unknown>) {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  const server = createServer(app);
  await registerRoutes(server, app, routeDependencies);
  app.use((_error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    response.status(500).json({ ok: false, message: "unexpected" });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/abandoned-carts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("local handler shares the strict capture contract and its non-PII response", async () => {
  let forwarded: unknown;
  const response = await invokeLocalCapture(validCapture, {
    processAbandonedCartCapture: async (capture: unknown) => { forwarded = capture; },
  });

  assert.deepEqual(response, { status: 202, body: { ok: true } });
  assert.deepEqual(forwarded, validCapture);
  assert.equal(JSON.stringify(response).includes("Test Customer"), false);
  assert.equal(JSON.stringify(response).includes("01712345678"), false);
});

test("local handler rejects a malformed capture before its upstream side effect", async () => {
  let forwarded = 0;
  const response = await invokeLocalCapture({ ...validCapture, unexpected: true }, {
    processAbandonedCartCapture: async () => { forwarded += 1; },
  });

  assert.deepEqual(response, { status: 400, body: { ok: false, message: "Invalid checkout details" } });
  assert.equal(forwarded, 0);
});
