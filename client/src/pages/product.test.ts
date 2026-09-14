import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const productSource = readFileSync(new URL("./product.tsx", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.css", import.meta.url), "utf8");

test("uses distinct vibrant channel colors for phone and WhatsApp order actions", () => {
  assert.match(
    productSource,
    /href="tel:\+8801301636461"[\s\S]*?bg-\[#f26b4f\][\s\S]*?text-white[\s\S]*?hover:bg-\[#d9573d\]/,
  );
  assert.match(
    productSource,
    /href=\{`https:\/\/wa\.me[\s\S]*?bg-\[#25d366\][\s\S]*?text-white[\s\S]*?hover:bg-\[#1da851\]/,
  );
});

test("keeps channel buttons visually soft rather than heavily bordered or shadowed", () => {
  assert.match(productSource, /border-white\/20[\s\S]*?shadow-none/);
  assert.doesNotMatch(productSource, /shadow-sm|shadow-\[/);
});

test("uses Kaium Simanto for delivery timeline Bengali labels", () => {
  assert.match(productSource, /fontFamily: "'KaiumSimanto', serif"/);
  assert.match(indexSource, /font-family: 'KaiumSimanto'/);
  assert.match(indexSource, /kaium-simanto-unicode\.ttf/);
  assert.match(productSource, /className="h-5 w-5" weight="Filled"/);
  assert.match(productSource, /text-\[11px\] font-normal tracking-\[0\.03em\]/);
  assert.match(productSource, /text-\[14px\] font-normal leading-4/);
  assert.match(productSource, /অর্ডার গ্রহণ/);
  assert.match(productSource, /প্রসেসিং/);
  assert.match(productSource, /ডেলিভারি/);
});

test("uses shared sizing and IhtishamDeshlipi for product detail labels", () => {
  assert.match(productSource, /বিস্তারিত/);
  assert.match(productSource, /বৈশিষ্ট্য/);
  assert.match(productSource, /text-\[19px\] font-normal text-black/);
  assert.match(productSource, /text-\[19px\] font-normal text-black\/65/);
  assert.match(productSource, /fontFamily: "'IhtishamDeshlipi', serif"/);
  assert.match(productSource, /text-\[15px\] transition-colors md:text-\[17px\]/);
});

test("does not mark a live product unavailable while inventory is still loading", () => {
  assert.match(productSource, /const merchantUnavailable = merchantProductUnavailable \|\| inventoryUnavailable/);
  assert.match(productSource, /const inventoryUnavailable = merchantInventory\?\.inventory \? !isProductOrderable\(product\) : false/);
});

test("only clears stale product data after the Merchant Suite confirms a 404", () => {
  assert.match(productSource, /isFetchedAfterMount, isSuccess/);
  assert.match(productSource, /const productMissingFromMerchant = isFetchedAfterMount && isSuccess && merchantProduct === null/);
  assert.match(productSource, /const product = productMissingFromMerchant\s*\? null\s*:/);
  assert.match(productSource, /if \(!isFetchedAfterMount \|\| !isSuccess\) return;[\s\S]*?if \(merchantProduct === null\) \{[\s\S]*?removeCachedStorefrontProduct\(window\.localStorage, slug\);[\s\S]*?setCachedProduct\(null\);/);
  assert.match(productSource, /const merchantAvailabilityKnown = isFetchedAfterMount && isSuccess && merchantProduct !== undefined/);
  assert.doesNotMatch(productSource, /const merchantAvailabilityKnown = isFetched \|\| isError/);
});

test("lets customers choose a quantity for cart and direct checkout", () => {
  assert.match(productSource, /const \[quantity, setQuantity\] = useState\(1\)/);
  assert.match(productSource, /aria-label="Decrease quantity"/);
  assert.match(productSource, /disabled=\{quantity === 1\}/);
  assert.match(productSource, /aria-label="Increase quantity"/);
  assert.match(productSource, /Math\.max\(1, current - 1\)/);
  assert.match(productSource, /price: selectedBundle\.amount \* quantity/);
  assert.match(productSource, /selectedBundle\.title,\s*quantity/);
});

test("shows quantity before size at every breakpoint", () => {
  const quantityIndex = productSource.indexOf("                    Quantity");
  const sizeIndex = productSource.indexOf("                    Select Size");

  assert.notEqual(quantityIndex, -1);
  assert.notEqual(sizeIndex, -1);
  assert.ok(quantityIndex < sizeIndex);
});

test("derives one-size width from the quantity control without changing the multi-size grid", () => {
  assert.match(productSource, /const quantityControlRef = useRef<HTMLDivElement>\(null\)/);
  assert.match(productSource, /const \[quantityControlWidth, setQuantityControlWidth\] = useState<number \| null>\(null\)/);
  assert.match(productSource, /new ResizeObserver/);
  assert.match(productSource, /ref=\{quantityControlRef\}/);
  assert.match(productSource, /style=\{bundles\.length === 1 && quantityControlWidth/);
  assert.match(productSource, /width: `\$\{quantityControlWidth \+ 7\}px`/);
  assert.match(productSource, /bundles\.length === 1 \? "inline-flex" : "grid grid-cols-2 gap-2"/);
  assert.match(productSource, /bundles\.length === 1 \? "w-full" : ""/);
});

test("highlights the বৈশিষ্ট্য label with the existing yellow hand-drawn oval", () => {
  assert.match(
    productSource,
    /<span[\s\S]*?className="[^\"]*relative inline-block[^\"]*"[\s\S]*?বৈশিষ্ট্য[\s\S]*?stroke="#FBBB14"/,
  );
});

test("uses aligned Bengali numbering in the normal detail-list font", () => {
  assert.match(productSource, /const BENGALI_DIGITS = \[/);
  assert.match(productSource, /function toBengaliNumeral\(value: number\)/);
  assert.match(productSource, /toBengaliNumeral\(detailIndex \+ 1\)/);
  assert.match(productSource, /grid-cols-\[1\.5rem_minmax\(0,1fr\)\]/);
  assert.match(productSource, /items-start/);
  assert.match(productSource, /fontFamily: "inherit"/);
  assert.match(productSource, /text-brand-gold/);
  assert.doesNotMatch(productSource, /rotate-45/);
  assert.doesNotMatch(productSource, /rounded-full bg-brand-gold/);
});

test("left-aligns and offsets the active product detail tab content", () => {
  assert.match(productSource, /<div className="space-y-1\.5 text-left">/);
  assert.match(productSource, /<ul className="-ml-3 max-w-\[720px\] space-y-1 text-left md:-ml-4">/);
  assert.match(productSource, /className="grid w-full max-w-full grid-cols-\[1\.5rem_minmax\(0,1fr\)\]/);
  assert.doesNotMatch(productSource, /space-y-1\.5 text-center/);
});

test("renders product reels as a smooth horizontal snap carousel", () => {
  assert.match(productSource, /const \[reelRef, reelApi\] = useEmblaCarousel/);
  assert.match(productSource, /ref=\{reelRef\}/);
  assert.match(productSource, /align: "center"/);
  assert.match(productSource, /loop: true/);
  assert.match(productSource, /duration: 35/);
  assert.match(productSource, /-mx-4[^"`]*md:mx-0/);
  assert.match(productSource, /gap-0 px-0 md:px-6/);
  assert.match(productSource, /mr-3[^"`]*md:mr-6/);
  assert.match(productSource, /max-w-none md:max-w-\[480px\]/);
  assert.match(productSource, /basis-\[60vw\][^"`]*md:basis-\[240px\]/);
  assert.match(productSource, /REEL_MEDIA = \[/);
  assert.match(productSource, /res\.cloudinary\.com\/n0d6bs08\/video\/upload/);
  assert.match(productSource, /<video/);
  assert.match(productSource, /controls=\{activeReelVideo === i\}/);
  // Only the active slide mounts a <video>, so a mobile drag moves one cheap layer
  // instead of three decoding video layers.
  assert.match(productSource, /i === currentReel/);
  assert.match(productSource, /preload="metadata"/);
  assert.doesNotMatch(productSource, /autoPlay=/);
  assert.match(productSource, /so_1,w_480,f_auto,q_auto/);
  assert.match(productSource, /Play className/);
  assert.match(productSource, /activeReelVideoRef/);
  assert.match(productSource, /src=\{poster\}[\s\S]*?pointer-events-none/);
  assert.match(productSource, /loading="lazy"/);
  assert.doesNotMatch(productSource, /video\.load\(\)/);
  assert.match(productSource, /will-change-transform/);
  assert.match(productSource, /video\.muted = false/);
  assert.doesNotMatch(productSource, /pointer-events-none md:pointer-events-auto/);
  assert.match(productSource, /snapsave-app_1C33w5xnV7_hd/);
  assert.match(productSource, /snapsave-app_1700766014578997_hd/);
  assert.doesNotMatch(productSource, /snap-center/);
  assert.match(productSource, /\[touch-action:pan-y_pinch-zoom\]/);
  assert.doesNotMatch(productSource, /scale-\[0\.94\]/);
  assert.match(productSource, /reelApi\.scrollPrev\(\)/);
  assert.match(productSource, /reelApi\.scrollNext\(\)/);
  assert.match(productSource, /reelApi\.on\("pointerDown", pauseReelsDuringDrag\)/);
  assert.doesNotMatch(productSource, /wistia-player/);
});

test("uses native Cloudinary reels only for Honey Nut", () => {
  assert.match(productSource, /const HONEY_NUT_REEL_MEDIA = \[/);
  assert.match(productSource, /FDown\.vn_Facebook_Video_Downloader_720p_HD__7925\.mp4/);
  assert.match(productSource, /snapsave-app_1432224402135483_hd\.mp4/);
  assert.match(productSource, /FDown\.vn_Facebook_Video_Downloader_720p_HD__8e09\.mp4/);
  assert.doesNotMatch(productSource, /player\.cloudinary\.com\/embed/);
  assert.match(productSource, /const honeyNutReelMedia = slug === "honey-nut" \? HONEY_NUT_REEL_MEDIA : null/);
  assert.match(productSource, /const reelMedia = honeyNutReelMedia \? honeyNutReelMedia : REEL_MEDIA/);
  assert.match(productSource, /reelMedia\.map\(\(\{ src, poster \}, i\) =>/);
  assert.match(productSource, /video\/upload\/so_1,w_480,f_auto,q_auto/);
  assert.match(productSource, /poster=\{poster\}/);
  assert.match(productSource, /className="relative aspect-\[9\/16\] w-full overflow-hidden rounded-\[6px\] bg-black"/);
});

test("navigates reels with arrow keys without hijacking editable controls", () => {
  assert.match(productSource, /const target = e\.target as HTMLElement \| null/);
  assert.match(productSource, /target instanceof HTMLInputElement[\s\S]*?target instanceof HTMLTextAreaElement[\s\S]*?target instanceof HTMLSelectElement[\s\S]*?target\?\.isContentEditable/);
  assert.match(productSource, /e\.preventDefault\(\);\s*goReel\(-1\)/);
  assert.match(productSource, /e\.preventDefault\(\);\s*goReel\(1\)/);
});

test("keeps previous and next reel buttons visible on mobile", () => {
  assert.match(productSource, /className="absolute left-2 top-1\/2 flex -translate-y-1\/2/);
  assert.match(productSource, /className="absolute right-2 top-1\/2 flex -translate-y-1\/2/);
  assert.doesNotMatch(productSource, /left-2 top-1\/2 hidden -translate-y-1\/2/);
  assert.doesNotMatch(productSource, /right-2 top-1\/2 hidden -translate-y-1\/2/);
});

test("uses the poster while the active native video is loading", () => {
  assert.match(productSource, /preload="metadata"/);
  assert.match(productSource, /poster=\{poster\}/);
  assert.doesNotMatch(productSource, /loadedHoneyNutReel/);
});
