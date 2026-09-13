import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the checkout capture hook retries on browser focus and reconnection, then finalizes on unmount", () => {
  let source = "";
  try {
    source = readFileSync(new URL("./use-abandoned-cart-capture.ts", import.meta.url), "utf8");
  } catch {
    // The assertions describe the intended browser lifecycle until the hook exists.
  }

  assert.match(source, /export function useAbandonedCartCapture/);
  assert.match(source, /window\.addEventListener\("focus", retry\)/);
  assert.match(source, /window\.addEventListener\("online", retry\)/);
  assert.match(source, /void capture\.finalize\(\)/);
  assert.match(source, /capture\.dispose\(\)/);
  assert.doesNotMatch(source, /capture\.clear\(\)/);
});
