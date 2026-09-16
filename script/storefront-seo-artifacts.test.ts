import assert from "node:assert/strict";
import test from "node:test";

import {
  createSitemapXml,
  getStaticSeoProducts,
  injectProductMeta,
  resolveStorefrontBuildCatalog,
} from "./storefront-seo-artifacts.ts";

const baseHtml = `<!doctype html>
<html><head>
  <title>Angonaloy-আঙ্গনালয়</title>
  <meta name="description" content="Default description" />
  <meta property="og:title" content="Default title" />
  <meta property="og:description" content="Default description" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://angonaloy.shop/" />
  <meta property="og:image" content="https://angonaloy.shop/opengraph.jpg" />
  <link rel="canonical" href="https://angonaloy.shop/" />
</head><body></body></html>`;

test("uses an empty successful public catalog as an empty catalog", async () => {
  const result = await resolveStorefrontBuildCatalog({
    storefrontProductsUrl: "https://suite.test/products",
    production: true,
    fetchImpl: async () => new Response(JSON.stringify({ products: [] }), { status: 200 }),
    readFallbackProducts: async () => [{ name: "Old", slug: "old" }],
  });

  assert.deepEqual(result, { products: [], source: "live" });
});

test("fails a production build rather than returning stale product SEO files", async () => {
  await assert.rejects(
    () => resolveStorefrontBuildCatalog({
      storefrontProductsUrl: "https://suite.test/products",
      production: true,
      fetchImpl: async () => new Response("down", { status: 503 }),
      readFallbackProducts: async () => [{ name: "Old", slug: "old" }],
    }),
    /Could not refresh storefront SEO catalog/,
  );
});

test("uses the previous snapshot only outside production", async () => {
  const result = await resolveStorefrontBuildCatalog({
    storefrontProductsUrl: "https://suite.test/products",
    production: false,
    fetchImpl: async () => {
      throw new Error("offline");
    },
    readFallbackProducts: async () => [{ name: "Cached", slug: "cached" }],
  });

  assert.deepEqual(result, {
    products: [{ name: "Cached", slug: "cached" }],
    source: "fallback",
  });
});

test("fails a production build for unsafe or retired product slugs", async () => {
  for (const slug of [".", "..", "raw mango", "stepprs-massage-insoles"]) {
    await assert.rejects(
      () => resolveStorefrontBuildCatalog({
        storefrontProductsUrl: "https://suite.test/products",
        production: true,
        fetchImpl: async () => new Response(JSON.stringify({ products: [{ name: "Mango", slug }] }), { status: 200 }),
        readFallbackProducts: async () => [],
      }),
      /Could not refresh storefront SEO catalog: invalid catalog response/,
    );
  }
});

test("escapes untrusted product metadata and JSON-LD", () => {
  const html = injectProductMeta(baseHtml, {
    name: "Mango </script><script>bad()</script>",
    slug: "raw-mango-2026",
    description: '" onmouseover="bad()',
    image_url: 'https://images.test/x" onerror="bad()',
    price: 1200,
  });

  assert.match(html, /raw-mango-2026/);
  assert.match(html, /\\u003c\/script\\u003e/);
  assert.doesNotMatch(html, /<script>bad\(\)<\/script>/);
  assert.match(html, /&quot; onerror=&quot;bad\(\)/);
  assert.doesNotMatch(html, /"availability"/);
  assert.match(html, /<link[^>]+data-seo="canonical"/);
  assert.match(html, /<script[^>]+data-seo="product"/);
});

test("does not invent an offer price when the catalog price is absent or malformed", () => {
  for (const price of [null, "", "not-a-price"]) {
    const html = injectProductMeta(baseHtml, { name: "Mango", slug: "mango", price });
    assert.doesNotMatch(html, /"offers"/);
    assert.doesNotMatch(html, /"price":"0"/);
  }
});

test("uses the fixed Open Graph image for an unsafe product image URL", () => {
  const html = injectProductMeta(baseHtml, {
    name: "Mango",
    slug: "mango",
    image_url: "javascript:alert(1)",
  });

  assert.match(html, /https:\/\/angonaloy\.shop\/opengraph\.jpg/);
  assert.doesNotMatch(html, /javascript:alert/);
});

test("creates a sitemap only for supplied, unique product slugs", () => {
  const sitemap = createSitemapXml([
    { slug: "active", name: "Active" },
    { slug: "raw-mango-2026", name: "Raw Mango" },
    { slug: "active", name: "Duplicate" },
  ]);

  assert.match(sitemap, /\/product\/active/);
  assert.match(sitemap, /\/product\/raw-mango-2026/);
  assert.equal((sitemap.match(/\/product\/active/g) || []).length, 1);
  assert.doesNotMatch(createSitemapXml([]), /\/product\//);
});

test("never emits static SEO files or sitemap entries for unsafe or legacy paths", () => {
  const legacySlugs = [
    "stepprs-massage-insoles",
    "massage-insoles",
    "4-in-1-makeup-pen",
    "bordeaux",
    "plum-veil",
    "rosy-bloom",
    "mauve-nude",
  ];
  const products = getStaticSeoProducts([
    { slug: "active", name: "Active" },
    { slug: ".", name: "Dot" },
    { slug: "..", name: "Dot dot" },
    ...legacySlugs.map((slug) => ({ slug, name: "Retired" })),
  ]);

  assert.deepEqual(products.map((product) => product.slug), ["active"]);
  const sitemap = createSitemapXml(products);
  assert.doesNotMatch(sitemap, /stepprs-massage-insoles|massage-insoles|4-in-1-makeup-pen|bordeaux|plum-veil|rosy-bloom|mauve-nude|\/product\/\.\.?/);
});
