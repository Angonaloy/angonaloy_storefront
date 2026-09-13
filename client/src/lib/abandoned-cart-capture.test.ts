import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const snapshot = {
  customerName: "Test Customer",
  phone: "01712345678",
  address: "House 1 Road 2 Dhaka",
  items: [{ productName: "Sundarbans Honey", variantName: "1 kg", quantity: 1, unitPrice: 750 }],
  subtotal: 750,
  deliveryRate: 100,
  total: 850,
  campaign: { utmSource: "facebook" },
};

const delay = (milliseconds = 5) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("creates one draft key after a valid BD phone and reuses it for newer snapshots", async () => {
  const { createAbandonedCartCapture } = await import("./abandoned-cart-capture.ts");
  const storage = new MemoryStorage();
  const requests: unknown[] = [];
  const capture = createAbandonedCartCapture({
    source: "sundarbans_honey",
    storage,
    debounceMs: 0,
    createDraftKey: () => "7cb13b8e-b576-4faa-b238-cc8b73059772",
    fetchImpl: async (_url: RequestInfo | URL, init?: RequestInit) => {
      requests.push(JSON.parse(String(init?.body)));
      return new Response(null, { status: 202 });
    },
  });

  assert.equal(capture.capture({ ...snapshot, phone: "11111111111" }), null);
  assert.equal(capture.capture(snapshot), "7cb13b8e-b576-4faa-b238-cc8b73059772");
  capture.capture({ ...snapshot, items: [{ ...snapshot.items[0], quantity: 2 }], subtotal: 1500, total: 1600 });
  await delay();

  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0], {
    ...snapshot,
    source: "sundarbans_honey",
    sourcePath: "/step/sundarbans-natural-honey",
    draftKey: "7cb13b8e-b576-4faa-b238-cc8b73059772",
    items: [{ ...snapshot.items[0], quantity: 2 }],
    subtotal: 1500,
    total: 1600,
  });

  const resumedCapture = createAbandonedCartCapture({
    source: "sundarbans_honey",
    storage,
    createDraftKey: () => "should-not-be-used",
    fetchImpl: async () => new Response(null, { status: 202 }),
  });
  assert.equal(resumedCapture.capture(snapshot), "7cb13b8e-b576-4faa-b238-cc8b73059772");
  resumedCapture.clear();
});

test("finalizes a closed checkout before rotating the next draft key", async () => {
  const { createAbandonedCartCapture } = await import("./abandoned-cart-capture.ts");
  const storage = new MemoryStorage();
  const draftKeys = [
    "7cb13b8e-b576-4faa-b238-cc8b73059772",
    "e8c62e5c-a1fb-4eb4-9fd5-ec19e16c31a5",
  ];
  const requests: Array<{ draftKey: string }> = [];
  let nextDraftKey = 0;
  const capture = createAbandonedCartCapture({
    source: "sundarbans_honey",
    storage,
    debounceMs: 0,
    createDraftKey: () => draftKeys[nextDraftKey++] ?? null,
    fetchImpl: async (_url: RequestInfo | URL, init?: RequestInit) => {
      requests.push(JSON.parse(String(init?.body)));
      return new Response(null, { status: 202 });
    },
  });

  assert.equal(capture.capture(snapshot), draftKeys[0]);
  await capture.finalize();
  assert.equal(capture.draftKey, null);

  assert.equal(capture.capture({ ...snapshot, items: [{ ...snapshot.items[0], quantity: 2 }], subtotal: 1500, total: 1600 }), draftKeys[1]);
  await capture.flush();

  assert.deepEqual(requests.map((request) => request.draftKey), draftKeys);
});

test("posts the final snapshot after an in-flight update before rotating its draft", async () => {
  const { createAbandonedCartCapture } = await import("./abandoned-cart-capture.ts");
  const requests: Array<{ items: Array<{ quantity: number }> }> = [];
  let resolveFirstRequest: (() => void) | null = null;
  const capture = createAbandonedCartCapture({
    source: "sundarbans_honey",
    storage: new MemoryStorage(),
    debounceMs: 0,
    createDraftKey: () => "7cb13b8e-b576-4faa-b238-cc8b73059772",
    fetchImpl: async (_url: RequestInfo | URL, init?: RequestInit) => {
      requests.push(JSON.parse(String(init?.body)));
      if (requests.length === 1) {
        return new Promise<Response>((resolve) => {
          resolveFirstRequest = () => resolve(new Response(null, { status: 202 }));
        });
      }
      return new Response(null, { status: 202 });
    },
  });

  capture.capture(snapshot);
  await delay();
  capture.capture({ ...snapshot, items: [{ ...snapshot.items[0], quantity: 2 }], subtotal: 1500, total: 1600 });
  const finalizing = capture.finalize();
  resolveFirstRequest?.();
  await finalizing;

  assert.deepEqual(requests.map((request) => request.items[0].quantity), [1, 2]);
  assert.equal(capture.draftKey, null);
});

test("does not repost an unchanged snapshot while finalizing an in-flight capture", async () => {
  const { createAbandonedCartCapture } = await import("./abandoned-cart-capture.ts");
  let requests = 0;
  let resolveRequest: (() => void) | null = null;
  const capture = createAbandonedCartCapture({
    source: "honey_nut",
    storage: new MemoryStorage(),
    debounceMs: 0,
    createDraftKey: () => "7cb13b8e-b576-4faa-b238-cc8b73059772",
    fetchImpl: async () => {
      requests += 1;
      if (requests > 1) return new Response(null, { status: 202 });
      return new Promise<Response>((resolve) => {
        resolveRequest = () => resolve(new Response(null, { status: 202 }));
      });
    },
  });

  capture.capture(snapshot);
  await delay();
  const finalizing = capture.finalize();
  resolveRequest?.();
  await finalizing;

  assert.equal(requests, 1);
});

test("retries an unchanged snapshot when its in-flight capture fails during finalization", async () => {
  const { createAbandonedCartCapture } = await import("./abandoned-cart-capture.ts");
  let requests = 0;
  let resolveRequest: (() => void) | null = null;
  const capture = createAbandonedCartCapture({
    source: "honey_nut",
    storage: new MemoryStorage(),
    debounceMs: 0,
    createDraftKey: () => "7cb13b8e-b576-4faa-b238-cc8b73059772",
    fetchImpl: async () => {
      requests += 1;
      if (requests > 1) return new Response(null, { status: 202 });
      return new Promise<Response>((resolve) => {
        resolveRequest = () => resolve(new Response(null, { status: 503 }));
      });
    },
  });

  capture.capture(snapshot);
  await delay();
  const finalizing = capture.finalize();
  resolveRequest?.();
  await finalizing;

  assert.equal(requests, 2);
});

test("retries a failed capture after a later checkout interaction without throwing", async () => {
  const { createAbandonedCartCapture } = await import("./abandoned-cart-capture.ts");
  let attempts = 0;
  const capture = createAbandonedCartCapture({
    source: "kalojira_mixed",
    storage: new MemoryStorage(),
    debounceMs: 0,
    createDraftKey: () => "7cb13b8e-b576-4faa-b238-cc8b73059772",
    fetchImpl: async () => {
      attempts += 1;
      return new Response(null, { status: attempts === 1 ? 503 : 202 });
    },
  });

  capture.capture(snapshot);
  await capture.flush();
  capture.retry();
  await delay();

  assert.equal(attempts, 2);
});

test("falls back to memory when session storage is unavailable and clears its draft", async () => {
  const { createAbandonedCartCapture } = await import("./abandoned-cart-capture.ts");
  const unavailableStorage = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
    removeItem: () => { throw new Error("blocked"); },
  };
  const capture = createAbandonedCartCapture({
    source: "honey_nut",
    storage: unavailableStorage,
    createDraftKey: () => "7cb13b8e-b576-4faa-b238-cc8b73059772",
    fetchImpl: async () => new Response(null, { status: 202 }),
  });

  assert.equal(capture.capture(snapshot), "7cb13b8e-b576-4faa-b238-cc8b73059772");
  capture.clear();
  assert.equal(capture.draftKey, null);
});

test("only keeps allowlisted campaign fields and has no analytics or console side effects", async () => {
  const { readAbandonedCartCampaign } = await import("./abandoned-cart-capture.ts");
  assert.deepEqual(
    readAbandonedCartCampaign("?utm_source=facebook&utm_medium=cpc&utm_campaign=honey&phone=01712345678"),
    { utmSource: "facebook", utmMedium: "cpc", utmCampaign: "honey" },
  );

  const source = readFileSync(new URL("./abandoned-cart-capture.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /trackGoogle|trackMeta|trackMerchant|console\.(?:log|warn|error)/);
});

test("posts capture data only to the same-origin proxy and never carries server configuration", () => {
  const source = readFileSync(new URL("./abandoned-cart-capture.ts", import.meta.url), "utf8");

  assert.match(source, /fetchImpl\("\/api\/abandoned-carts"/);
  assert.doesNotMatch(source, /CUSTOM_ORDERS_API_KEY|MERCHANT_SUITE_URL|VITE_STOREFRONT_ID|orgId|org_id|supabase/i);
});
