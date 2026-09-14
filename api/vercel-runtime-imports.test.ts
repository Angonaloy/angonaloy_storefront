import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vercel order entrypoint uses a runtime-resolvable JavaScript import specifier", async () => {
  const ordersSource = await readFile(new URL("./orders.ts", import.meta.url), "utf8");

  assert.match(ordersSource, /from "\.\.\/server\/order-protection-errors\.js"/);
  assert.doesNotMatch(ordersSource, /from "\.\.\/server\/order-protection-errors\.ts"/);
});
