import assert from "node:assert/strict";
import { test } from "node:test";

import {
  fetchStorefrontProduct,
  fetchStorefrontProductInventory,
  fetchStorefrontProducts,
  findGeneratedStorefrontProduct,
  getCachedStorefrontProduct,
  getProductGallery,
  getProductImage,
  hasPublishedProducts,
  isProductOrderable,
  searchStorefrontProducts,
  setCachedStorefrontProduct,
  STOREFRONT_API_BASE,
} from "./storefront-products.ts";

test("matches product names without case sensitivity", () => {
  const products = [
    { name: "Raw Mango", slug: "raw-mango" },
    { name: "Silk Scarf", slug: "silk-scarf" },
  ];

  assert.deepEqual(searchStorefrontProducts(products, "mAnGo").map((product) => product.slug), ["raw-mango"]);
});

test("uses the first product image before falling back to image_url", () => {
  assert.equal(
    getProductImage({ image_url: "https://example.com/legacy.jpg", images: ["https://example.com/new.jpg"] }),
    "https://example.com/new.jpg",
  );
});

test("uses image_urls as the full gallery before image objects", () => {
  assert.deepEqual(
    getProductGallery({
      image_url: "https://example.com/primary.jpg",
      image_urls: ["https://example.com/front.jpg", "https://example.com/back.jpg"],
      images: [{ url: "https://example.com/object.jpg" }],
    }),
    ["https://example.com/front.jpg", "https://example.com/back.jpg"],
  );
});

test("uses image objects as the gallery before image_url", () => {
  assert.deepEqual(
    getProductGallery({
      image_url: "https://example.com/primary.jpg",
      images: [{ url: "https://example.com/front.jpg" }, { url: "https://example.com/back.jpg" }],
    }),
    ["https://example.com/front.jpg", "https://example.com/back.jpg"],
  );
});

test("falls back to image_url as a one-image gallery", () => {
  assert.deepEqual(getProductGallery({ image_url: "https://example.com/primary.jpg" }), ["https://example.com/primary.jpg"]);
});

test("falls back to image_url when product images are unavailable", () => {
  assert.equal(
    getProductImage({ image_url: "https://example.com/legacy.jpg", images: [] }),
    "https://example.com/legacy.jpg",
  );
});

test("treats an empty product array as a valid empty storefront", () => {
  assert.equal(hasPublishedProducts([]), false);
});

test("does not allow ordering when product detail is missing", () => {
  assert.equal(isProductOrderable(null), false);
});

test("does not allow ordering when product is unavailable", () => {
  assert.equal(isProductOrderable({ name: "Test", slug: "test", available: false, stock_quantity: 10 }), false);
});

test("does not allow ordering when product stock is empty", () => {
  assert.equal(isProductOrderable({ name: "Test", slug: "test", available: true, stock_quantity: 0 }), false);
});

test("does not allow ordering when all variants are out of stock", () => {
  assert.equal(
    isProductOrderable({
      name: "Test",
      slug: "test",
      available: true,
      stock_quantity: 10,
      variants: [{ available: true, stock_quantity: 0 }],
    }),
    false,
  );
});

test("allows ordering when product is available with stock", () => {
  assert.equal(isProductOrderable({ name: "Test", slug: "test", available: true, stock_quantity: 1 }), true);
});

test("finds generated storefront product by slug", () => {
  const product = findGeneratedStorefrontProduct(
    [
      { name: "One", slug: "one" },
      { name: "Two", slug: "two" },
    ],
    "two",
  );

  assert.equal(product?.name, "Two");
});

test("reads and writes cached storefront products by slug", () => {
  const storage = new Map<string, string>();
  const localStorageLike = {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  };

  setCachedStorefrontProduct(localStorageLike, { name: "Cached", slug: "cached" });

  assert.equal(getCachedStorefrontProduct(localStorageLike, "cached")?.name, "Cached");
});

test("returns null for corrupt cached storefront products", () => {
  const localStorageLike = {
    getItem: () => "not json",
    setItem: () => undefined,
    removeItem: () => undefined,
  };

  assert.equal(getCachedStorefrontProduct(localStorageLike, "cached"), null);
});

test("returns null only when the public product endpoint confirms a 404", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("missing", { status: 404 });

    assert.equal(await fetchStorefrontProduct("seasonal-mango"), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("keeps a 500 distinguishable from a confirmed missing product", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("upstream error", { status: 500 });

    await assert.rejects(() => fetchStorefrontProduct("active-mango"), /Could not load product/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not treat a malformed 200 product response as confirmed absence", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ product: {} }), { status: 200 });

    await assert.rejects(() => fetchStorefrontProduct("active-mango"), /Could not load product/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not accept a 200 response for a different product slug", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({
      product: { name: "Different mango", slug: "different-mango" },
    }), { status: 200 });

    await assert.rejects(() => fetchStorefrontProduct("active-mango"), /Could not load product/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("uses Angonaloy's canonical handle-based catalog API base", () => {
  assert.equal(STOREFRONT_API_BASE, "/api/public/v1/angonaloy");
});

test("sends catalog reads through Angonaloy's canonical handle endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const requestUrls: string[] = [];
  try {
    globalThis.fetch = async (input) => {
      const url = String(input);
      requestUrls.push(url);

      if (url.endsWith("/products")) {
        return new Response(JSON.stringify({ products: [] }), { status: 200 });
      }

      if (url.endsWith("/products/seasonal-mango")) {
        return new Response(JSON.stringify({
          product: { name: "Seasonal Mango", slug: "seasonal-mango" },
        }), { status: 200 });
      }

      if (url.endsWith("/products/seasonal-mango/inventory")) {
        return new Response(JSON.stringify({
          inventory: null,
          as_of: "2026-09-17T00:00:00.000Z",
        }), { status: 200 });
      }

      throw new Error(`Unexpected request: ${url}`);
    };

    await fetchStorefrontProducts();
    await fetchStorefrontProduct("seasonal-mango");
    await fetchStorefrontProductInventory("seasonal-mango");

    assert.deepEqual(requestUrls, [
      "/api/public/v1/angonaloy/products",
      "/api/public/v1/angonaloy/products/seasonal-mango",
      "/api/public/v1/angonaloy/products/seasonal-mango/inventory",
    ]);
    assert.ok(requestUrls.every((url) => !url.includes("/api/public/v1/storefronts/")));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
