import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

// GTM/PostHog were removed for the Angonaloy deploy — the prior snippets pointed
// at another merchant's (Mango Lover BD) analytics accounts. Re-add these tests
// once real Angonaloy container/project IDs are wired back in.
test("does not load another merchant's Google Tag Manager container", () => {
  assert.doesNotMatch(html, /googletagmanager\.com\/(gtm\.js|ns\.html)/);
});

test("does not ship another merchant's PostHog project key", () => {
  assert.doesNotMatch(html, /phc_uREr7jcnWTVmA38gg2t3LfFM7fwM5bTrNxGzEg8Pixnf/);
});

test("leaves GA4 loading and configuration to GTM", () => {
  assert.doesNotMatch(html, /googletagmanager\.com\/gtag\/js/);
  assert.doesNotMatch(html, /gtag\s*\(\s*["']config["']/);
});
