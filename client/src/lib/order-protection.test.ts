import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { getOrCreateClientSessionId } from "./order-protection";

test("persists one opaque client session id per browser session", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const first = getOrCreateClientSessionId(storage);
    assert.equal(first, getOrCreateClientSessionId(storage));
    assert.ok(first.length > 8);
});

test("adds the challenge and honeypot to every checkout surface", () => {
    for (const file of [
      "client/src/components/order-dialog.tsx",
      "client/src/features/sundarbans-honey/honey-checkout.tsx",
      "client/src/features/kalojira-mixed/kalojira-checkout.tsx",
      "client/src/features/honey-nut/honey-nut-checkout.tsx",
    ]) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      assert.ok(source.includes("TurnstileChallenge"));
      assert.ok(source.includes('name="website"'));
      assert.ok(source.includes("clientSessionId"));
      assert.ok(source.includes("checkoutStartedAt"));
    }
});
