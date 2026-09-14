import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { markHoneyNutPurchaseTracked } from "./tracking.ts";

const campaignSources = [
  readFileSync(new URL("./tracking.ts", import.meta.url), "utf8"),
  readFileSync(new URL("./campaign-layout.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./mobile-order-bar.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./honey-nut-checkout.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("../../pages/honey-nut.tsx", import.meta.url), "utf8"),
];

test("Honey Nut campaign has no direct interaction tracker", () => {
  for (const source of campaignSources) {
    assert.doesNotMatch(source, /(?:trackHoneyNutCampaignEvent|trackGoogleInteractionEvent)/);
  }
});

test("purchase markers allow one Honey Nut purchase event per order reference", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
  assert.equal(markHoneyNutPurchaseTracked(storage, "ORD-123"), true);
  assert.equal(markHoneyNutPurchaseTracked(storage, "ORD-123"), false);
  assert.equal(markHoneyNutPurchaseTracked(storage, "ORD-124"), true);
});
