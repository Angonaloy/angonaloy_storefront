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

test("renders a What's New section after the hero", () => {
  const heroIndex = homeSource.indexOf("Hero Section");
  const whatsNewIndex = homeSource.indexOf("What's New Section");
  const latestDropIndex = homeSource.indexOf("Latest Drop Section");

  assert.notEqual(heroIndex, -1);
  assert.notEqual(whatsNewIndex, -1);
  assert.notEqual(latestDropIndex, -1);
  assert.ok(whatsNewIndex > heroIndex);
  assert.ok(whatsNewIndex < latestDropIndex);
  assert.match(homeSource, /WHAT'S NEW/);
});

test("uses only the highlighted Bengali Featured Categories heading", () => {
  assert.doesNotMatch(homeSource, /FEATURED CATEGORIES/);
  assert.match(homeSource, /আমাদের ক্যাটাগরিসমূহ/);
  assert.match(homeSource, /<HighlightedWord className="font-display italic text-\[1\.65rem\]/);
  assert.match(homeSource, /highlightColor="#FBBB14">আমাদের ক্যাটাগরিসমূহ/);
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

test("links editorial sections to their products and aligns their text at the bottom", () => {
  const editorialSource = homeSource.slice(
    homeSource.indexOf("{/* Editorial Section */}"),
    homeSource.indexOf("{/* Category Section: Oil & Ghee */}"),
  );
  const essentialsSource = homeSource.slice(
    homeSource.indexOf("{/* Essentials Section */}"),
    homeSource.indexOf("{/* Category Section: Semai */}"),
  );

  assert.match(editorialSource, /href="\/product\/pure-ghee"/);
  assert.match(editorialSource, /absolute inset-0 flex flex-col items-center justify-end/);
  assert.match(essentialsSource, /href="\/product\/kalojira-mixed"/);
  assert.match(essentialsSource, /absolute inset-0 flex flex-col items-center justify-end/);
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

  assert.match(whatsNewSource, /BEST SELLERS/);
  assert.doesNotMatch(whatsNewSource, /এখনই কিনুন/);
  assert.doesNotMatch(whatsNewSource, /বাদাম ও বীজ[\s\S]*তেল ও ঘি[\s\S]*মধু/);
});

test("styles the Top Selling Products heading as a modern food feature", () => {
  const whatsNewSource = homeSource.slice(
    homeSource.indexOf("What's New Section"),
    homeSource.indexOf("Latest Drop Section"),
  );

  assert.match(whatsNewSource, /className="mb-7 flex items-center justify-between/);
  assert.match(whatsNewSource, /BEST SELLERS/);
  assert.match(whatsNewSource, /সবচেয়ে জনপ্রিয়/);
  assert.match(whatsNewSource, /font-display italic[\s\S]*highlightColor="#FBBB14"/);
  assert.match(whatsNewSource, /className="block md:inline">BEST SELLERS<\/span>/);
  assert.match(whatsNewSource, /className="mt-1 block md:ml-1 md:mt-0 md:inline"/);
  assert.match(whatsNewSource, /text-\[clamp\(1\.35rem,3\.6vw,2\.15rem\)\]/);
  assert.match(whatsNewSource, /View All/);
  assert.match(whatsNewSource, /border-b-2 border-black/);
  assert.doesNotMatch(whatsNewSource, /<svg/);
});

test("styles Latest Drop header like the Just arrived header", () => {
  const latestDropContainer = /Latest Drop Section[\s\S]*?<motion\.div[^>]*className="mx-auto max-w-\[1500px\] px-4 md:px-8 xl:px-12"/.test(homeSource);
  const latestDropHeading = /className="text-\[clamp\(2rem,5vw,2\.6rem\)\] font-bold leading-none tracking-\[-0\.04em\] text-black"[\s\S]*?>\s*Latest\s*<span[\s\S]*?Drop/.test(homeSource);
  const discoverMoreLink = /className="mt-1\.5 shrink-0 border-b-2 border-black pb-1 text-\[11px\] font-medium uppercase tracking-\[0\.2em\] text-black transition-opacity hover:opacity-60 md:mt-2 md:text-base md:tracking-\[0\.24em\]"[\s\S]*?>\s*Discover More/.test(homeSource);

  assert.equal(latestDropContainer, true);
  assert.equal(latestDropHeading, true);
  assert.equal(discoverMoreLink, true);
});

test("renders the Newly Added bilingual title with Bengali highlight", () => {
  const latestDropSource = homeSource.slice(
    homeSource.indexOf("Latest Drop Section"),
    homeSource.indexOf("Category Section: Homemade"),
  );

  assert.match(latestDropSource, /className="block md:inline">NEWLY ADDED<\/span>/);
  assert.match(latestDropSource, /আমাদের নতুন পণ্য/);
  assert.match(latestDropSource, /font-display italic/);
  assert.match(latestDropSource, /highlightColor="#FBBB14"/);
  assert.match(latestDropSource, /className="mt-1 block md:ml-1 md:mt-0 md:inline"/);
});

test("styles Bengali homepage highlights with the italic display font", () => {
  assert.match(homeSource, /<HighlightedWord className="font-display italic" highlightColor="#FBBB14">\{bengaliLabel\}<\/HighlightedWord>/);
  assert.match(homeSource, /সবচেয়ে জনপ্রিয়/);
  assert.match(homeSource, /আমাদের নতুন পণ্য/);
});

test("uses a reduced type scale across homepage section headings", () => {
  const reducedHeadingScale = /text-\[clamp\(1\.35rem,3\.6vw,2\.15rem\)\][^"]*md:text-\[clamp\(1\.5rem,3\.9vw,2\.35rem\)\]/g;

  assert.equal((homeSource.match(reducedHeadingScale) ?? []).length, 6);
  assert.match(homeSource, /text-\[1\.65rem\] leading-none md:text-\[clamp\(1\.5rem,3\.9vw,2\.35rem\)\]/);
  assert.doesNotMatch(homeSource, /text-\[clamp\(1\.65rem,4\.3vw,2\.6rem\)\]/);
  assert.doesNotMatch(homeSource, /text-\[clamp\(1\.75rem,4\.3vw,2\.6rem\)\]/);
});

test("loads every homepage product section from the public catalog", () => {
  const whatsNewSource = homeSource.slice(
    homeSource.indexOf("What's New Section"),
    homeSource.indexOf("Latest Drop Section"),
  );
  const latestDropSource = homeSource.slice(
    homeSource.indexOf("Latest Drop Section"),
    homeSource.indexOf("Category Section: Homemade"),
  );
  const categorySource = homeSource.slice(
    homeSource.indexOf("Category Section: Homemade"),
    homeSource.indexOf("Editorial Section"),
  );

  assert.match(homeSource, /import \{ useQuery \} from "@tanstack\/react-query";/);
  assert.match(homeSource, /fetchStorefrontProducts,/);
  assert.match(homeSource, /formatProductPriceRange,/);
  assert.match(homeSource, /getProductImage,/);
  assert.match(homeSource, /STOREFRONT_POLL_INTERVAL_MS,/);
  assert.match(homeSource, /data: catalogProducts = \[\]/);
  assert.match(homeSource, /getTopSellingProducts\(homepageProducts\)/);
  assert.match(homeSource, /queryKey: \["merchant-suite-products-listing"\],/);
  assert.match(homeSource, /queryFn: fetchStorefrontProducts,/);
  assert.match(homeSource, /refetchInterval: STOREFRONT_POLL_INTERVAL_MS,/);
  assert.doesNotMatch(homeSource, /const whatsNewProducts = \[/);
  assert.doesNotMatch(homeSource, /const justArrivedProducts = \[/);
  assert.doesNotMatch(homeSource, /const specialProducts = \[/);
  assert.match(homeSource, /useCart/);
  assert.match(homeSource, /Add to Cart/);
  assert.match(whatsNewSource, /getProductNumericId\(product\)/);
  assert.match(whatsNewSource, /className="mt-auto w-full border border-black\/15 bg-\[#FBBB14\]/);
  assert.match(whatsNewSource, /const firstVariant = product\.variants\?\.\[0\]/);
  assert.match(whatsNewSource, /compare_at_price/);
  assert.match(whatsNewSource, /Save/);
  assert.match(whatsNewSource, /bg-\[#FBBB14\]\/35/);
  assert.match(whatsNewSource, /className="group flex min-w-0 flex-col"/);
  assert.match(whatsNewSource, /line-clamp-1/);
  assert.match(whatsNewSource, /className="mt-auto w-full border/);
  assert.match(whatsNewSource, /topSellingProducts\.slice\(0, 6\)\.map/);
  assert.match(homeSource, /product\.compare_at_price == null && snapshotProduct\?\.compare_at_price != null/);
   assert.match(categorySource, /renderCategorySection\("homemade"\)/);
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

test("prioritizes the first category images with lightweight thumbnails", () => {
  assert.match(homeSource, /image: "\/categories\/homemade-3-320\.webp"/);
  assert.match(homeSource, /loading=\{index < 4 \? "eager" : "lazy"\}/);
  assert.match(homeSource, /fetchPriority=\{index < 4 \? "high" : "auto"\}/);
});

test("uses the Mango Lover hero poster", () => {
  assert.match(homeSource, /src="\/hero-mango-lover\.webp"/);
  assert.doesNotMatch(homeSource, /hero1\.webp/);
});

test("renders a full-bleed editorial hero", () => {
  assert.match(homeSource, /className="w-full bg-\[#f6f6f6\] pt-0 pb-0"/);
  assert.match(homeSource, /className="w-full px-0"/);
  // Mobile crops ~8% of leaf off the top of the 940x1411 poster and leaves no
  // bare yellow band below it; desktop keeps the uncropped fixed-height hero.
  assert.match(homeSource, /className="relative aspect-\[940\/1298\] w-full overflow-hidden bg-\[#FBBB14\] md:aspect-auto md:min-h-\[760px\]"/);
  // Desktop contains the whole portrait poster so none of its baked-in Bangla
  // type is cropped. Mobile covers instead, anchored to the bottom so the only
  // thing the crop can eat is leaf at the top.
  assert.match(homeSource, /className="h-full w-full object-cover object-bottom md:object-contain md:object-center"/);
  assert.match(homeSource, /pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-end/);
  assert.match(homeSource, /pointer-events-auto inline-flex w-fit/);
  assert.match(homeSource, /md:px-7 md:py-3 md:text-base/);
  assert.match(homeSource, /DISCOVER MORE/);
  assert.doesNotMatch(homeSource, /SS26 STATEMENT PIECES/);
  assert.doesNotMatch(homeSource, /Bold by/);
  assert.doesNotMatch(homeSource, /Shop now/);
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
