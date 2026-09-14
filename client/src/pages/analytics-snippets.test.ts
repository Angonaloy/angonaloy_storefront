import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

test("installs Google Tag Manager high in the page head", () => {
  const headStart = html.indexOf("<head>");
  const viewportMeta = html.indexOf('<meta name="viewport"');
  const gtmScript = html.indexOf("GTM-5KKTRHFD");

  assert.ok(gtmScript > headStart, "GTM script should be inside <head>");
  assert.ok(gtmScript < viewportMeta, "GTM should be as high in <head> as possible");
  assert.match(html, /googletagmanager\.com\/gtm\.js\?id=/);
});

test("installs the GTM noscript fallback immediately after the body opens", () => {
  assert.match(
    html,
    /<body>\s*<!-- Google Tag Manager \(noscript\) -->\s*<noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-5KKTRHFD"/,
  );
});

test("leaves GA4 loading and configuration to GTM", () => {
  assert.doesNotMatch(html, /googletagmanager\.com\/gtag\/js/);
  assert.doesNotMatch(html, /gtag\s*\(\s*["']config["']/);
});
