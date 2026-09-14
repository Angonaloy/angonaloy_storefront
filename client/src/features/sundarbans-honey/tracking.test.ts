import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { markPurchaseTracked } from "./tracking.ts";

const campaignSources = [
  readFileSync(new URL("./tracking.ts", import.meta.url), "utf8"),
  readFileSync(new URL("./campaign-layout.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./mobile-order-bar.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./honey-checkout.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("../../pages/sundarbans-honey.tsx", import.meta.url), "utf8"),
];

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

test("honey campaign has no direct interaction tracker", () => {
  for (const source of campaignSources) {
    assert.doesNotMatch(source, /(?:trackHoneyCampaignEvent|trackGoogleInteractionEvent)/);
  }
});

test("purchase markers allow one event per order reference in a session", () => {
  const storage = createMemoryStorage();
  assert.equal(markPurchaseTracked(storage, "MLB-123"), true);
  assert.equal(markPurchaseTracked(storage, "MLB-123"), false);
  assert.equal(markPurchaseTracked(storage, "MLB-124"), true);
});
