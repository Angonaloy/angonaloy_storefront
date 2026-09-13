import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("./katimon-mango.tsx", import.meta.url), "utf8");
const checkoutSource = readFileSync(new URL("../features/kalojira-mixed/kalojira-checkout.tsx", import.meta.url), "utf8");
const contentSource = readFileSync(new URL("../features/kalojira-mixed/katimon-content.ts", import.meta.url), "utf8");
const globalCssSource = readFileSync(new URL("../index.css", import.meta.url), "utf8");

test("Katimon WhatsApp href uses the exact Bengali order message", () => {
  assert.match(pageSource, /KATIMON_CAMPAIGN_WHATSAPP_HREF/);
  assert.match(contentSource, /কাটিমন আম \| Katimon Mango অর্ডার করতে চাই/);
  assert.match(contentSource, /encodeURIComponent/);
});

test("Katimon header, hero, footer, and checkout use the Katimon WhatsApp href", () => {
  assert.match(pageSource, /const KALOJIRA_CAMPAIGN_WHATSAPP_HREF = KATIMON_CAMPAIGN_WHATSAPP_HREF/);
  assert.match(pageSource, /window\.open\(KATIMON_CAMPAIGN_WHATSAPP_HREF, "_blank"/);
  assert.match(pageSource, /KALOJIRA_CAMPAIGN_WHATSAPP_HREF[^\n]*WhatsAppBrandIcon/);
  assert.match(checkoutSource, /product\?\.slug === "katimon-mango" \? KATIMON_CAMPAIGN_WHATSAPP_HREF/);
  assert.match(checkoutSource, /function SupportActions\(\{ placement, whatsappHref \}/);
  assert.match(checkoutSource, /href=\{whatsappHref\}/);
});

test("Katimon gold order CTAs remain checkout scroll actions", () => {
  assert.ok((pageSource.match(/href="#order" onClick=\{handleOrderClick\}/g) ?? []).length >= 3);
});

test("the document background stays white behind the Katimon page", () => {
  assert.match(globalCssSource, /html,\s*body\s*\{\s*background-color: #fff;\s*\}/);
  assert.doesNotMatch(globalCssSource, /html,\s*body\s*\{\s*background-color: #FBBB14;/);
});

test("long Katimon package features can wrap without truncation", () => {
  assert.match(globalCssSource, /section\[aria-labelledby="katimon-packages"\] article span\.whitespace-nowrap\s*\{[\s\S]*white-space: normal;[\s\S]*overflow: visible;[\s\S]*text-overflow: clip;/);
});

test("the Katimon description image fills the mobile section width", () => {
  assert.match(
    globalCssSource,
    /section\.mx-auto\.max-w-4xl\.px-5\.pb-8\.text-center > img\[src="\/katimon-description-v2\.webp"\]\s*\{[\s\S]*margin-left: -1\.25rem;[\s\S]*margin-right: -1\.25rem;[\s\S]*width: calc\(100% \+ 2\.5rem\);[\s\S]*max-width: none;/,
  );
});

test("the Katimon page has a single homepage-style entrance reveal", () => {
  assert.match(pageSource, /import \{ motion \} from "framer-motion";/);
  assert.match(pageSource, /return <motion\.div className="min-h-screen[^"]*" initial=\{\{ opacity: 0, y: 12 \}\} animate=\{\{ opacity: 1, y: 0 \}\}/);
  assert.match(pageSource, /transition=\{\{ duration: 1, ease: \[0\.25, 0\.1, 0\.25, 1\] \}\}/);
});
