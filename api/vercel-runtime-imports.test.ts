import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vercel API entrypoints use runtime-resolvable JavaScript import specifiers", async () => {
  const [ordersSource, metaSource] = await Promise.all([
    readFile(new URL("./orders.ts", import.meta.url), "utf8"),
    readFile(new URL("./meta.ts", import.meta.url), "utf8"),
  ]);

  assert.match(ordersSource, /from "\.\.\/server\/order-protection-errors\.js"/);
  assert.doesNotMatch(ordersSource, /from "\.\.\/server\/order-protection-errors\.ts"/);
  assert.match(ordersSource, /import\("\.\.\/server\/meta-capi\.js"\)/);
  assert.doesNotMatch(ordersSource, /import\("\.\.\/server\/meta-capi"\)/);
  assert.match(metaSource, /from "\.\.\/server\/meta-capi\.js"/);
  assert.doesNotMatch(metaSource, /from "\.\.\/server\/meta-capi"/);
});
