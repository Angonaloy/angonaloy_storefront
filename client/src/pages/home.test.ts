import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const homeSource = readFileSync(new URL("./home.tsx", import.meta.url), "utf8");

const sectionBetween = (startMarker: string, endMarker: string) =>
  homeSource.slice(homeSource.indexOf(startMarker), homeSource.indexOf(endMarker));

test("orders the Bloop homepage sections from collection stories to recently viewed", () => {
  const order = [
    "{/* Collection Stories Section */}",
    "{/* Hero Section */}",
    "{/* Image mosaic */}",
    "{/* Best Sellers Section */}",
    "{/* Highlights Section */}",
    "{/* Latest Drop Section */}",
    "{/* Shop By Category Section */}",
    'renderCategorySection("homemade")',
    'renderCategorySection("functional-food")',
    'renderCategorySection("honey")',
    "{/* Editorial Section */}",
    'renderCategorySection("oil-and-ghee")',
    'renderCategorySection("jaggery")',
    "{/* Essentials Section */}",
    'renderCategorySection("semai")',
    'renderCategorySection("nuts-and-seeds")',
    "<RecentlyViewed products={homepageProducts} />",
  ];

  let previous = -1;
  for (const marker of order) {
    const index = homeSource.indexOf(marker, previous + 1);
    assert.ok(index > previous, `${marker} should follow the previous homepage section`);
    previous = index;
  }

  assert.doesNotMatch(homeSource, /Just Arrived Section/);
  assert.doesNotMatch(homeSource, /Special Collections Section/);
});

test("renders the Bloop headline as the page h1 with gradient grotesk and serif lines", () => {
  const heroSource = sectionBetween("{/* Hero Section */}", "{/* Image mosaic */}");

  assert.equal((homeSource.match(/<h1/g) ?? []).length, 1);
  assert.match(heroSource, /className="mx-auto flex max-w-\[1200px\] flex-col items-center px-1 text-center md:px-4"/);
  assert.match(heroSource, /<h1 className="w-full font-bloop [^"]*leading-\[0\.95\] tracking-\[-0\.04em\][^"]*"/);
  // Mobile lines are fitted to the viewport so their side gaps match the image mosaic's gutters.
  assert.match(heroSource, /text-\[length:calc\(\(100vw-12px\)\*0\.0798\)\][^"]*md:text-\[clamp\(2\.6rem,6\.2vw,5\.75rem\)\]/);
  assert.match(heroSource, /<span className="bloop-gradient-text block whitespace-nowrap md:inline md:whitespace-normal">Angonaloy—Made for Home<\/span>/);
  assert.match(heroSource, /whitespace-nowrap font-bloop-serif text-\[length:calc\(\(100vw-12px\)\*0\.1162\)\][^"]*text-bloop-red[^"]*md:text-\[length:1em\]">\s*and Everyday Living/);
  assert.match(heroSource, /font-bangla[^>]*>\s*আপনার ঘর ও জীবনযাত্রার জন্য একটি সম্পূর্ণ সমাধান/);
  assert.match(heroSource, /href="\/products"[\s\S]*bloop-pill[^"]*border-bloop-red[\s\S]*Explore/);
});

test("builds the rounded image mosaic from existing brand assets and hrefs", () => {
  const mosaicSource = sectionBetween("{/* Image mosaic */}", "{/* Best Sellers Section */}");

  assert.match(mosaicSource, /grid grid-cols-2 gap-1 px-1 [^"]*md:grid-cols-4 md:grid-rows-2/);
  assert.equal((mosaicSource.match(/rounded-\[28px\]/g) ?? []).length, 4);
  assert.match(mosaicSource, /src="\/hero-desktop\.webp\?v=2"/);
  assert.match(mosaicSource, /Everything for your kitchen/);
  assert.match(mosaicSource, /bg-bloop-lime[^"]*"[\s\S]*Shop the collection/);
  assert.match(mosaicSource, /pure-ghee-editorial-mobile-20260917\.webp/);
  assert.match(mosaicSource, /glass-bottle-editorial-mobile-20260917\.webp/);
  assert.match(mosaicSource, /href="\/product\/glass-water-bottles-with-time-marker"/);
  assert.match(mosaicSource, /href="\/collection\/top-selling-products"[\s\S]*bg-bloop-lime[\s\S]*Best[\s\S]*Sellers/);
  assert.match(mosaicSource, /object-cover/);
  assert.doesNotMatch(homeSource, /hero1\.webp/);
});

test("replaces the category bubbles with live-catalog collection story rings", () => {
  const storiesSource = sectionBetween("{/* Collection Stories Section */}", "{/* Hero Section */}");

  assert.match(homeSource, /import CollectionStories from "@\/components\/collection-stories";/);
  assert.match(storiesSource, /<CollectionStories collections=\{visibleFeaturedCollections\} products=\{homepageProducts\} \/>/);
  assert.doesNotMatch(homeSource, /Category Bubbles Section/);
  assert.doesNotMatch(homeSource, /border-\[3px\] border-bloop-orange/);
  assert.doesNotMatch(homeSource, /react-insta-stories/);
  assert.doesNotMatch(homeSource, /image: "\/categories\//);
  assert.doesNotMatch(homeSource, /const categories = \[/);
});

test("renders Best Sellers with an eyebrow, gradient heading and eight top sellers", () => {
  const bestSellersSource = sectionBetween("{/* Best Sellers Section */}", "{/* Highlights Section */}");

  assert.match(bestSellersSource, /eyebrow="Popular choice"/);
  assert.match(bestSellersSource, /title="Best Sellers"/);
  assert.match(bestSellersSource, /bangla="সবচেয়ে জনপ্রিয় পণ্য"/);
  assert.match(bestSellersSource, /href="\/collection\/top-selling-products"/);
  assert.match(bestSellersSource, /renderProductGrid\(topSellingProducts\.slice\(0, 8\), 8\)/);
  assert.match(bestSellersSource, /grid grid-cols-2 [^"]*lg:grid-cols-4/);
});

test("uses only existing site claims in the highlights band and a reduced-motion-safe marquee", () => {
  const highlightsSource = sectionBetween("{/* Highlights Section */}", "{/* Latest Drop Section */}");
  const cssSource = readFileSync(new URL("../index.css", import.meta.url), "utf8");

  assert.match(highlightsSource, /bg-\[linear-gradient\(90deg,#6CF7B2,#C9F77A,#FFF35C\)\]/);
  assert.match(highlightsSource, /Why Angonaloy/);
  assert.match(homeSource, /Free shipping over ৳2600/);
  assert.match(homeSource, /ক্যাশ অন ডেলিভারি/);
  assert.match(homeSource, /মান নিশ্চিত/);
  assert.match(highlightsSource, /WHY_ANGONALOY_BENEFITS\.map/);
  assert.match(highlightsSource, /className="bloop-marquee"/);
  assert.match(highlightsSource, /aria-hidden="true"/);
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\) \{\s*\.bloop-marquee \{\s*animation-play-state: paused;/);
});

test("lets mobile shoppers swipe the Why Angonaloy benefits while desktop keeps its grid", () => {
  const highlightsSource = sectionBetween("{/* Highlights Section */}", "{/* Latest Drop Section */}");

  assert.match(highlightsSource, /aria-label="Why Angonaloy benefits"[\s\S]*?tabIndex=\{0\}/);
  assert.match(highlightsSource, /no-scrollbar[^\"]*snap-x snap-mandatory[^\"]*overflow-x-auto[^\"]*motion-safe:scroll-smooth[^\"]*md:grid md:grid-cols-3[^\"]*md:overflow-visible/);
  assert.match(highlightsSource, /key=\{title\}[^>]*className="w-full shrink-0 snap-start flex flex-col items-center md:min-w-0"/);
  assert.match(highlightsSource, /ref=\{benefitRailRef\}[^>]*onScroll=\{updateActiveBenefit\}/);
  assert.match(highlightsSource, /md:hidden[\s\S]*?aria-label=\{`Go to benefit \$\{index \+ 1\}`\}[\s\S]*?aria-current=\{activeBenefit === index \? "true" : undefined\}/);
  assert.match(highlightsSource, /h-\[2px\] w-full transition-colors duration-300[\s\S]*?activeBenefit === index \? "bg-bloop-purple" : "bg-bloop-purple\/15"/);
  assert.match(homeSource, /const goToBenefit = \(index: number\) => \{[\s\S]*?rail\.scrollTo\(\{ left: index \* rail\.clientWidth \}\)/);
});

test("renders New Arrivals from the newest catalog products", () => {
  const latestDropSource = sectionBetween("{/* Latest Drop Section */}", "{/* Shop By Category Section */}");

  assert.match(latestDropSource, /title="New Arrivals"/);
  assert.match(latestDropSource, /আমাদের নতুন পণ্য/);
  assert.match(latestDropSource, /See more/);
  assert.match(latestDropSource, /renderProductGrid\(homepageProducts\.slice\(0, 4\), 4\)/);
  assert.match(latestDropSource, /grid grid-cols-2 gap-x-2 gap-y-6 md:gap-x-4 md:gap-y-10 lg:grid-cols-4/);
});

test("lists visible collections as large stacked links", () => {
  const listSource = sectionBetween("{/* Shop By Category Section */}", "{/* Category Section: Homemade */}");

  assert.match(listSource, /Shop by category/);
  assert.match(listSource, /visibleFeaturedCollections\.map\(\(collection\) =>/);
  assert.match(listSource, /href=\{`\/collection\/\$\{collection\.slug\}`\}/);
  assert.match(listSource, /font-bloop text-\[clamp\(2rem,6\.4vw,5rem\)\][^"]*text-bloop-red/);
  assert.match(listSource, /border-b border-bloop-red\/20/);
  assert.match(listSource, /View all/);
});

test("renders category sections with the shared heading and four products", () => {
  const categorySource = sectionBetween("const renderCategorySection", "  return (\n    <Layout>");

  assert.match(categorySource, /getProductsForCollection\(homepageProducts, collection\)/);
  assert.match(categorySource, /collection\.label\.split\("-"\)/);
  assert.match(categorySource, /<SectionHeader/);
  assert.match(categorySource, /href=\{`\/collection\/\$\{collection\.slug\}`\}/);
  assert.match(categorySource, /cta="View all"/);
  assert.match(categorySource, /renderProductGrid\(products\.slice\(0, 4\), Math\.min\(products\.length \|\| 4, 4\)\)/);
});

test("renders the purple and lime editorial blocks with existing images and links", () => {
  const editorialSource = sectionBetween("{/* Editorial Section */}", "{/* Category Section: Oil & Ghee */}");
  const essentialsSource = sectionBetween("{/* Essentials Section */}", "{/* Category Section: Semai */}");

  assert.match(editorialSource, /bg-bloop-purple/);
  assert.match(editorialSource, /href="\/products"/);
  assert.match(editorialSource, /<picture>/);
  assert.match(editorialSource, /pure-ghee-editorial-mobile-20260917\.webp/);
  assert.match(editorialSource, /pure-ghee-editorial-desktop-20260917\.webp/);
  assert.match(editorialSource, /rounded-\[28px\]/);
  assert.match(editorialSource, /For the Heart of Home/);
  assert.match(editorialSource, /ঘর ও রান্নাঘরের প্রতিদিনের জন্য বেছে নেওয়া সুন্দর, দরকারি জিনিস।/);
  assert.match(editorialSource, /bloop-pill[^"]*bg-bloop-lime[\s\S]*Explore/);
  assert.doesNotMatch(editorialSource, /curated-edit-bg-mobile\.webp|curated-edit-bg\.webp/);

  assert.match(essentialsSource, /rounded-\[28px\] bg-bloop-lime/);
  assert.match(essentialsSource, /href="\/product\/glass-water-bottles-with-time-marker"/);
  assert.match(essentialsSource, /<picture>/);
  assert.match(essentialsSource, /glass-bottle-editorial-mobile-20260917\.webp/);
  assert.match(essentialsSource, /glass-bottle-editorial-desktop-20260917\.webp/);
  assert.match(essentialsSource, /Hydrate with Intention/);
  assert.match(essentialsSource, /A beautiful daily ritual for home, work, and everywhere in between\./);
  assert.match(essentialsSource, /Shop glass bottles/);
  assert.doesNotMatch(essentialsSource, /essentials-bg-mobile\.webp|essentials-bg\.webp|BLACK SEED/);
});

test("removes the old highlight, scribble and frosted CTA treatments", () => {
  assert.doesNotMatch(homeSource, /HighlightedWord/);
  assert.doesNotMatch(homeSource, /M14,32 C9,15 48,6 72,8/);
  assert.doesNotMatch(homeSource, /HERO_CTA_CLASS_NAME/);
  assert.doesNotMatch(homeSource, /hero-frosted-cta/);
  assert.doesNotMatch(homeSource, /categoriesRef/);
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
  assert.match(homeSource, /topSellingProducts\.slice\(0, 8\)/);
  assert.match(homeSource, /homepageProducts\.slice\(0, 4\)/);
  assert.match(homeSource, /products\.slice\(0, 4\)/);
  assert.match(homeSource, /product\.compare_at_price == null && snapshotProduct\?\.compare_at_price != null/);
  assert.match(homeSource, /renderCategorySection\("homemade"\)/);
  assert.match(homeSource, /renderCategorySection\("honey"\)/);
  assert.match(homeSource, /renderCategorySection\("oil-and-ghee"\)/);
  assert.match(homeSource, /renderCategorySection\("semai"\)/);
  assert.match(homeSource, /renderCategorySection\("nuts-and-seeds"\)/);
});

test("keeps loading skeletons and the catalog error state in every product grid", () => {
  const gridSource = sectionBetween("const renderProductGrid", "const renderCategorySection");

  assert.match(gridSource, /isCatalogLoading/);
  assert.match(gridSource, /aspect-\[4\/5\] animate-pulse rounded-\[20px\] bg-bloop-card motion-reduce:animate-none/);
  assert.match(gridSource, /isCatalogError && catalogProducts\.length === 0/);
  assert.match(gridSource, /Could not load products right now\./);
  assert.match(gridSource, /items\.map\(\(product\) => <HomeProductCard key=\{product\.id \|\| product\.slug\} product=\{product\} \/>\)/);
});

test("uses the generated catalog while the live catalog revalidates", () => {
  assert.match(homeSource, /generatedStorefrontProducts/);
  assert.match(homeSource, /initialData: generatedStorefrontProducts/);
  assert.match(homeSource, /initialDataUpdatedAt: 0/);
});

test("uses subtle fade-and-lift Framer animations on homepage sections", () => {
  assert.match(homeSource, /transform: "translateY\(12px\)", opacity: 0/);
  assert.match(homeSource, /transform: "translateY\(0\)", opacity: 1/);
  assert.doesNotMatch(homeSource, /filter: "blur/);
  assert.match(homeSource, /useReveal/);
  assert.match(homeSource, /animate=\{[^}]*InView \? "visible" : "hidden"\}/);
  assert.match(homeSource, /staggerChildren/);
});
