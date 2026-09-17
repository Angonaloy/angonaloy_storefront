import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const homeSource = readFileSync(new URL("./home.tsx", import.meta.url), "utf8");

test("renders category sections after Latest Drop", () => {
  const latestDropIndex = homeSource.indexOf("Latest Drop Section");
  const homemadeIndex = homeSource.indexOf('renderCategorySection("homemade")');

  assert.notEqual(latestDropIndex, -1);
  assert.notEqual(homemadeIndex, -1);
  assert.ok(homemadeIndex > latestDropIndex);
  assert.match(homeSource, /getProductsForCollection/);
  assert.match(homeSource, /collection\.label/);
});

test("renders the Top Selling Products section after the hero", () => {
  const heroIndex = homeSource.indexOf("Hero Section");
  const topSellingIndex = homeSource.indexOf("What's New Section");
  const latestDropIndex = homeSource.indexOf("Latest Drop Section");

  assert.notEqual(heroIndex, -1);
  assert.notEqual(topSellingIndex, -1);
  assert.notEqual(latestDropIndex, -1);
  assert.ok(topSellingIndex > heroIndex);
  assert.ok(topSellingIndex < latestDropIndex);
  assert.match(homeSource, /<span className="font-medium">সবচেয়ে<\/span>/);
  assert.match(homeSource, /জনপ্রিয় পণ্য/);
  assert.match(homeSource, /topSellingProducts\.slice\(0, 6\)\.map/);
});

test("styles the Featured Categories heading like the product page circled title", () => {
  assert.doesNotMatch(homeSource, /FEATURED CATEGORIES/);
  assert.match(homeSource, /<span className="font-medium">আমাদের<\/span>/);
  assert.match(homeSource, /ক্যাটাগরিসমূহ/);
  assert.match(homeSource, /IhtishamDeshlipi/);
  assert.match(homeSource, /M14,32 C9,15 48,6 72,8/);
  assert.match(homeSource, /h-\[220%\] w-\[145%\]/);
  assert.match(homeSource, /text-\[clamp\(1\.85rem,5\.2vw,2\.75rem\)\][^"]*md:text-\[clamp\(2rem,5\.5vw,3rem\)\]/);
  assert.doesNotMatch(homeSource, /HighlightedWord[^>]*>আমাদের ক্যাটাগরিসমূহ/);
});

test("removes the requested homepage sections while keeping the editorial features", () => {
  assert.doesNotMatch(homeSource, /Just Arrived Section/);
  assert.doesNotMatch(homeSource, /Special Collections Section/);
  assert.match(homeSource, /Editorial Section/);
  assert.match(homeSource, /Essentials Section/);
});

test("interleaves populated bilingual category sections with the editorial features", () => {
  const belowLatest = homeSource.slice(homeSource.indexOf("Latest Drop Section"));
  const order = [
    'renderCategorySection("homemade")',
    'renderCategorySection("functional-food")',
    'renderCategorySection("honey")',
    "Editorial Section",
    'renderCategorySection("oil-and-ghee")',
    'renderCategorySection("jaggery")',
    "Essentials Section",
    'renderCategorySection("semai")',
    'renderCategorySection("nuts-and-seeds")',
  ];

  let previous = -1;
  for (const marker of order) {
    const index = belowLatest.indexOf(marker);
    assert.ok(index > previous, `${marker} should follow the previous homepage section`);
    previous = index;
  }

  assert.match(homeSource, /getProductsForCollection/);
  assert.match(homeSource, /visibleFeaturedCollections/);
  assert.match(homeSource, /collection\.label/);
  assert.match(homeSource, /HomeProductCard/);
});

test("uses left-right category headers with underlined View All links and four products", () => {
  const categorySource = homeSource.slice(
    homeSource.indexOf("const renderCategorySection"),
    homeSource.indexOf("  useEffect(() => {\n    const el = categoriesRef.current"),
  );

  assert.match(categorySource, /className="mb-7 flex items-center justify-between gap-6/);
  assert.match(categorySource, /href=\{`\/collection\/\$\{collection\.slug\}`\}/);
  assert.match(categorySource, /View All/);
  assert.match(categorySource, /border-b-2 border-black/);
  assert.match(categorySource, /products\.slice\(0, 4\)\.map/);
  assert.match(categorySource, /collection\.label/);
 });

test("renders responsive linked editorial image sections without old copy", () => {
  const editorialSource = homeSource.slice(
    homeSource.indexOf("{/* Editorial Section */}"),
    homeSource.indexOf("{/* Category Section: Oil & Ghee */}"),
  );
  const essentialsSource = homeSource.slice(
    homeSource.indexOf("{/* Essentials Section */}"),
    homeSource.indexOf("{/* Category Section: Semai */}"),
  );

  assert.match(editorialSource, /href="\/products"/);
  assert.match(editorialSource, /pure-ghee-editorial-mobile-20260917\.webp/);
  assert.match(editorialSource, /pure-ghee-editorial-desktop-20260917\.webp/);
  assert.match(editorialSource, /<picture>/);
  assert.match(editorialSource, /rounded-full border border-white\/50 bg-white\/20[^\"]*shadow-lg backdrop-blur-md/);
  assert.match(editorialSource, /transition-colors hover:bg-white\/30/);
  assert.doesNotMatch(editorialSource, /group-hover:bg-white\/30/);
  assert.match(editorialSource, /FOR THE HEART OF HOME/);
  assert.match(editorialSource, /ঘর ও রান্নাঘরের প্রতিদিনের জন্য বেছে নেওয়া সুন্দর, দরকারি জিনিস।/);
  assert.match(editorialSource, /EXPLORE HOME &amp; KITCHEN/);
  assert.doesNotMatch(editorialSource, /curated-edit-bg-mobile\.webp|curated-edit-bg\.webp/);
  assert.doesNotMatch(editorialSource, /Shop Now|absolute inset-0 bg-black\/35|rounded-\[16px\] border border-white\/35 bg-black\/20/);
  assert.match(essentialsSource, /href="\/product\/glass-water-bottles-with-time-marker"/);
  assert.match(essentialsSource, /glass-bottle-editorial-mobile-20260917\.webp/);
  assert.match(essentialsSource, /glass-bottle-editorial-desktop-20260917\.webp/);
  assert.match(essentialsSource, /<picture>/);
  assert.match(essentialsSource, /HYDRATE WITH INTENTION/);
  assert.match(essentialsSource, /A beautiful daily ritual for home, work, and everywhere in between\./);
  assert.match(essentialsSource, /SHOP GLASS BOTTLES/);
  assert.match(essentialsSource, /backdrop-blur-md/);
  assert.doesNotMatch(essentialsSource, /essentials-bg-mobile\.webp|essentials-bg\.webp|BLACK SEED/);
});

test("links Featured Categories to their collection pages", () => {
  assert.match(homeSource, /getVisibleFeaturedCollections/);
  assert.match(homeSource, /visibleFeaturedCollections\.map/);
  assert.match(homeSource, /href=\{`\/collection\/\$\{slug\}`\}/);
  assert.doesNotMatch(homeSource, /const categories = \[/);
});

test("lays visible Featured Categories in one desktop row", () => {
  const categoriesSection = homeSource.slice(
    homeSource.indexOf("{/* Categories Section */}"),
    homeSource.indexOf("{/* What's New Section */}"),
  );

  assert.match(
    categoriesSection,
    /sm:grid-cols-4[\s\S]*lg:flex[\s\S]*lg:overflow-visible/,
  );
});

test("centers Featured Categories on desktop", () => {
  const categoriesSection = homeSource.slice(
    homeSource.indexOf("{/* Categories Section */}"),
    homeSource.indexOf("{/* What's New Section */}"),
  );

  assert.match(categoriesSection, /lg:flex lg:justify-center/);
});

test("uses larger 120px category imagery with matching mobile tap targets", () => {
  const categoriesSection = homeSource.slice(
    homeSource.indexOf("{/* Categories Section */}"),
    homeSource.indexOf("{/* What's New Section */}"),
  );

  assert.match(categoriesSection, /group flex w-\[120px\][\s\S]*sm:w-auto/);
  assert.match(categoriesSection, /aspect-square w-\[120px\][\s\S]*sm:w-\[112px\]/);
});

test("uses the shorter Functional Food title only in Featured Categories", () => {
  const categoriesSection = homeSource.slice(
    homeSource.indexOf("{/* Categories Section */}"),
    homeSource.indexOf("{/* What's New Section */}"),
  );

  assert.match(categoriesSection, /Functional-ফুড/);
  assert.doesNotMatch(categoriesSection, /Functional Food-ফুড/);
  assert.doesNotMatch(categoriesSection, /Functional Food-ফাংশনাল ফুড/);
  assert.match(categoriesSection, /alt=\{label\}/);
});

test("labels the product section Top Selling Products without a purchase CTA", () => {
  const whatsNewSource = homeSource.slice(
    homeSource.indexOf("What's New Section"),
    homeSource.indexOf("Latest Drop Section"),
  );

  assert.match(whatsNewSource, /<span className="font-medium">সবচেয়ে<\/span>/);
  assert.match(whatsNewSource, /জনপ্রিয় পণ্য/);
  assert.doesNotMatch(whatsNewSource, /BEST SELLERS/);
  assert.doesNotMatch(whatsNewSource, /এখনই কিনুন/);
  assert.doesNotMatch(whatsNewSource, /বাদাম ও বীজ[\s\S]*তেল ও ঘি[\s\S]*মধু/);
});

test("styles the Top Selling Products heading as a modern food feature", () => {
  const whatsNewSource = homeSource.slice(
    homeSource.indexOf("What's New Section"),
    homeSource.indexOf("Latest Drop Section"),
  );

  assert.match(whatsNewSource, /className="mb-7 flex items-center justify-between/);
  assert.match(whatsNewSource, /<span className="font-medium">সবচেয়ে<\/span>/);
  assert.match(whatsNewSource, /জনপ্রিয় পণ্য/);
  assert.match(whatsNewSource, /IhtishamDeshlipi/);
  assert.match(whatsNewSource, /M14,32 C9,15 48,6 72,8/);
  assert.match(whatsNewSource, /text-\[clamp\(1\.75rem,4\.8vw,2\.6rem\)\][^"]*md:text-\[clamp\(1\.9rem,5\.2vw,2\.9rem\)\]/);
  assert.match(whatsNewSource, /View All/);
  assert.match(whatsNewSource, /border-b-2 border-black/);
  assert.doesNotMatch(whatsNewSource, /BEST SELLERS/);
  assert.doesNotMatch(whatsNewSource, /HighlightedWord[^>]*>সবচেয়ে জনপ্রিয় পণ্য/);
});

test("styles Latest Drop as a compact newly-added catalog section", () => {
  const latestDropSource = homeSource.slice(
    homeSource.indexOf("Latest Drop Section"),
    homeSource.indexOf("Category Section: Homemade"),
  );

  assert.match(latestDropSource, /<span className="font-medium">আমাদের<\/span>/);
  assert.match(latestDropSource, /নতুন পণ্য/);
  assert.doesNotMatch(latestDropSource, /NEWLY ADDED/);
  assert.match(latestDropSource, /See More/);
  assert.match(latestDropSource, /homepageProducts\.slice\(0, 4\)\.map/);
  assert.match(latestDropSource, /grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4/);
});

test("renders the Newly Added title in Bengali only with circled style", () => {
  const latestDropSource = homeSource.slice(
    homeSource.indexOf("Latest Drop Section"),
    homeSource.indexOf("Category Section: Homemade"),
  );

  assert.match(latestDropSource, /<span className="font-medium">আমাদের<\/span>/);
  assert.match(latestDropSource, /নতুন পণ্য/);
  assert.match(latestDropSource, /IhtishamDeshlipi/);
  assert.match(latestDropSource, /M14,32 C9,15 48,6 72,8/);
  assert.doesNotMatch(latestDropSource, /NEWLY ADDED/);
  assert.doesNotMatch(latestDropSource, /HighlightedWord[^>]*>আমাদের নতুন পণ্য/);
});

test("uses circled Bengali for section titles and highlight for category labels", () => {
  assert.match(homeSource, /<HighlightedWord className="font-display italic" highlightColor="#FBBB14">\{bengaliLabel\}<\/HighlightedWord>/);
  assert.doesNotMatch(homeSource, /HighlightedWord[^>]*>সবচেয়ে জনপ্রিয় পণ্য/);
  assert.doesNotMatch(homeSource, /HighlightedWord[^>]*>আমাদের নতুন পণ্য/);
  assert.doesNotMatch(homeSource, /HighlightedWord[^>]*>আমাদের ক্যাটাগরিসমূহ/);
});

test("uses a reduced type scale across homepage section headings", () => {
  const reducedHeadingScale = /text-\[clamp\(1\.35rem,3\.6vw,2\.15rem\)\][^"]*md:text-\[clamp\(1\.5rem,3\.9vw,2\.35rem\)\]/g;

  assert.equal((homeSource.match(reducedHeadingScale) ?? []).length, 1);
  assert.doesNotMatch(homeSource, /text-\[1\.65rem\]/);
  assert.doesNotMatch(homeSource, /text-\[clamp\(1\.65rem,4\.3vw,2\.6rem\)\]/);
  assert.doesNotMatch(homeSource, /text-\[clamp\(1\.75rem,4\.3vw,2\.6rem\)\]/);
});

test("loads every homepage product section from the public catalog", () => {
  assert.match(homeSource, /import \{ useQuery \} from "@tanstack\/react-query";/);
  assert.match(homeSource, /fetchStorefrontProducts,/);
  assert.match(homeSource, /STOREFRONT_POLL_INTERVAL_MS,/);
  assert.match(homeSource, /data: catalogProducts = \[\]/);
  assert.match(homeSource, /getTopSellingProducts\(homepageProducts\)/);
  assert.match(homeSource, /getProductsForCollection\(homepageProducts, collection\)/);
  assert.match(homeSource, /getVisibleFeaturedCollections\(catalogProducts\)/);
  assert.match(homeSource, /queryKey: \["merchant-suite-products-listing"\],/);
  assert.match(homeSource, /queryFn: fetchStorefrontProducts,/);
  assert.match(homeSource, /refetchInterval: STOREFRONT_POLL_INTERVAL_MS,/);
  assert.doesNotMatch(homeSource, /const whatsNewProducts = \[/);
  assert.doesNotMatch(homeSource, /const justArrivedProducts = \[/);
  assert.doesNotMatch(homeSource, /const specialProducts = \[/);
  assert.match(homeSource, /import HomeProductCard from "@\/components\/home-product-card"/);
  assert.match(homeSource, /topSellingProducts\.slice\(0, 6\)\.map/);
  assert.match(homeSource, /homepageProducts\.slice\(0, 4\)\.map/);
  assert.match(homeSource, /products\.slice\(0, 4\)\.map/);
  assert.match(homeSource, /product\.compare_at_price == null && snapshotProduct\?\.compare_at_price != null/);
  assert.match(homeSource, /renderCategorySection\("homemade"\)/);
  assert.match(homeSource, /renderCategorySection\("honey"\)/);
  assert.match(homeSource, /renderCategorySection\("oil-and-ghee"\)/);
  assert.match(homeSource, /renderCategorySection\("semai"\)/);
  assert.match(homeSource, /renderCategorySection\("nuts-and-seeds"\)/);
  assert.doesNotMatch(homeSource, /Just Arrived Section/);
  assert.doesNotMatch(homeSource, /Special Collections Section/);
});

test("uses the generated catalog while the live catalog revalidates", () => {
  assert.match(homeSource, /generatedStorefrontProducts/);
  assert.match(homeSource, /initialData: generatedStorefrontProducts/);
  assert.match(homeSource, /initialDataUpdatedAt: 0/);
});

test("prioritizes early live category images with lightweight thumbnails", () => {
  assert.match(homeSource, /visibleFeaturedCollections\.map\(\(\{ slug, label, image \}, index\) =>/);
  assert.match(homeSource, /src=\{image\}/);
  assert.match(homeSource, /loading=\{index < 4 \? "eager" : "lazy"\}/);
  assert.match(homeSource, /fetchPriority=\{index < 4 \? "high" : "auto"\}/);
  assert.doesNotMatch(homeSource, /image: "\/categories\//);
});

test("uses the Angonaloy hero poster", () => {
  assert.match(homeSource, /src="\/hero-mango-lover\.webp\?v=3"/);
  assert.match(homeSource, /src="\/hero-desktop\.webp\?v=2"/);
  assert.doesNotMatch(homeSource, /hero1\.webp/);
});

test("renders a shorter edge-to-edge Angonaloy hero on mobile", () => {
  assert.match(homeSource, /className="w-full bg-\[#f6f6f6\] pt-0 pb-0"/);
  assert.match(homeSource, /className="relative w-full px-0 pt-2 md:px-0 md:pt-0"/);
  assert.match(homeSource, /className="relative z-10 aspect-\[940\/900\] w-full overflow-hidden rounded-none bg-white md:aspect-video md:rounded-\[6px\] md:border md:border-black\/10"/);
  assert.match(homeSource, /className="h-full w-full object-cover object-top md:hidden"/);
  assert.match(homeSource, /className="hidden md:block h-full w-full object-cover object-top"/);
  assert.doesNotMatch(homeSource, /-bottom-2 (left|right)-2\.5 top-0 z-30 w-px/);
  assert.doesNotMatch(homeSource, /(left-\[2px\] right-\[2px\] top-2|bottom-0 left-\[2px\] right-\[2px\]) z-30 h-px/);
  assert.doesNotMatch(homeSource, /inset-x-0 top-4 z-30 h-px/);
  assert.match(homeSource, /Foggy gradient bottom blend/);
  assert.match(homeSource, /<h1/);
  assert.match(homeSource, /আঙ্গনালয়/);
  assert.match(homeSource, /আপনার ঘর ও জীবনযাত্রার জন্য একটি সম্পূর্ণ সমাধান/);
  assert.match(homeSource, /backdrop-blur-md/);
  assert.match(homeSource, /Shop Now - এখনই কিনুন/);
  assert.match(homeSource, /md:text-\[4\.5rem\]/);
  assert.match(homeSource, /md:pb-12/);
  assert.match(homeSource, /inset-x-0 bottom-0 z-20 flex flex-col items-center/);
  assert.doesNotMatch(homeSource, /SS26 STATEMENT PIECES/);
  assert.doesNotMatch(homeSource, /Bold by/);
  assert.doesNotMatch(homeSource, /Discover New Arrival/);
});

test("uses subtle fade-and-lift Framer animations on homepage sections", () => {
  assert.match(homeSource, /transform: "translateY\(12px\)", opacity: 0/);
  assert.match(homeSource, /transform: "translateY\(0\)", opacity: 1/);
  assert.doesNotMatch(homeSource, /filter: "blur/);
  assert.match(homeSource, /useReveal/);
  assert.match(homeSource, /animate=\{[^}]*InView \? "visible" : "hidden"\}/);
  assert.match(homeSource, /staggerChildren/);
});
