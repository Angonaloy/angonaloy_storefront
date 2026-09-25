import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const componentSource = readFileSync(new URL("./recently-viewed.tsx", import.meta.url), "utf8");

test("renders the shared card carousel in the storefront's Bloop section style", () => {
  assert.match(componentSource, /useRecentlyViewedSlugs/);
  assert.match(componentSource, /getRecentlyViewedProducts/);
  assert.match(componentSource, /<HomeProductCard/);
  assert.match(componentSource, /Recently.*Viewed/);
  assert.match(componentSource, /aria-label=\{?"Previous recently viewed products"/);
  assert.match(componentSource, /aria-label=\{?"Next recently viewed products"/);
  assert.match(componentSource, /aria-controls="recently-viewed-products"/);
  assert.match(componentSource, /basis-\[calc\(\(100%_-_0\.5rem\)_\/_2\)\]/);
  assert.match(componentSource, /basis-\[calc\(\(100%_-_3rem\)_\/_4\)\]/);
  assert.match(componentSource, /w-full -mb-20 bg-bloop-cream pb-8 pt-0 md:mb-0 md:py-24/);
  assert.match(componentSource, /max-w-\[1500px\] px-3 md:px-8 xl:px-12/);
  assert.match(componentSource, /font-bloop text-\[clamp\(2\.4rem,7vw,4\.75rem\)\] font-extrabold/);
  assert.match(componentSource, /bloop-gradient-text">Recently viewed/);
  assert.match(componentSource, /font-bangla[^\"]*">আপনি সম্প্রতি দেখেছেন/);
  assert.match(componentSource, /rounded-full bg-bloop-red[^\"]*text-white/);
  assert.doesNotMatch(componentSource, /bg-\[#f6f6f6\]|font-inter-28pt-semibold|bg-\[#FBBB14\]/);
});
