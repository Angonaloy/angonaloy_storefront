import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("./katimon-mango.tsx", import.meta.url), "utf8");
const checkoutSource = readFileSync(new URL("../features/kalojira-mixed/kalojira-checkout.tsx", import.meta.url), "utf8");
const mobileOrderBarSource = readFileSync(new URL("../features/kalojira-mixed/mobile-order-bar.tsx", import.meta.url), "utf8");
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

test("the Katimon hero word keeps its shimmer inside the layered button treatment", () => {
  assert.match(pageSource, /<button type="button" className="katimon-hero-button"/);
  assert.match(pageSource, /<span className="katimon-hero-button__shadow" aria-hidden="true" \/>/);
  assert.match(pageSource, /<span className="katimon-hero-button__edge" aria-hidden="true" \/>/);
  assert.match(pageSource, /<span className="katimon-hero-button__front">\s*<ShiningText text="কাটিমন আম" className="font-extrabold" \/>\s*<\/span>/);
});

test("the Katimon hero button has the requested lift and press states", () => {
  assert.match(globalCssSource, /\.katimon-hero-button\s*\{[\s\S]*transition: filter 250ms;/);
  assert.match(globalCssSource, /\.katimon-hero-button__front\s*\{[\s\S]*padding: 6px 27px;/);
  assert.match(globalCssSource, /\.katimon-hero-button__front\s*\{[\s\S]*background: #fcc435;/);
  assert.match(globalCssSource, /\.katimon-hero-button:hover \.katimon-hero-button__front\s*\{[\s\S]*transform: translateY\(-6px\);/);
  assert.match(globalCssSource, /\.katimon-hero-button:active \.katimon-hero-button__front\s*\{[\s\S]*transform: translateY\(-2px\);/);
  assert.match(globalCssSource, /\.katimon-hero-button:focus:not\(:focus-visible\)\s*\{\s*outline: none;/);
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

test("the checkout heading focus does not show a browser outline after scrolling", () => {
  assert.match(checkoutSource, /id="kalojira-checkout-heading" className="[^"]*focus:outline-none[^"]*"/);
});

test("the checkout heading stays centered and on one line on mobile", () => {
  assert.match(checkoutSource, /id="kalojira-checkout-heading" className="[^"]*whitespace-nowrap[^"]*text-center[^"]*text-xl[^"]*sm:text-2xl sm:text-left[^"]*"/);
});

test("the checkout supporting copy stays centered on mobile without an outside delivery badge", () => {
  assert.match(checkoutSource, /<p className="mt-2 whitespace-nowrap text-center text-sm leading-6 text-\[#654b2f\] sm:text-left">পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।<\/p>/);
  assert.doesNotMatch(checkoutSource, /ডেলিভারি চার্জ ৳\$\{deliveryCharge\}/);
  assert.match(checkoutSource, /`ডেলিভারি ৳\$\{deliveryCharge\}`/);
});

test("the payment note and order confirmation message center on mobile", () => {
  assert.match(checkoutSource, /<p className="mt-4 rounded-xl bg-white\/70 px-4 py-3 text-center text-sm font-bold leading-6 sm:text-left">পেমেন্ট: ক্যাশ অন ডেলিভারি<\/p>/);
  assert.match(checkoutSource, /<div className="mt-5 min-h-6 text-center text-sm sm:text-left" aria-live="polite" aria-atomic="true">/);
});

test("checkout form controls use compact four-pixel corners", () => {
  assert.match(checkoutSource, /className="relative flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-\[4px\] border/);
  assert.match(checkoutSource, /<div className="flex w-fit items-center overflow-hidden rounded-\[4px\] border/);
  assert.match(checkoutSource, /id="kalojira-name"[\s\S]*className="min-h-11 w-full rounded-\[4px\] border/);
  assert.match(checkoutSource, /id="kalojira-phone"[\s\S]*className="min-h-11 w-full rounded-\[4px\] border/);
  assert.match(checkoutSource, /id="kalojira-address"[\s\S]*className="min-h-24 w-full rounded-\[4px\] border/);
});

test("availability recovery uses the brand WhatsApp icon and compact button corners", () => {
  assert.match(checkoutSource, /import \{ WhatsAppBrandIcon \} from "\.\/campaign-layout";/);
  assert.doesNotMatch(checkoutSource, /MessageCircle/);
  assert.match(checkoutSource, /<WhatsAppBrandIcon className="size-4" \/>/);
  assert.ok((checkoutSource.match(/rounded-\[4px\]/g) ?? []).length >= 3);
});

test("pack delivery badges use the compact yellow treatment", () => {
  assert.match(checkoutSource, /<span className="rounded-\[4px\] bg-\[#fcc435\] px-2\.5 py-0\.5 text-\[11px\] font-bold text-black">\{deliveryCharge \? `ডেলিভারি ৳\$\{deliveryCharge\}` : "ডেলিভারি ফ্রি"\}<\/span>/);
});

test("the 10KG pack carries a yellow customer-choice badge beside delivery", () => {
  assert.match(checkoutSource, /<span className="flex items-center gap-1\.5">\s*<span className="rounded-\[4px\] bg-\[#fcc435\] px-2\.5 py-0\.5 text-\[11px\] font-bold text-black">\{deliveryCharge \? `ডেলিভারি ৳\$\{deliveryCharge\}` : "ডেলিভারি ফ্রি"\}<\/span>\s*\{pack\.label\.includes\("10"\) \? <span className="whitespace-nowrap rounded-\[4px\] border border-\[#b98500\]\/35 bg-gradient-to-r from-\[#fcc435\] to-\[#ffd968\] px-2\.5 py-0\.5 text-\[11px\] font-bold tracking-\[0\.02em\] text-black shadow-\[0_2px_6px_rgba\(185,133,0,0\.18\)\]">গ্রাহকের পছন্দ<\/span> : null\}\s*<\/span>/);
});

test("the Katimon page uses its generated product snapshot for first paint", () => {
  assert.match(pageSource, /generatedStorefrontProducts/);
  assert.match(pageSource, /findGeneratedStorefrontProduct\(generatedStorefrontProducts, slug\)/);
  assert.match(pageSource, /initialData: generatedProduct \?\? undefined/);
  assert.match(pageSource, /refetchInterval: STOREFRONT_POLL_INTERVAL_MS/);
});

test("the Katimon hero copy matches the mobile gallery side gap", () => {
  assert.match(
    globalCssSource,
    /@media \(max-width: 767px\)\s*\{[\s\S]*section\.mx-auto\.grid\.max-w-6xl\.gap-8 > div\.order-2\.px-5\.text-center\s*\{[\s\S]*padding-left: 10px;[\s\S]*padding-right: 10px;/,
  );
});

test("the Katimon mobile navbar matches the gallery side gap", () => {
  assert.match(
    globalCssSource,
    /@media \(max-width: 767px\)[\s\S]*header\.sticky\.top-0\.z-40 > div\.relative\.mx-auto\s*\{[\s\S]*padding-left: 10px;[\s\S]*padding-right: 10px;/,
  );
});

test("the Katimon checkout matches the gallery side gap on mobile", () => {
  assert.match(pageSource, /<section id="order" className="mx-auto max-w-4xl scroll-mt-24 px-\[10px\] pb-20 md:px-5 lg:max-w-6xl">/);
});

test("the Katimon nutritionist section matches the gallery side gap on mobile", () => {
  assert.match(pageSource, /<section aria-labelledby="katimon-nutritionist-heading" className="-mx-\[10px\] mt-8 overflow-hidden rounded-\[4px\] border border-black\/15 bg-white text-left md:mx-0">/);
});

test("the Katimon footer credits Arc Labs with quoted title casing", () => {
  assert.match(pageSource, /className="mt-2 inline-flex normal-case text-\[11px\][^"]*">Designed &amp; Developed by &quot;Arc Labs Corporation&quot;/);
});

test("the Katimon page reuses the mobile order dock with its checkout target", () => {
  assert.match(pageSource, /import \{ MobileOrderBar \} from "@\/features\/kalojira-mixed\/mobile-order-bar";/);
  assert.match(pageSource, /<MobileOrderBar checkoutId="order" whatsappHref=\{KATIMON_CAMPAIGN_WHATSAPP_HREF\}/);
  assert.match(mobileOrderBarSource, /checkoutId = "kalojira-checkout"/);
  assert.match(mobileOrderBarSource, /const target = document\.getElementById\(checkoutId\)/);
  assert.match(mobileOrderBarSource, /href=\{whatsappHref\}/);
});
