import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagePath = new URL("./sundarbans-honey.tsx", import.meta.url);
const checkoutPath = new URL("../features/sundarbans-honey/honey-checkout.tsx", import.meta.url);
const contentPath = new URL("../features/sundarbans-honey/content.ts", import.meta.url);
const layoutPath = new URL("../features/sundarbans-honey/campaign-layout.tsx", import.meta.url);
const sectionsPath = new URL("../features/sundarbans-honey/documentary-sections.tsx", import.meta.url);
const logoCloudPath = new URL("../components/ui/logo-cloud-3.tsx", import.meta.url);
const barPath = new URL("../features/sundarbans-honey/mobile-order-bar.tsx", import.meta.url);
const campaignCssPath = new URL("../index.css", import.meta.url);
const htmlPath = new URL("../../index.html", import.meta.url);
const attributionPath = new URL("../../public/step/sundarbans-natural-honey/ATTRIBUTION.md", import.meta.url);
const pageSource = readFileSync(pagePath, "utf8");
function readOptional(path: URL) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}
const contentSource = readOptional(contentPath);
const layoutSource = readOptional(layoutPath);
const sectionsSource = readOptional(sectionsPath);
const logoCloudSource = readOptional(logoCloudPath);
const barSource = readOptional(barPath);
const campaignCssSource = readOptional(campaignCssPath);
const htmlSource = readOptional(htmlPath);
const attributionSource = readOptional(attributionPath);
const checkoutSource = (() => {
  try {
    return readFileSync(checkoutPath, "utf8");
  } catch {
    return "";
  }
})();

test("campaign checkout polls the fixed live product and inventory with snapshot first paint", () => {
  assert.match(pageSource, /const slug = "sundarbans-natural-honey"/);
  assert.match(pageSource, /fetchStorefrontProduct\(slug\)/);
  assert.match(pageSource, /fetchStorefrontProductInventory\(slug\)/);
  assert.match(pageSource, /refetchInterval: STOREFRONT_POLL_INTERVAL_MS/);
  assert.match(pageSource, /generatedStorefrontProducts/);
  assert.match(pageSource, /findGeneratedStorefrontProduct/);
  assert.match(pageSource, /mergeInventory\(productQuery\.data, inventoryQuery\.data\?\.inventory\)/);
  assert.match(pageSource, /resolveHoneyCheckoutStatus/);
  assert.doesNotMatch(pageSource, /\{product \? \(/);
  assert.match(pageSource, /<HoneyCheckout[\s\S]*status=\{checkoutStatus\}/);
  assert.doesNotMatch(pageSource, /unitPrice:\s*(?:800|1600)/);
});

test("embedded checkout has pack, quantity, and accessible Bangla validation controls", () => {
  assert.match(checkoutSource, /export function HoneyCheckout/);
  assert.match(checkoutSource, /type="radio"/);
  assert.match(checkoutSource, /name="quantity"/);
  assert.doesNotMatch(checkoutSource, /<LocationCombobox/);
  assert.doesNotMatch(checkoutSource, /getUpazilas|DISTRICTS|districtId|upazilaId/);
  assert.match(checkoutSource, /\^\\d\{11\}\$/);
  assert.match(checkoutSource, /aria-describedby/);
  assert.match(checkoutSource, /aria-live="polite"/);
  assert.match(checkoutSource, /ফোন নম্বর/);
  assert.match(checkoutSource, /ডেলিভারি ঠিকানা/);
  assert.match(checkoutSource, /ক্যাশ অন ডেলিভারি/);
  assert.doesNotMatch(checkoutSource, /Dialog/);
});

test("submission revalidates the exact pack and sends only the COD contract", () => {
  assert.match(checkoutSource, /await Promise\.all/);
  assert.match(checkoutSource, /productQuery\.refetch\(\)/);
  assert.match(checkoutSource, /inventoryQuery\.refetch\(\)/);
  assert.match(checkoutSource, /variantId === selectedVariantId/);
  assert.match(checkoutSource, /এই প্যাকটি এখন অর্ডারের জন্য পাওয়া যাচ্ছে না। অন্য প্যাক বেছে নিন বা আমাদের কল করুন।/);
  assert.match(checkoutSource, /HONEY_DELIVERY_CHARGE/);
  assert.match(checkoutSource, /paymentMethod: "cash_on_delivery"/);
  assert.doesNotMatch(checkoutSource, /trackingMode/);
  assert.match(checkoutSource, /apiRequest\("POST", "\/api\/orders", payload\)/);
  assert.match(checkoutSource, /disabled=\{isPending \|\| status !== "ready"\}/);
  assert.match(checkoutSource, /setLocation\("\/step\/sundarbans-natural-honey\/thank-you"\)/);
  assert.doesNotMatch(checkoutSource, /trackGoogleEcommerceEvent\("purchase"/);
});

test("availability failures preserve the mounted form and provide exact recovery actions", () => {
  assert.doesNotMatch(checkoutSource, /if \(!packs\.length\) \{/);
  assert.match(checkoutSource, /status: HoneyCheckoutStatus/);
  assert.match(checkoutSource, /AVAILABILITY_ERROR/);
  assert.match(checkoutSource, /onRetry/);
  assert.equal((checkoutSource.match(/<SupportActions \/>/g) ?? []).length, 2);
  assert.match(checkoutSource, /status === "ready" \? selectedPack : null/);
});

test("validation focuses controls in explicit DOM order and gives every pack radio an id", () => {
  assert.match(checkoutSource, /getHoneyFocusTargetId/);
  assert.match(checkoutSource, /id=\{`honey-pack-\$\{pack\.variantId\}`\}/);
  assert.doesNotMatch(checkoutSource, /Object\.keys\(fieldErrors\)/);
});

test("pack radios keep one rendered description in validation and availability recovery", () => {
  assert.match(checkoutSource, /const packError = showAvailabilityRecovery \? AVAILABILITY_ERROR : errors\.pack;/);
  assert.match(checkoutSource, /fieldErrorProps\("honey-pack", packError\)/);
  assert.equal((checkoutSource.match(/<InlineError id="honey-pack"/g) ?? []).length, 1);
  assert.match(checkoutSource, /<InlineError id="honey-pack" error=\{packError\}/);
  assert.doesNotMatch(checkoutSource, /error=\{showAvailabilityRecovery \? undefined : errors\.pack\}/);
  assert.doesNotMatch(checkoutSource, /id="honey-pack-error"/);
});

test("checkout analytics use product data but never customer fields", () => {
  assert.match(checkoutSource, /trackGoogleEcommerceEvent\("view_item"/);
  assert.match(checkoutSource, /trackGoogleEcommerceEvent\("select_item"/);
  assert.match(checkoutSource, /trackGoogleEcommerceEvent\("begin_checkout"/);
  assert.match(checkoutSource, /items: \[analyticsItem\(initialPack, 1\)\]/);
  assert.match(checkoutSource, /items: \[analyticsItem\(pack, quantity\)\]/);
  assert.doesNotMatch(checkoutSource, /trackHoneyCampaignEvent/);
});

test("reference-inspired narrative renders the centered conversion sections in order", () => {
  const combined = `${contentSource}\n${sectionsSource}\n${pageSource}`;
  const required = [
    "সুন্দরবনের চাকের মধু—প্রকৃতির আসল স্বাদ",
    "বনের গল্প, বাস্তব ভিডিওতে",
    "কেন সুন্দরবনের চাকের মধু বিশেষ?",
    "অর্ডারের আগে যা জানা দরকার",
     "Mango Lover vs অন্যান্য Brands",
     "আপনার প্রশ্নের উত্তর",
    "এক বছরের কম বয়সী শিশুকে মধু দেওয়া যাবে না।",
  ];
  for (const text of required) {
    assert.ok(combined.includes(text), `missing approved copy: ${text}`);
  }
  assert.match(sectionsSource, /<section[\s>]/);
  assert.match(sectionsSource, /aria-labelledby/);
});

test("approved content data uses strong source, handling, and responsible copy", () => {
  assert.match(contentSource, /প্রাকৃতিক মৌচাক থেকে সংগ্রহ/);
  assert.match(contentSource, /সুন্দরবনের নানা বুনো ফুলের নেকটার/);
  assert.match(contentSource, /স্বাদ, ঘ্রাণ ও রং/);
  assert.match(contentSource, /পরিষ্কারভাবে বোতলজাত/);
  assert.match(contentSource, /সারা দেশে হোম ডেলিভারি/);
  assert.match(contentSource, /export const importantNotes/);
  assert.match(contentSource, /tone: "warning"/);
  assert.match(contentSource, /tone: "info"/);
  assert.match(contentSource, /ডায়াবেটিস বা রক্তে শর্করার সমস্যা থাকলে চিকিৎসক বা পুষ্টিবিদের পরামর্শ নিন।/);
  assert.match(contentSource, /প্রাকৃতিক শক্তির একটি সহজ উৎস হতে পারে/);
  assert.match(contentSource, /মুরাদ পারভেজ/);
  assert.match(contentSource, /মৌচাক থেকে বোতল পর্যন্ত/);
});

test("why Mango Lover section renders the supplied comparison artwork", () => {
  assert.match(sectionsSource, /mango-lover-vs-other-brands-v1\.webp/);
  assert.match(sectionsSource, /alt="Mango Lover vs অন্যান্য Brands — পার্থক্যটা নিজেই দেখুন"/);
  assert.doesNotMatch(sectionsSource, /ComparisonMatrix|honey-comparison-matrix/);
  assert.match(sectionsSource, /placement="content_bottom"/);
  assert.match(contentSource, /Mango Lover vs অন্যান্য Brands/);
});

test("family and everyday-use points use an editorial mobile rail", () => {
  assert.match(sectionsSource, /EditorialPointRail points=\{whoCanConsumePoints\}/);
  assert.match(sectionsSource, /EditorialPointRail points=\{waysToEnjoyPoints\}/);
  assert.match(sectionsSource, /overflow-x-auto/);
  assert.match(sectionsSource, /snap-x snap-mandatory/);
  assert.match(sectionsSource, /scroll-smooth/);
  assert.match(sectionsSource, /min-w-\[82%\]/);
  assert.match(sectionsSource, /aria-label="আগের কার্ড"/);
  assert.match(sectionsSource, /aria-label="পরের কার্ড"/);
  assert.match(sectionsSource, /scrollPoints/);
});

test("important notes are summarized inside the FAQ section", () => {
  const faqSection = sectionsSource.slice(sectionsSource.indexOf('aria-labelledby="honey-faq-heading"'));
  assert.match(faqSection, /<aside aria-labelledby="honey-notes-heading"/);
  assert.match(faqSection, /importantNotes\.map/);
  assert.doesNotMatch(faqSection, /<section aria-labelledby="honey-notes-heading"/);
});

test("FAQ disclosures animate accessibly and checkout uses a lighter card shell", () => {
  assert.match(sectionsSource, /AnimatePresence/);
  assert.match(sectionsSource, /aria-expanded=\{isOpen\}/);
  assert.match(sectionsSource, /height: "auto"/);
  assert.match(checkoutSource, /rounded-2xl/);
  assert.doesNotMatch(checkoutSource, /shadow-\[0_24px_70px/);
  assert.match(checkoutSource, /border border-black/);
});

test("checkout keeps its focus target without the removed campaign headings", () => {
  assert.match(checkoutSource, /id="honey-checkout-heading"/);
  assert.doesNotMatch(checkoutSource, /সহজ অর্ডার/);
  assert.doesNotMatch(pageSource, /checkoutSectionHeading|সুন্দরবনের প্রাকৃতিক চাকের মধু অর্ডার করুন/);
  assert.match(checkoutSource, /ক্যাশ অন ডেলিভারিতে অর্ডার করুন/);
});

test("hero has no price while checkout consumes API-backed options", () => {
  const heroSource = sectionsSource.slice(0, sectionsSource.indexOf("honey-collection-reel"));
  assert.doesNotMatch(heroSource, /৳/);
  assert.match(checkoutSource, /৳/);
  assert.doesNotMatch(sectionsSource, /featuredPacksHeading|featuredPacksSubcopy/);
});

test("honest media policy: no fabricated proof, no autoplay, only approved native reels", () => {
  const combined = `${contentSource}\n${layoutSource}\n${sectionsSource}\n${barSource}\n${pageSource}`;
  assert.doesNotMatch(combined, /autoplay/i);
  assert.doesNotMatch(sectionsSource, /player\.cloudinary\.com\/embed/);
  assert.equal(sectionsSource.match(/<video/g)?.length ?? 0, 1);
  assert.match(sectionsSource, /res\.cloudinary\.com\/n0d6bs08\/video\/upload/);
  assert.match(sectionsSource, /preload="metadata"/);
  assert.doesNotMatch(sectionsSource, /review-section|honey-review|ReviewCard|review-card/i);
  assert.doesNotMatch(sectionsSource, /unsplash|picsum|placeholder/i);
  assert.match(sectionsSource, /fetchpriority="high"/i);
  assert.equal(sectionsSource.match(/<img/g)?.length ?? 0, 9);
});

test("bundle showcase replaces the founder placeholder with supplied pack artwork", () => {
  assert.match(sectionsSource, /honey-bundle-showcase/);
  assert.match(sectionsSource, /sundarbans-honey-bundle-500g-v3\.webp/);
  assert.match(sectionsSource, /sundarbans-honey-bundle-1kg-v3\.webp/);
  assert.match(sectionsSource, /placement=\"bundle_500g\"/);
  assert.match(sectionsSource, /placement=\"bundle_1kg\"/);
  assert.doesNotMatch(sectionsSource, /honey-founder-heading|founder video \/ portrait/);
});

test("why-special section renders the supplied infographic with a text mirror", () => {
  assert.match(sectionsSource, /honey-why-heading/);
  assert.match(sectionsSource, /sundarbans-why-special-infographic-v2\.webp/);
  assert.match(sectionsSource, /whySpecialPoints\.map/);
  assert.match(sectionsSource, /loading="lazy"/);
  assert.doesNotMatch(sectionsSource, /whySpecialPoints\.slice/);
});

test("collection heading uses the supplied Bangla artwork", () => {
  assert.match(sectionsSource, /sundarbans-honey-collection-heading-v1\.webp/);
  assert.match(sectionsSource, /alt: "বনের গল্প, বাস্তব ভিডিওতে"/);
});

test("hero is centered with a strong headline, order CTA, and product image", () => {
  assert.match(sectionsSource, /placement="hero"/);
  assert.match(sectionsSource, /honey-hero-heading/);
  assert.match(sectionsSource, /sundarbans-honey-hero-v2\.webp/);
  assert.match(sectionsSource, /sundarbans-honey-hero-banner-v1\.webp/);
  assert.match(sectionsSource, /object-contain/);
  assert.match(sectionsSource, /bg-\[#EAB308\]/i);
  assert.doesNotMatch(sectionsSource, /reviewSlotLabel/);
  assert.doesNotMatch(sectionsSource, /heroPoints\.map/);
});

test("trust ribbon uses the reusable reduced-motion marquee", () => {
  assert.match(sectionsSource, /LogoCloudBlock/);
  assert.match(logoCloudSource, /honey-trust-marquee/);
  assert.match(logoCloudSource, /prefers-reduced-motion/);
  assert.match(logoCloudSource, /aria-hidden/);
  assert.match(contentSource, /বুনো ফুলের নেকটার থেকে সংগৃহীত মধু/);
  assert.match(contentSource, /মৌচাক থেকে বোতল—প্রতিটি ধাপে যত্ন/);
  assert.match(contentSource, /সারা দেশে সহজ ক্যাশ অন ডেলিভারি/);
});

test("minimal campaign chrome links phone and WhatsApp without full layout", () => {
  assert.match(contentSource, /tel:\+8801301636461/);
  assert.match(contentSource, /https:\/\/wa\.me\/8801301636461/);
  assert.match(layoutSource, /@assets\/mango-lover-logo\.avif/);
  assert.match(layoutSource, /কোনো কিছু জানতে কিংবা/);
  assert.match(layoutSource, / সরাসরি অর্ডার করতে যোগাযোগ করুন/);
  assert.match(layoutSource, /fontFamily: "'KaiumSimanto', serif"/);
  assert.doesNotMatch(layoutSource, /sundarbans-honey-footer-contact-v1\.webp/);
  assert.match(layoutSource, /HONEY_CAMPAIGN_PHONE_HREF/);
  assert.match(layoutSource, /HONEY_CAMPAIGN_WHATSAPP_HREF/);
  assert.match(layoutSource, /label="ফোনে অর্ডার করুন"/);
  assert.match(layoutSource, /label="WhatsApp-এ অর্ডার করুন"/);
  assert.doesNotMatch(layoutSource, /components\/layout/);
  assert.doesNotMatch(layoutSource, /CartProvider|useCart/);
  assert.match(pageSource, /CampaignHeader/);
  assert.match(pageSource, /CampaignFooter/);
});

test("sticky bar exposes three accessible actions and hides at checkout", () => {
  assert.match(barSource, /অর্ডার করুন/);
  assert.match(barSource, /HONEY_CAMPAIGN_PHONE_HREF/);
  assert.match(barSource, /HONEY_CAMPAIGN_WHATSAPP_HREF/);
  assert.ok((barSource.match(/aria-label=/g) ?? []).length >= 3);
  assert.match(barSource, /IntersectionObserver/);
  assert.match(barSource, /honey-checkout/);
  assert.match(campaignCssSource, /env\(safe-area-inset-bottom\)/);
  assert.match(pageSource, /MobileOrderBar/);
});

test("CTAs scroll to checkout and focus its heading without direct interaction tracking", () => {
  assert.match(sectionsSource, /OrderButton/);
  assert.match(sectionsSource, /অর্ডার করুন/);
  assert.match(sectionsSource, /onOrderClick\(/);
  assert.doesNotMatch(pageSource, /trackHoneyCampaignEvent/);
  assert.match(pageSource, /prefers-reduced-motion: reduce/);
  assert.match(checkoutSource, /tabIndex=\{-1\}/);
  assert.match(pageSource, /\.focus\(/);
  assert.match(pageSource, /scrollIntoView/);
  assert.match(pageSource, /sundarbans-honey-page/);
});

test("campaign typography and palette stay scoped off global tokens", () => {
  assert.match(campaignCssSource, /\.sundarbans-honey-page/);
  assert.match(campaignCssSource, /Hind Siliguri/);
  assert.match(campaignCssSource, /honey-heading-heavy/);
  assert.match(campaignCssSource, /font-weight: 700/);
  assert.match(campaignCssSource, /-webkit-text-stroke: 0\.45px/);
  assert.match(campaignCssSource, /--honey-forest/);
  assert.match(campaignCssSource, /--honey-gold/);
  assert.match(campaignCssSource, /--honey-brown/);
  assert.match(campaignCssSource, /--honey-cream/);
  assert.match(htmlSource, /Hind\+Siliguri/);
});

test("missing authentic media is documented per asset, not fabricated", () => {
  for (const asset of [
    "sundarbans-river-hero-v1.webp",
    "sundarbans-honeycomb-hero-v1.webp",
    "sundarbans-hive-v1.webp",
    "sundarbans-collection-v1.webp",
    "sundarbans-collection-poster-v1.webp",
    "sundarbans-collection-v1.mp4",
    "sundarbans-collection-v1.webm",
    "nutritionist-murad-parvez-v1.webp",
  ]) {
    assert.ok(attributionSource.includes(asset), `ATTRIBUTION.md must track ${asset}`);
  }
  assert.match(attributionSource, /pending/i);
});

test("fix round 1: no fabricated-proof-adjacent claims without shipped media", () => {
  const combined = `${contentSource}\n${sectionsSource}\n${pageSource}`;
  assert.doesNotMatch(combined, /ঠিক সেভাবেই তুলে ধরি/);
  assert.doesNotMatch(combined, /সত্য বর্ণনা/);
  assert.match(contentSource, /সংগ্রহ প্রক্রিয়ার বর্ণনা/);
  assert.doesNotMatch(combined, /কৃত্রিম খামার/);
  assert.match(contentSource, /প্রাকৃতিক মৌচাক থেকে সংগ্রহ করা মধু/);
});

test("fix round 1: reviews omission is gated on approval, not auto-shippable", () => {
  assert.doesNotMatch(sectionsSource, /review-section|honey-review|ReviewCard|review-card/i);
  assert.match(sectionsSource, /intentionally omitted/i);
  assert.match(contentSource, /shipped: false/);
  assert.match(contentSource, /stakeholder approval/i);
  assert.match(attributionSource, /stakeholder approval/i);
  assert.match(attributionSource, /not auto-shippable/i);
});
