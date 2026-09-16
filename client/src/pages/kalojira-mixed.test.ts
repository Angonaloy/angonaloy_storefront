import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("./kalojira-mixed.tsx", import.meta.url), "utf8");
const sectionsSource = readFileSync(new URL("../features/kalojira-mixed/documentary-sections.tsx", import.meta.url), "utf8");
const contentSource = readFileSync(new URL("../features/kalojira-mixed/content.ts", import.meta.url), "utf8");
const checkoutSource = readFileSync(new URL("../features/kalojira-mixed/kalojira-checkout.tsx", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../features/kalojira-mixed/campaign-layout.tsx", import.meta.url), "utf8");
const barSource = readFileSync(new URL("../features/kalojira-mixed/mobile-order-bar.tsx", import.meta.url), "utf8");
const campaignCssSource = readFileSync(new URL("../features/kalojira-mixed/campaign.css", import.meta.url), "utf8");
const testimonialsSource = readFileSync(new URL("../components/ui/testimonials-3.tsx", import.meta.url), "utf8");

test("Kalojira campaign uses live product and inventory data", () => {
  assert.match(pageSource, /const slug = "kalojira-mixed"/);
  assert.match(pageSource, /fetchStorefrontProduct\(slug\)/);
  assert.match(pageSource, /fetchStorefrontProductInventory\(slug\)/);
  assert.match(pageSource, /mergeInventory\(productQuery\.data, inventoryQuery\.data\?\.inventory\)/);
  assert.match(pageSource, /id="kalojira-checkout"/);
  assert.match(checkoutSource, /apiRequest\("POST", "\/api\/orders", payload\)/);
  assert.doesNotMatch(pageSource, /unitPrice:\s*(?:990|1600)/);
});

test("campaign sections render the supplied assets and eight ingredients", () => {
  for (const asset of [
    "kalojira-mixed-hero-sep-8-v1.webp",
    "landing_static.webp",
    "kalojira-mixed-hero-studio-v1.webp",
    "kalojira-mixed-hero-plants-v1.webp",
    "kalojira-mixed-product-in-hand-v1.webp",
    "kalojira-mixed-ingredients-table-v1.webp",
    "kalojira-mixed-expert-murad-parvez-v1.webp",
  ]) {
    assert.match(sectionsSource, new RegExp(asset.replaceAll(".", "\\.")));
  }
  for (const ingredient of ["কালোজিরা", "রসুন", "বিশুদ্ধ মধু", "জয়তুন", "কিসমিস", "খেজুর", "ত্বীন ফল", "ইরানি জাফরান"]) {
    assert.ok(contentSource.includes(ingredient), `missing ingredient: ${ingredient}`);
  }
  assert.doesNotMatch(contentSource, /ডেমো রিভিউ — প্রকৃত গ্রাহক মতামত নয়/);
  assert.doesNotMatch(sectionsSource, /নিচের কার্ডগুলো ডেমো কনটেন্ট/);
  assert.doesNotMatch(sectionsSource, /<video|autoplay|process|packing/i);
});

test("campaign hero uses the supplied image without a background or frame", () => {
  assert.match(sectionsSource, /kalojira-mixed-hero-sep-8-v1\.webp/);
  assert.doesNotMatch(sectionsSource, /aria-labelledby="kalojira-hero-heading" className="border-b/);
  assert.doesNotMatch(sectionsSource, /overflow-hidden rounded-\[2rem\] bg-\[#f0c5a5\]\/35/);
});

test("campaign sections use compact vertical spacing", () => {
  assert.doesNotMatch(sectionsSource, /py-14 sm:py-20/);
  assert.match(sectionsSource, /py-8 sm:px-6 sm:py-12/);
  assert.match(sectionsSource, /py-4 sm:px-6 sm:py-8/);
});

test("campaign keeps claims honest and FAQ controls accessible", () => {
  assert.match(contentSource, /ওষুধ নয়/);
  assert.match(sectionsSource, /aria-expanded=\{open\}/);
  assert.match(sectionsSource, /aria-controls=\{answerId\}/);
  assert.match(sectionsSource, /prefers-reduced-motion/);
});

test("campaign chrome mirrors the Sundarbans header and sticky order bar", () => {
  assert.match(layoutSource, /max-w-5xl/);
  assert.match(layoutSource, /bg-\[#faf3e6\]/);
  assert.match(layoutSource, /bg-\[#eab308\]/);
  assert.match(layoutSource, /bg-\[#25d366\]/);
  assert.match(layoutSource, /WhatsAppBrandIcon/);
  assert.match(barSource, /WhatsAppBrandIcon/);
  assert.match(barSource, /onOrderClick\("sticky_bar"\)/);
  assert.match(barSource, /h-12 flex-1 rounded-full bg-\[#f5c456\]/);
  assert.match(barSource, /কল করুন/);
  assert.match(campaignCssSource, /background: rgba\(115, 115, 115, 0\.6\)/);
  assert.match(campaignCssSource, /border-radius: 8px/);
  assert.match(layoutSource, /Facebook পেজ/);
  assert.match(layoutSource, /fontFamily: "'KaiumSimanto', serif"/);
  assert.match(layoutSource, /bg-\[#0f241c\]/);
  assert.match(layoutSource, /font-extrabold leading-tight/);
  assert.match(campaignCssSource, /font-weight: 800/);
  assert.match(campaignCssSource, /-webkit-text-stroke: 0\.45px/);
});

test("ingredient cards use the Sundarbans editorial Swiss rail treatment", () => {
  assert.match(sectionsSource, /bg-\[#fbf4e8\]/);
  assert.match(sectionsSource, /lg:grid-cols-4/);
  assert.match(sectionsSource, /border-y border-\[#19382d\]\/20/);
  assert.match(sectionsSource, /text-5xl font-medium leading-none/);
  assert.match(sectionsSource, /scroll-px-5 sm:mx-0 sm:grid/);
});

test("why-eat and audience sections share the same editorial rail", () => {
  assert.match(sectionsSource, /<section aria-labelledby="kalojira-why-heading" className="border-b border-\[#19382d\]\/25 bg-\[#fbf4e8\]">/);
  assert.match(sectionsSource, /<section aria-labelledby="kalojira-audience-heading" className="border-b border-\[#19382d\]\/25 bg-\[#fbf4e8\]">/);
  assert.equal((sectionsSource.match(/<EditorialPointRail points=/g) ?? []).length, 3);
  assert.doesNotMatch(sectionsSource, /<PointGrid /);
});

test("review section uses the supplied testimonial card treatment without fake profile images", () => {
  assert.match(sectionsSource, /<TestimonialsSection\s+testimonials=\{demoReviews\.map/);
  assert.doesNotMatch(contentSource, /ডেমো রিভিউ — প্রকৃত গ্রাহক মতামত নয়/);
  assert.doesNotMatch(sectionsSource, /নিচের কার্ডগুলো ডেমো কনটেন্ট/);
  assert.match(sectionsSource, /role: "কালোজিরা মিক্সড"/);
  assert.match(sectionsSource, /company: "আঙ্গনালয়"/);
  assert.doesNotMatch(sectionsSource, /role: "ডেমো রিভিউ"/);
  assert.match(testimonialsSource, /md:grid-cols-3/);
  assert.match(testimonialsSource, /Quote/);
  assert.match(testimonialsSource, /AvatarFallback/);
  assert.doesNotMatch(testimonialsSource, /unavatar\.io|unsplash\.com/);
});

test("checkout offers free delivery and a save badge on the 1kg pack", () => {
  assert.match(checkoutSource, /সারা দেশে ডেলিভারি ফ্রি/);
  assert.ok((checkoutSource.match(/ডেলিভারি ফ্রি/g) ?? []).length >= 2, "free delivery shows in header and on both pack options");
  assert.match(checkoutSource, /pack\.label\.includes\("কেজি"\)/);
  assert.match(checkoutSource, /Save ৳460/);
  assert.match(checkoutSource, />ফ্রি</);
  assert.doesNotMatch(checkoutSource, /ডেলিভারি চার্জ ৳/);
  assert.match(contentSource, /হোম ডেলিভারি সম্পূর্ণ ফ্রি/);
});

test("product gallery sits immediately above checkout with product-page mobile controls", () => {
  assert.match(sectionsSource, /export function ProductGallery\(\)/);
  assert.match(sectionsSource, /md:hidden/);
  assert.match(sectionsSource, /h-full cursor-grab overflow-hidden/);
  assert.match(sectionsSource, /absolute left-2 top-1\/2/);
  assert.match(sectionsSource, /md:block/);
  assert.ok(pageSource.indexOf("<ProductGallery />") < pageSource.indexOf('<section id="kalojira-checkout"'));
});

test("product gallery stays minimal and follows the product-page image treatment", () => {
  assert.match(sectionsSource, /bg-brand-ivory/);
  assert.match(sectionsSource, /bg-brand-ivory px-4 py-4/);
  assert.match(sectionsSource, /rounded-\[8px\] bg-\[#f6f6f6\]/);
  assert.match(sectionsSource, /hidden md:block/);
  assert.match(sectionsSource, /mt-3 grid grid-cols-2 gap-3/);
  assert.doesNotMatch(sectionsSource, /জার, texture ও উপাদান—সবকিছু বাস্তব ছবিতে দেখুন।/);
  assert.doesNotMatch(sectionsSource, /<figcaption/);
});
