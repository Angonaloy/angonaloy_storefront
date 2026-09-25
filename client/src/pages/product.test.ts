import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const productSource = readFileSync(new URL("./product.tsx", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.css", import.meta.url), "utf8");

test("renders phone and WhatsApp order actions as outlined ink pills", () => {
  assert.match(
    productSource,
    /href="tel:\+8801819502705"[\s\S]*?bloop-pill h-11 border-bloop-ink[\s\S]*?text-bloop-ink[\s\S]*?ফোনে অর্ডার/,
  );
  assert.match(
    productSource,
    /href=\{`https:\/\/wa\.me\/8801819502705\?text=\$\{encodeURIComponent\([\s\S]*?target="_blank"[\s\S]*?rel="noopener noreferrer"[\s\S]*?bloop-pill h-11 border-bloop-ink[\s\S]*?হোয়াটসএপ-এ অর্ডার/,
  );
  assert.match(productSource, /Hello, I'd like to order: \$\{product\.name\} \(\$\{selectedBundle\.title\}\)/);
});

test("keeps the buy box flat: no drop shadows on the in-page buttons", () => {
  assert.doesNotMatch(productSource, /shadow-sm/);
  assert.match(productSource, /bg-bloop-red px-4 font-bangla text-\[17px\] font-bold text-bloop-cream shadow-none/);
});

test("renders the delivery timeline in a rounded card with red icons and Anek Bangla labels", () => {
  assert.match(productSource, /rounded-\[20px\] bg-bloop-card px-3 py-4/);
  assert.match(productSource, /bg-bloop-card text-bloop-red/);
  assert.match(productSource, /className="h-5 w-5" weight="Filled"/);
  assert.match(productSource, /font-bloop-body text-\[11px\] font-medium/);
  assert.match(productSource, /font-bangla text-\[14px\] font-semibold leading-5/);
  assert.match(productSource, /অর্ডার গ্রহণ/);
  assert.match(productSource, /প্রসেসিং/);
  assert.match(productSource, /ডেলিভারি/);
  assert.match(productSource, /deliveryTimeline\.map\(\(item\) =>/);
  assert.doesNotMatch(productSource, /KaiumSimanto/);
});

test("renders product detail sections as Bloop accordion rows instead of tabs", () => {
  assert.match(productSource, /const \[openSection, setOpenSection\] = useState<number \| null>\(0\)/);
  assert.match(productSource, /detailSections\.map\(\(item, i\) =>/);
  assert.match(productSource, /aria-expanded=\{open\}/);
  assert.match(productSource, /aria-controls=\{`product-detail-panel-\$\{i\}`\}/);
  assert.match(productSource, /onClick=\{\(\) => setOpenSection\(open \? null : i\)\}/);
  assert.match(productSource, /border-t border-bloop-ink\/15/);
  assert.match(productSource, /font-bangla text-\[17px\] font-semibold/);
  assert.match(productSource, /<Minus className="h-5 w-5 shrink-0"[\s\S]*?<Plus className="h-5 w-5 shrink-0"/);
  assert.match(productSource, /duration: shouldReduceMotion \? 0 : 0\.3/);
  assert.doesNotMatch(productSource, /role="tablist"/);
  assert.doesNotMatch(productSource, /IhtishamDeshlipi/);
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
  assert.match(productSource, /price: checkoutSubtotal/);
  assert.match(productSource, /selectedBundle\.title,\s*quantity/);
});

test("shows size before quantity, then the COD and cart buttons (Bloop order)", () => {
  const sizeIndex = productSource.indexOf("Size — {selectedBundle.title}");
  const quantityIndex = productSource.indexOf('aria-label="Decrease quantity"');
  const codIndex = productSource.indexOf("ক্যাশ অন ডেলিভারিতে অর্ডার করুন\n");
  const cartIndex = productSource.indexOf("Add to cart\n");

  assert.notEqual(sizeIndex, -1);
  assert.notEqual(quantityIndex, -1);
  assert.notEqual(codIndex, -1);
  assert.notEqual(cartIndex, -1);
  assert.ok(sizeIndex < quantityIndex);
  assert.ok(quantityIndex < codIndex);
  assert.ok(codIndex < cartIndex);
});

test("renders size options as pills and a pill quantity stepper", () => {
  assert.match(productSource, /const showSizeOptions = !\(bundles\.length === 1 && selectedBundle\.title === "Default"\)/);
  assert.match(productSource, /onClick=\{\(\) => setSelectedBundleIdx\(idx\)\}/);
  assert.match(productSource, /rounded-full border-2 px-4 font-bloop text-\[12px\] font-bold uppercase/);
  assert.match(productSource, /selected \? "border-bloop-ink" : "border-transparent hover:border-bloop-ink\/30"/);
  assert.match(productSource, /hasPriceOptions \? \(\s*<span[^>]*>\{bundle\.price\}<\/span>/);
  assert.match(productSource, /inline-flex h-11 w-32 items-center justify-between rounded-full border-2 border-bloop-ink/);
  assert.doesNotMatch(productSource, /quantityControlWidth/);
});

test("drops the yellow hand-drawn scribbles and grey page backgrounds", () => {
  assert.doesNotMatch(productSource, /stroke="#FBBB14"/);
  assert.doesNotMatch(productSource, /#f6f6f6/);
  assert.doesNotMatch(productSource, /bg-brand-ivory/);
  assert.match(productSource, /min-h-screen overflow-x-clip bg-bloop-cream/);
});

test("uses aligned Bengali numbering in the normal detail-list font", () => {
  assert.match(productSource, /const BENGALI_DIGITS = \[/);
  assert.match(productSource, /function toBengaliNumeral\(value: number\)/);
  assert.match(productSource, /toBengaliNumeral\(detailIndex \+ 1\)/);
  assert.match(productSource, /grid-cols-\[1\.5rem_minmax\(0,1fr\)\]/);
  assert.match(productSource, /items-start/);
  assert.match(productSource, /fontFamily: "inherit"/);
  assert.match(productSource, /tabular-nums text-bloop-red/);
  assert.doesNotMatch(productSource, /rotate-45/);
  assert.doesNotMatch(productSource, /rounded-full bg-brand-gold/);
});

test("left-aligns the open accordion panel content", () => {
  assert.match(productSource, /<div className="space-y-2 pb-6 text-left">/);
  assert.match(productSource, /<ul className="max-w-\[720px\] space-y-1 pt-1 text-left">/);
  assert.match(productSource, /className="grid w-full max-w-full grid-cols-\[1\.5rem_minmax\(0,1fr\)\]/);
  assert.doesNotMatch(productSource, /space-y-1\.5 text-center/);
});

test("renders product reels as a smooth horizontal snap carousel", () => {
  assert.match(productSource, /const \[reelRef, reelApi\] = useEmblaCarousel/);
  assert.match(productSource, /ref=\{reelRef\}/);
  assert.match(productSource, /align: "center"/);
  assert.match(productSource, /loop: true/);
  assert.match(productSource, /duration: 35/);
  assert.match(productSource, /breakpoints: \{ "\(min-width: 768px\)": \{ active: false \} \}/);
  assert.match(productSource, /-mx-4[^"`]*md:mx-0/);
  assert.match(productSource, /gap-0 px-0 md:gap-6/);
  assert.match(productSource, /mr-3[^"`]*md:mr-0/);
  assert.match(productSource, /max-w-none md:max-w-\[1100px\]/);
  assert.match(productSource, /basis-\[60vw\][^"`]*md:basis-\[calc\(\(100%_-_3rem\)_\/_3\)\]/);
  assert.match(productSource, /<\/div>\s*\{\/\* Reels Section — smooth horizontal carousel \*\/\}/);
  assert.match(productSource, /onClick=\{\(\) => selectReel\(i\)\}/);
  assert.match(productSource, /const canSwipeReels = reelApi && !window\.matchMedia\("\(min-width: 768px\)"\)\.matches/);
  assert.match(productSource, /GLASS_WATER_BOTTLE_REEL_MEDIA/);
  assert.match(productSource, /stream\.mux\.com/);
  assert.match(productSource, /<MuxVideo/);
  assert.match(productSource, /controls\s*$/m);
  // Only the active slide mounts a <video>, so a mobile drag moves one cheap layer
  // instead of three decoding video layers.
  assert.match(productSource, /i === currentReel/);
  assert.match(productSource, /preload="metadata"/);
  assert.doesNotMatch(productSource, /autoPlay=/);
  assert.match(productSource, /image\.mux\.com/);
  assert.match(productSource, /Play className/);
  assert.match(productSource, /activeReelVideoRef/);
  assert.match(productSource, /src=\{poster\}[\s\S]*?pointer-events-none/);
  assert.match(productSource, /loading="lazy"/);
  assert.doesNotMatch(productSource, /video\.load\(\)/);
  assert.match(productSource, /will-change-transform/);
  assert.match(productSource, /h5q3b3EKEzQgPUQ002xPb2jmVORrBlvIlbMDejxOSJeY/);
  assert.match(productSource, /cwW02TU2uP1XRUsB02GmCW1YL01PTdR56302suoUJR2kTJQ/);
  assert.doesNotMatch(productSource, /snap-center/);
  assert.match(productSource, /\[touch-action:pan-y_pinch-zoom\]/);
  assert.doesNotMatch(productSource, /scale-\[0\.94\]/);
  assert.match(productSource, /reelApi\.scrollPrev\(\)/);
  assert.match(productSource, /reelApi\.scrollNext\(\)/);
  assert.match(productSource, /reelApi\.on\("pointerDown", pauseReelsDuringDrag\)/);
  assert.doesNotMatch(productSource, /wistia-player/);
});

test("uses shared Mux reels on every product", () => {
  assert.match(productSource, /const GLASS_WATER_BOTTLE_MUX_PLAYBACK_IDS = \[/);
  assert.match(productSource, /const isGlassWaterBottleMuxProduct = true/);
  assert.match(productSource, /const reelMedia = GLASS_WATER_BOTTLE_REEL_MEDIA/);
  assert.doesNotMatch(productSource, /HONEY_NUT_REEL_MEDIA/);
  assert.doesNotMatch(productSource, /const REEL_MEDIA = \[/);
  assert.doesNotMatch(productSource, /slug === "honey-nut"/);
  assert.doesNotMatch(productSource, /slug === "glass-water-bottles-with-time-marker"/);
  assert.match(productSource, /reelMedia\.map\(\(\{ src, poster \}, i\) =>/);
  assert.match(productSource, /className="relative aspect-\[9\/16\] w-full overflow-hidden rounded-\[20px\] bg-black"/);
  assert.match(productSource, /className="h-full w-full rounded-\[6px\] object-contain bg-black"|className="h-full w-full object-contain bg-black"/);
});

test("uses Mux-hosted reels on every product", () => {
  assert.match(productSource, /import \{ PlayButton \} from "@videojs\/react";/);
  assert.match(productSource, /import \{ MuxVideo \} from "@videojs\/react\/media\/mux-video";/);
  assert.match(productSource, /const GLASS_WATER_BOTTLE_MUX_PLAYBACK_IDS = \[/);
  assert.match(productSource, /https:\/\/stream\.mux\.com\/\$\{playbackId\}\.m3u8/);
  assert.match(productSource, /https:\/\/image\.mux\.com\/\$\{playbackId\}\/thumbnail\.jpg/);
  assert.match(
    productSource,
    /const isGlassWaterBottleMuxProduct = true/,
  );
  assert.match(productSource, /import "@videojs\/react\/video\/skin\.css";/);
  assert.match(productSource, /import \{ VideoPlayer, VideoSkin \} from "@videojs\/react\/video";/);
  assert.match(productSource, /<VideoPlayer poster=\{poster\} title=\{`Angonaloy reel \$\{i \+ 1\}`\}>/);
  assert.match(productSource, /<VideoSkin className="absolute inset-0 h-full w-full \[--media-border-radius:0px\]">\s*<MuxVideo/);
  assert.match(productSource, /<PlayButton\s+className="absolute left-1\/2 top-1\/2/);
  assert.match(productSource, /render=\{\(props, state\) =>/);
  assert.match(productSource, /state\.paused\s*\?\s*\(\s*<Play className/);
  assert.match(productSource, /\) : \(\s*<Pause className/);
  const muxPlayButton = productSource.match(/<PlayButton[\s\S]*?\/>/)?.[0] ?? "";
  assert.doesNotMatch(muxPlayButton, /onPointerDown/);
  const muxVideo = productSource.match(/<MuxVideo[\s\S]*?\/>/)?.[0] ?? "";
  assert.doesNotMatch(muxVideo, /onPlay|onPlaying|onPause|onEnded/);
  // Every other product, including Honey Nut, still renders the original
  // poster + tap-to-play + plain <video> combo, untouched.
  assert.match(productSource, /\) : \(\s*<>\s*\{i === currentReel \? \(\s*<video/);
  assert.match(productSource, /grid grid-cols-1 gap-2\.5/);
  assert.match(productSource, /নিচের \{toBengaliNumeral\(glassBottleOffers\.length\)\}টি অপশন থেকে ১টি সিলেক্ট করুন/);
  assert.match(productSource, /onClick=\{\(\) => setQuantity\(offer\.quantity\)\}/);
  assert.match(productSource, /rounded-\[20px\] border-2 px-4 py-3\.5/);
  assert.match(productSource, /"border-bloop-red bg-bloop-cream"/);
  assert.match(productSource, /h-5 w-5 shrink-0 items-center justify-center rounded-full border-2/);
  assert.match(productSource, /h-2\.5 w-2\.5 rounded-full bg-bloop-red/);
  assert.match(productSource, /font-bangla text-\[14px\] font-semibold leading-snug/);
  assert.match(productSource, /font-bloop text-\[16px\] font-bold tracking-tight/);
  assert.match(productSource, /Tk \{Number\(offer\.total_price\)\.toLocaleString/);
  assert.match(productSource, /minimumFractionDigits: 2, maximumFractionDigits: 2/);
});

test("navigates reels with arrow keys without hijacking editable controls", () => {
  assert.match(productSource, /const target = e\.target as HTMLElement \| null/);
  assert.match(productSource, /target instanceof HTMLInputElement[\s\S]*?target instanceof HTMLTextAreaElement[\s\S]*?target instanceof HTMLSelectElement[\s\S]*?target\?\.isContentEditable/);
  assert.match(productSource, /e\.preventDefault\(\);\s*goReel\(-1\)/);
  assert.match(productSource, /e\.preventDefault\(\);\s*goReel\(1\)/);
});

test("keeps previous and next reel buttons visible on mobile as thin Bloop arrows", () => {
  assert.match(productSource, /aria-label="Previous reel"\s*onClick=\{\(\) => goReel\(-1\)\}/);
  assert.match(productSource, /aria-label="Next reel"\s*onClick=\{\(\) => goReel\(1\)\}/);
  assert.match(productSource, /<MoveLeft className="h-6 w-10" strokeWidth=\{1\.25\}/);
  assert.match(productSource, /<MoveRight className="h-6 w-10" strokeWidth=\{1\.25\}/);
  assert.match(productSource, /flex items-center justify-center gap-5 pb-2 pt-5/);
  assert.doesNotMatch(productSource, /hidden[^"]*aria-label="(Previous|Next) reel"/);
});

test("uses the poster while the active native video is loading", () => {
  assert.match(productSource, /preload="metadata"/);
  assert.match(productSource, /poster=\{poster\}/);
  assert.doesNotMatch(productSource, /loadedHoneyNutReel/);
});

test("puts reel radius on media and provides a centered play-pause toggle", () => {
  assert.match(productSource, /const \[playingReel, setPlayingReel\] = useState<number \| null>\(null\)/);
  assert.match(productSource, /aria-label=\{playingReel === i \? `Pause reel \$\{i \+ 1\}` : `Play reel \$\{i \+ 1\}`\}/);
  assert.match(productSource, /video\.paused[\s\S]*?video\.pause\(\)/);
  assert.match(productSource, /<Pause className/);
  assert.match(productSource, /<Play className/);
  assert.match(productSource, /onPointerDown=\{\(event\) => event\.stopPropagation\(\)\}/);
});

test("COD is the primary red pill and Add to cart the outlined secondary, both gated by verifyOrderable", () => {
  assert.match(productSource, /const openOrderDialog = async \(\) => \{\s*if \(await verifyOrderable\(\)\) \{\s*setOrderOpen\(true\);/);
  assert.match(productSource, /onClick=\{openOrderDialog\}[\s\S]*?rounded-full bg-bloop-red[\s\S]*?ক্যাশ অন ডেলিভারিতে অর্ডার করুন/);
  assert.match(productSource, /if \(!\(await verifyOrderable\(\)\)\) \{\s*return;\s*\}\s*addToCart\(/);
  assert.match(productSource, /analyticsItem: productAnalyticsItem,\s*productUuid: String\(product\.id \?\? ""\),\s*variantId: String\(selectedVariant\?\.id \?\? ""\),/);
  assert.match(productSource, /offerId: activeGlassBottleOffer\.id,\s*quantityStep: activeGlassBottleOffer\.quantity,/);
  assert.match(productSource, /rounded-full border-2 border-bloop-red bg-transparent[\s\S]*?Add to cart/);
  assert.match(productSource, /<OrderDialog open=\{orderOpen\} onOpenChange=\{setOrderOpen\} bundle=\{orderBundle\} \/>/);
});

test("shows a low-stock line only from live inventory numbers of ten or fewer", () => {
  assert.match(productSource, /const liveStockQuantity = merchantInventory\?\.inventory/);
  assert.match(productSource, /merchantInventory\.inventory\.variants\[String\(selectedVariant\.id\)\]\?\.stock_quantity/);
  assert.match(productSource, /liveStockQuantity > 0 && liveStockQuantity <= 10/);
  assert.match(productSource, /Only \{lowStockCount\} left in stock/);
});

test("shows a mobile sticky mini bar above the site bottom nav once the COD button scrolls away", () => {
  assert.match(productSource, /const primaryCtaRef = useRef<HTMLDivElement>\(null\)/);
  assert.match(productSource, /<div ref=\{primaryCtaRef\}>/);
  assert.match(productSource, /setShowMiniBar\(cta\.getBoundingClientRect\(\)\.bottom < 0\)/);
  assert.match(productSource, /window\.addEventListener\("scroll", syncMiniBar, \{ passive: true \}\)/);
  assert.match(productSource, /window\.removeEventListener\("scroll", syncMiniBar\)/);
  assert.match(productSource, /bottom-\[calc\(5\.25rem\+env\(safe-area-inset-bottom\)\)\] z-\[70\][^"]*md:hidden/);
  assert.match(productSource, /onClick=\{openOrderDialog\}[\s\S]*?<BagIcon className="h-6 w-6" \/>/);
  assert.match(productSource, /duration: shouldReduceMotion \? 0 : 0\.25/);
  assert.match(productSource, /createPortal\(\s*<AnimatePresence>[\s\S]*?product-mini-bar[\s\S]*?<\/AnimatePresence>,\s*document\.body,/);
});

test("adds Bloop breadcrumb, anchor links, gradient product-details title and a View all pill", () => {
  assert.match(productSource, /<nav aria-label="Breadcrumb"/);
  assert.match(productSource, /font-bloop text-\[32px\] font-bold[^"]*tracking-\[-0\.02em\] text-bloop-red md:text-\[40px\]/);
  assert.match(productSource, /href: "#product-description", label: "Description"/);
  assert.match(productSource, /id="product-description"/);
  assert.match(productSource, /id="product-details"/);
  assert.match(productSource, /id="product-reels"/);
  assert.match(productSource, /id="you-may-also-like"/);
  assert.match(productSource, /bloop-gradient-text[^"]*font-bloop text-\[clamp\(40px,8vw,88px\)\]/);
  assert.match(productSource, /You may also like\s*<\/h2>/);
  assert.match(productSource, /href="\/products"[\s\S]*?View all/);
});

test("section anchors smooth-scroll the window below the sticky header without a fragment navigation", () => {
  assert.match(productSource, /window\.matchMedia\("\(max-width: 767px\)"\)\.matches/);
  assert.match(productSource, /\[aria-label="Store announcements"\]/);
  assert.match(productSource, /onClick=\{\(event\) => scrollToSection\(event, link\.href\)\}/);
  assert.match(productSource, /const scrollToSection = \(event: ReactMouseEvent<HTMLAnchorElement>, href: string\) => \{[\s\S]*?event\.preventDefault\(\);/);
  assert.match(productSource, /section\.getBoundingClientRect\(\)\.top \+ window\.scrollY - getStickyHeaderOffset\(\)/);
  assert.match(productSource, /window\.scrollTo\(\{ top: Math\.max\(0, top\), left: 0, behavior: shouldReduceMotion \? "auto" : "smooth" \}\)/);
  assert.match(productSource, /window\.history\.replaceState\(window\.history\.state, "", href\)/);
  assert.match(productSource, /document\.querySelector<HTMLElement>\("nav\.sticky"\)/);
  assert.match(productSource, /aria-current=\{active \? "location" : undefined\}/);
  // One horizontally scrollable row on mobile instead of wrapping.
  assert.match(productSource, /aria-label="Product sections" className="no-scrollbar[^"]*overflow-x-auto whitespace-nowrap/);
  assert.doesNotMatch(productSource, /aria-label="Product sections" className="[^"]*flex-wrap/);
});

test("renders the product details block as a single text column with no images", () => {
  const detailsBlock = productSource.match(/<section id="product-description"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.notEqual(detailsBlock, "");
  assert.doesNotMatch(detailsBlock, /<img/);
  assert.match(detailsBlock, /max-w-\[70ch\]/);
  const detailSections = productSource.match(/<section id="product-details"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.doesNotMatch(detailSections, /<img/);
  assert.match(productSource, /<div className="mx-auto max-w-\[760px\]">\s*<nav aria-label="Product sections"/);
});

test("pairs the gallery and a sticky 420px buy box in one 1360px container", () => {
  assert.match(productSource, /mx-auto grid w-full max-w-\[1360px\][^"]*lg:grid-cols-\[minmax\(0,1fr\)_420px\] lg:gap-10 lg:px-10 xl:gap-16/);
  assert.match(productSource, /<div ref=\{buyBoxRef\} style=\{\{ top: buyBoxTop \}\} className="min-w-0 lg:sticky lg:self-start">/);
  assert.match(productSource, /setBuyBoxTop\(Math\.min\(getStickyHeaderOffset\(\), window\.innerHeight - box\.offsetHeight - 16\)\)/);
  assert.match(productSource, /rest\.length % 2 === 1 && idx === rest\.length - 1 \? "col-span-2" : ""/);
  assert.match(productSource, /className="mx-auto w-full max-w-\[1360px\] px-4 md:px-6 lg:px-10"/);
});

test("moves the short description below the delivery timeline on desktop only", () => {
  assert.match(productSource, /<div className="flex w-full flex-col">\s*<nav aria-label="Breadcrumb"/);
  assert.match(productSource, /line-clamp-5 font-bloop-body text-\[14px\] leading-\[1\.6\] text-bloop-ink\/80 lg:order-last lg:mt-6/);
  const titleIndex = productSource.indexOf("{product.name}\n              </h1>");
  const descriptionIndex = productSource.indexOf("lg:order-last lg:mt-6");
  const timelineIndex = productSource.indexOf("deliveryTimeline.map((item) =>");
  assert.ok(titleIndex !== -1 && titleIndex < descriptionIndex && descriptionIndex < timelineIndex);
});
