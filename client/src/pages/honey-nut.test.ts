import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path: string) {
  try {
    return readFileSync(new URL(path, import.meta.url), "utf8");
  } catch {
    return "";
  }
}

const pageSource = readSource("./honey-nut.tsx");
const sectionsSource = readSource("../features/honey-nut/documentary-sections.tsx");
const contentSource = readSource("../features/honey-nut/content.ts");
const stylesSource = readSource("../features/honey-nut/campaign.css");
const mobileBarSource = readSource("../features/honey-nut/mobile-order-bar.tsx");
const layoutSource = readSource("../features/honey-nut/campaign-layout.tsx");
const campaignSource = `${sectionsSource}\n${contentSource}`;

const requiredAssets = [
  "honey-nut-hero-v1.webp",
  "honey-nut-nutrition-flatlay-v1.webp",
  "honey-nut-ingredient-honey-v2.webp",
  "honey-nut-ingredient-almond-v1.webp",
  "honey-nut-ingredient-cashew-v1.webp",
  "honey-nut-ingredient-walnut-v1.webp",
  "honey-nut-ingredient-pistachio-v2.webp",
  "honey-nut-ingredient-thai-almond-v1.webp",
  "honey-nut-ingredient-sunflower-seed-v1.webp",
  "honey-nut-ingredient-black-raisin-v1.webp",
  "honey-nut-ingredient-white-sesame-v1.webp",
  "honey-nut-gallery-jar-v1.webp",
  "honey-nut-gallery-jar-v2.webp",
  "honey-nut-gallery-spoon-v1.webp",
  "honey-nut-gallery-mix-v1.webp",
  "honey-nut-routine-v1.webp",
  "honey-nut-quality-packaging-v2.webp",
  "honey-nut-nutritionist-murad-parvez-v1.webp",
] as const;

const ingredients = ["লিচুফুলের মধু", "কাঠবাদাম", "কাজুবাদাম", "আখরোট", "পেস্তা বাদাম", "থাই বাদাম", "সূর্যমুখী বীজ", "কালো কিসমিস", "সাদা তিল"];

test("Honey Nut campaign uses the live product and inventory APIs", () => {
  assert.match(pageSource, /const slug = "honey-nut"/);
  assert.match(pageSource, /fetchStorefrontProduct\(slug\)/);
  assert.match(pageSource, /fetchStorefrontProductInventory\(slug\)/);
  assert.match(pageSource, /mergeInventory\(productQuery\.data, inventoryQuery\.data\?\.inventory\)/);
  assert.match(pageSource, /id="honey-nut-checkout"/);
});

test("Honey Nut campaign renders all supplied assets and ingredients", () => {
  for (const asset of requiredAssets) {
    assert.match(campaignSource, new RegExp(asset.replaceAll(".", "\\.")), `missing asset: ${asset}`);
  }
  for (const ingredient of ingredients) {
    assert.ok(contentSource.includes(ingredient), `missing ingredient: ${ingredient}`);
  }
  assert.match(sectionsSource, /murad-parvez/);
  assert.match(sectionsSource, /honey-nut-nutritionist-murad-parvez-v1\.webp/);
  assert.doesNotMatch(sectionsSource, /kalojira-mixed-expert-murad-parvez/);
  assert.match(contentSource, /honey-nut-ingredient-honey-v2\.webp/);
  assert.match(sectionsSource, /TestimonialsSection/);
});

test("Honey Nut campaign keeps FAQ and CTA interactions accessible", () => {
  assert.match(sectionsSource, /aria-expanded=\{open\}/);
  assert.match(sectionsSource, /aria-controls=\{answerId\}/);
  assert.match(sectionsSource, /prefers-reduced-motion/);
  assert.match(pageSource, /honey-nut-checkout/);
});

test("Honey Nut campaign uses responsible food positioning and guide FAQs", () => {
  assert.match(contentSource, /ওষুধ নয়/);
  assert.match(contentSource, /অ্যালার্জি/);
  assert.match(contentSource, /ঠান্ডা ও শুষ্ক স্থানে/);
  assert.match(contentSource, /১ কেজি/);
});

test("Honey Nut quality section uses a Swiss editorial layout", () => {
  assert.doesNotMatch(sectionsSource, /QUALITY \/ 05/);
  assert.match(sectionsSource, /honey-nut-quality-packaging-v2\.webp/);
  assert.match(sectionsSource, /String\(index \+ 1\)\.padStart\(2, "0"\)/);
  assert.match(sectionsSource, /lg:grid-cols-\[0\.85fr_1\.15fr\]/);
  assert.match(sectionsSource, /grid-cols-\[2\.5rem_1fr\]/);
});

test("Honey Nut titles use the normal Bengali font stack", () => {
  assert.match(stylesSource, /Hind Siliguri.*Inter.*system-ui/);
  assert.doesNotMatch(stylesSource, /KaiumSimanto/);
});

test("Honey Nut mobile sticky bar mirrors Kalojira's three-action behavior", () => {
  assert.match(mobileBarSource, /IntersectionObserver/);
  assert.match(mobileBarSource, /data-hidden/);
  assert.match(mobileBarSource, /WhatsAppBrandIcon/);
  assert.match(mobileBarSource, /onOrderClick\("sticky_bar"\)/);
  assert.match(stylesSource, /safe-area-inset-bottom/);
  assert.match(stylesSource, /honey-nut-order-bar\[data-hidden="true"\]/);
});

test("Honey Nut header and footer mirror the Kalojira campaign chrome", () => {
  assert.match(layoutSource, /border-\[#19382d\]\/10 bg-\[#faf3e6\]/);
  assert.match(layoutSource, /bg-\[#eab308\] text-\[#19382d\]/);
  assert.match(layoutSource, /কোনো কিছু জানতে কিংবা/);
  assert.match(layoutSource, /Privacy Policy/);
  assert.match(layoutSource, /border-\[#19382d\]\/15/);
  assert.match(layoutSource, /হানি নাট পেজ/);
  assert.doesNotMatch(layoutSource, /Honey Nut — Selected/);
  assert.match(layoutSource, /fontFamily: "'KaiumSimanto', serif"/);
});

test("Honey Nut reuses the exact WhatsApp icon and places gallery before checkout", () => {
  assert.match(layoutSource, /from "@\/features\/kalojira-mixed\/campaign-layout"/);
  const galleryPosition = pageSource.indexOf("<ProductGallery />");
  const checkoutPosition = pageSource.indexOf('id="honey-nut-checkout"');
  assert.ok(galleryPosition >= 0);
  assert.ok(checkoutPosition >= 0);
  assert.ok(galleryPosition < checkoutPosition);
});

test("Honey Nut ingredient cards use the Swiss horizontal mobile rail", () => {
  assert.match(sectionsSource, /function IngredientRail/);
  assert.match(sectionsSource, /String\(index \+ 1\)\.padStart\(2, "0"\)/);
  assert.match(sectionsSource, /className="[^"]*sm:hidden/);
  assert.match(sectionsSource, /min-w-\[52%\]/);
  assert.match(sectionsSource, /text-center font-serif text-5xl/);
  assert.match(sectionsSource, /gap-1 overflow-x-auto/);
  assert.match(sectionsSource, /className="hidden sm:grid/);
});
