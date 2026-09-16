import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const pageSource = readFileSync(new URL("./site-information.tsx", import.meta.url), "utf8");

test("renders semantic bilingual site information content", () => {
  assert.match(pageSource, /<h1/);
  assert.match(pageSource, /page\.title\.en/);
  assert.match(pageSource, /page\.title\.bn/);
  assert.match(pageSource, /section\.heading\.en/);
  assert.match(pageSource, /section\.heading\.bn/);
  assert.match(pageSource, /section\.body\.en/);
  assert.match(pageSource, /section\.body\.bn/);
});

test("links customer support to Angonaloy WhatsApp", () => {
  assert.match(pageSource, /CONTACT_DETAILS\.whatsappHref/);
  assert.doesNotMatch(pageSource, /8801733670129/);
});
