import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const build = readFileSync(new URL("../../../script/build.ts", import.meta.url), "utf8");

test("registers Honey Nut landing and thank-you routes in specific-first order", () => {
  const thankYouRoute = app.indexOf('path="/step/honey-nut/thank-you"');
  const landingRoute = app.indexOf('path="/step/honey-nut"');
  const productRoute = app.indexOf('path="/product/:id"');
  assert.ok(thankYouRoute >= 0);
  assert.ok(landingRoute >= 0);
  assert.ok(thankYouRoute < landingRoute);
  assert.ok(landingRoute < productRoute);
  assert.match(app, /হানি নাট \| আঙ্গনালয়/);
  assert.match(app, /হানি নাট অর্ডারের জন্য ধন্যবাদ \| আঙ্গনালয়/);
  assert.match(build, /"honey-nut"/);
});
