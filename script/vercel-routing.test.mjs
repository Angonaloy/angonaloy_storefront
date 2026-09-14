import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const config = JSON.parse(
  readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
);

const spaRewrite = config.rewrites.find(
  (rewrite) => rewrite.destination === "/",
);

test("SPA fallback handles app routes without swallowing products, assets, or API requests", () => {
  assert.ok(spaRewrite, "expected an SPA fallback rewrite");

  const matchesFallback = new RegExp(`^${spaRewrite.source}$`);

  for (const route of ["/", "/products", "/booking"]) {
    assert.equal(matchesFallback.test(route), true, `${route} should reach the SPA`);
  }

  for (const route of ["/product/active", "/product/not-real", "/product"]) {
    assert.equal(matchesFallback.test(route), false, `${route} must bypass the SPA fallback`);
  }

  for (const resource of [
    "/assets/index-stale.js",
    "/assets/index-stale.css",
    "/favicon.ico",
  ]) {
    assert.equal(
      matchesFallback.test(resource),
      false,
      `${resource} must not be rewritten to HTML`,
    );
  }
});

test("does not deploy a direct Meta API function", () => {
  assert.equal(existsSync(new URL("../api/meta.ts", import.meta.url)), false);
});

test("only the confirmed legacy template product paths rewrite to the 410 handler", () => {
  const legacySlugs = [
    "stepprs-massage-insoles",
    "massage-insoles",
    "4-in-1-makeup-pen",
    "bordeaux",
    "plum-veil",
    "rosy-bloom",
    "mauve-nude",
  ];

  for (const slug of legacySlugs) {
    assert.ok(
      config.rewrites.some((rewrite) => (
        rewrite.source === `/product/${slug}` && rewrite.destination === "/api/legacy-gone"
      )),
      `expected exact legacy rewrite for ${slug}`,
    );
  }
});

test("HTML shell and generated product pages are never stored by browser caches", () => {
  const htmlHeaders = config.headers.find(
    (entry) => entry.source === "/((?!api(?:/|$)|assets(?:/|$)|.*\\.[^/]+$).*)",
  );
  const htmlCacheControl = htmlHeaders?.headers.find(
    (header) => header.key.toLowerCase() === "cache-control",
  )?.value;
  const matchesHtmlHeaders = new RegExp(`^${htmlHeaders?.source ?? "$a"}$`);

  assert.match(htmlCacheControl ?? "", /no-store/);
  for (const route of ["/", "/products", "/booking", "/product/honey"]) {
    assert.equal(matchesHtmlHeaders.test(route), true, `${route} must be no-store`);
  }

  const indexHeaders = config.headers.find(
    (entry) => entry.source === "/index.html",
  );
  const indexCacheControl = indexHeaders?.headers.find(
    (header) => header.key.toLowerCase() === "cache-control",
  )?.value;
  assert.match(indexCacheControl ?? "", /no-store/);
});
