import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const landingPage = readFileSync(new URL("./sundarbans-honey.tsx", import.meta.url), "utf8");
const thankYouPage = readFileSync(new URL("./sundarbans-honey-thank-you.tsx", import.meta.url), "utf8");
const staticServer = readFileSync(new URL("../../../server/static.ts", import.meta.url), "utf8");
const vercelConfig = JSON.parse(
  readFileSync(new URL("../../../vercel.json", import.meta.url), "utf8"),
) as {
  headers?: Array<{
    source: string;
    headers: Array<{ key: string; value: string }>;
  }>;
};

test("registers the isolated campaign routes in specific-first order", () => {
  const thankYouRoute = app.indexOf('path="/step/sundarbans-natural-honey/thank-you"');
  const landingRoute = app.indexOf('path="/step/sundarbans-natural-honey"');

  assert.ok(thankYouRoute >= 0, "thank-you campaign route should exist");
  assert.ok(landingRoute >= 0, "landing campaign route should exist");
  assert.ok(thankYouRoute < landingRoute, "thank-you route should precede landing route");
  assert.doesNotMatch(
    app.slice(thankYouRoute, app.indexOf("</Route>", landingRoute) + "</Route>".length),
    /<Layout\b/,
    "campaign routes should not use the storefront Layout",
  );
  assert.match(landingPage, /<main\b/);
  assert.match(thankYouPage, /<main\b/);
  assert.doesNotMatch(landingPage, /\bLayout\b/);
  assert.doesNotMatch(thankYouPage, /\bLayout\b/);
});

test("does not branch campaign routes for direct tracking", () => {
  assert.doesNotMatch(
    app,
    /(?:isGoogleOnlyCampaignPath|initMetaPixel|trackMetaEvent|createEventId)/,
  );
});

test("owns campaign metadata outside the animated route lifecycle", () => {
  const metadataOwner = app.indexOf("<CampaignMetadata location={location} />");
  const animatedRoutes = app.indexOf("<AnimatePresence>");

  assert.ok(metadataOwner >= 0, "Router should render a stable campaign metadata owner");
  assert.ok(
    metadataOwner < animatedRoutes,
    "campaign metadata owner should sit outside AnimatePresence",
  );
  assert.match(app, /const previousTitle = document\.title/);
  assert.match(app, /robots\.content = "noindex, nofollow"/);
  assert.match(app, /document\.title = previousTitle/);
  assert.match(app, /robots\.content = previousRobotsContent/);
  assert.match(app, /সুন্দরবনের প্রাকৃতিক মধু \| ম্যাংগো লাভার/);
  assert.match(app, /অর্ডারের জন্য ধন্যবাদ \| ম্যাংগো লাভার/);

  for (const page of [landingPage, thankYouPage]) {
    assert.doesNotMatch(page, /document\.(?:title|head)/);
  }
});

test("sets noindex headers for campaign paths on both hosts", () => {
  assert.match(
    staticServer,
    /req\.path === "\/step" \|\| req\.path\.startsWith\("\/step\/"\)/,
  );
  assert.match(staticServer, /res\.setHeader\("X-Robots-Tag", "noindex, nofollow"\)/);

  assert.deepEqual(vercelConfig.headers?.[0], {
    source: "/step/(.*)",
    headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
  });
});
