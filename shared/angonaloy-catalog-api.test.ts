import assert from "node:assert/strict";
import test from "node:test";

import { getAngonaloyCatalogApiBase } from "./angonaloy-catalog-api.ts";

test("builds the canonical handle-based catalog base without duplicate slashes", () => {
  for (const merchantSuiteUrl of [
    "https://angonaloy-commerceos.vercel.app",
    "https://angonaloy-commerceos.vercel.app/",
    "https://angonaloy-commerceos.vercel.app///",
  ]) {
    const catalogBase = getAngonaloyCatalogApiBase(merchantSuiteUrl);

    assert.equal(catalogBase, "https://angonaloy-commerceos.vercel.app/api/public/v1/angonaloy");
    assert.doesNotMatch(catalogBase, /\/api\/public\/v1\/storefronts\//);
  }
});
