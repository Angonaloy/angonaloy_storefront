import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const storiesSource = readFileSync(new URL("./collection-stories.tsx", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));

const sectionBetween = (startMarker: string, endMarker: string) =>
  storiesSource.slice(storiesSource.indexOf(startMarker), storiesSource.indexOf(endMarker));

test("depends on react-insta-stories and only imports it lazily", () => {
  assert.ok(packageJson.dependencies["react-insta-stories"], "react-insta-stories should be a runtime dependency");
  assert.match(storiesSource, /const ReactInstaStories = lazy\(\(\) => import\("react-insta-stories"\)\);/);
  assert.doesNotMatch(storiesSource, /^import (?!type )[^;]*from "react-insta-stories/m);
  assert.match(storiesSource, /<Suspense fallback=\{null\}>\s*<ReactInstaStories/);
});

test("builds story rings from the live catalog and skips empty collections", () => {
  const ringSource = sectionBetween("export default function CollectionStories", "<AnimatePresence onExitComplete");

  assert.match(ringSource, /getProductsForCollection\(products, collection\)/);
  assert.match(ringSource, /\.filter\(\(entry\) => entry\.products\.length > 0\)/);
  assert.match(ringSource, /aria-label=\{`Open \$\{name\} stories`\}/);
  assert.match(ringSource, /no-scrollbar flex gap-3 overflow-x-auto[^"]*md:justify-center/);
  assert.match(ringSource, /bg-\[linear-gradient\(45deg,#F08A3C,#DB2828\)\]/);
  assert.match(ringSource, /bg-bloop-ink\/15/);
  assert.match(ringSource, /rounded-full bg-bloop-cream p-\[3px\]/);
  assert.match(ringSource, /font-bloop text-\[12px\] font-bold[^"]*md:text-\[13px\]/);
  assert.match(ringSource, /loading=\{index < 4 \? "eager" : "lazy"\}/);
  assert.match(storiesSource, /slug === "functional-food" \? "Functional-ফুড" : label/);
  assert.doesNotMatch(storiesSource, /generatedStorefrontProducts|const products = \[/);
});

test("persists seen state per collection signature with guarded storage access", () => {
  assert.equal((storiesSource.match(/localStorage/g) ?? []).length, 2);
  assert.match(storiesSource, /try \{\s*const raw = window\.localStorage\.getItem\(SEEN_STORAGE_KEY\);[\s\S]*?\} catch \{\s*return \{\};/);
  assert.match(storiesSource, /try \{\s*window\.localStorage\.setItem\(SEEN_STORAGE_KEY, JSON\.stringify\(seen\)\);\s*\} catch \{/);
  assert.match(storiesSource, /signature: collectionProducts\.map\(\(product\) => String\(product\.id \?\? product\.slug\)\)\.join\(","\)/);
  assert.match(storiesSource, /const isUnseen = seenStories\[collection\.slug\] !== signature;/);
  assert.match(storiesSource, /useEffect\(\(\) => \{\s*if \(entry\) onCollectionShown\(entry\);/);
});

test("renders the viewer as a modal dialog portalled to document.body above the site chrome", () => {
  const viewerSource = sectionBetween("function CollectionStoriesViewer", "export default function CollectionStories");

  assert.match(viewerSource, /return createPortal\(\s*<motion\.div/);
  assert.match(viewerSource, /<\/motion\.div>,\s*document\.body,\s*\);/);
  assert.match(viewerSource, /role="dialog"\s+aria-modal="true"\s+aria-label=\{`\$\{entry\?\.name \?\? "Collection"\} stories`\}/);
  assert.match(viewerSource, /fixed inset-0 z-\[200\][^"]*bg-\[#111\][^"]*md:bg-black\/85/);
  assert.match(viewerSource, /md:aspect-\[9\/16\] md:h-\[min\(90vh,860px\)\][^"]*md:rounded-\[20px\]/);
  assert.match(viewerSource, /closeButtonRef\.current\?\.focus/);
  assert.match(viewerSource, /event\.key === "Tab"[\s\S]*?last\.focus\(\)[\s\S]*?first\.focus\(\)/);
  assert.match(storiesSource, /ringRefs\.current\.get\(slug\)\?\.focus/);
  assert.match(viewerSource, /h-11 w-11[^"]*rounded-\[12px\] bg-\[#333\] text-white/);
  assert.match(storiesSource, /M20\.707 4\.70697L19\.293 3\.29297L12 10\.586L4\.707 3\.29297/);
  assert.match(viewerSource, /aria-label="Previous collection"/);
  assert.match(viewerSource, /aria-label="Next collection"/);
});

test("locks body scroll while open and closes on route change without touching history", () => {
  assert.match(storiesSource, /useLayoutEffect\(\(\) => \{\s*if \(!isPresent\) return;\s*const previousOverflow = document\.body\.style\.overflow;\s*document\.body\.style\.overflow = "hidden";/);
  assert.match(storiesSource, /document\.body\.style\.overflow = previousOverflow;/);
  assert.match(storiesSource, /useEffect\(\(\) => \{\s*setOpenIndex\(null\);\s*\}, \[location\]\);/);
  assert.doesNotMatch(storiesSource, /pushState|replaceState|location\.hash|popstate/);
});

test("drives the library with Instagram-style tap, hold, swipe and keyboard controls", () => {
  assert.match(storiesSource, /const STORY_INTERVAL_MS = 5000;/);
  assert.match(storiesSource, /defaultInterval=\{STORY_INTERVAL_MS\}/);
  assert.match(storiesSource, /isPaused=\{isPaused\}/);
  assert.match(storiesSource, /currentIndex=\{slideTarget\}/);
  assert.match(storiesSource, /\n\s+preventDefault\n/);
  assert.match(storiesSource, /keyboardNavigation=\{false\}/);
  assert.match(storiesSource, /onStoryEnd=\{\(index: number\) => \{\s*if \(index >= lastIndex\) onCollectionEnd\(\);/);
  assert.match(storiesSource, /\(event\.target as Element\)\.closest\("a, button"\)/);
  assert.match(storiesSource, /event\.clientX - bounds\.left < bounds\.width \/ 3/);
  assert.match(storiesSource, /setIsHoldPaused\(true\)/);
  assert.match(storiesSource, /goToCollection\(dx < 0 \? 1 : -1\)/);
  assert.match(storiesSource, /dy > SWIPE_DOWN_DISTANCE_PX/);
  assert.match(storiesSource, /event\.key === "Escape"[\s\S]*?event\.key === "ArrowRight"[\s\S]*?event\.key === "ArrowLeft"/);
  assert.match(storiesSource, /if \(nextIndex >= storyCollections\.length\) \{\s*onClose\(\);/);
  assert.match(storiesSource, /const prefersReducedMotion = useReducedMotion\(\);/);
  assert.match(storiesSource, /drag=\{!prefersReducedMotion\}/);
  assert.match(storiesSource, /inert=\{!isPresent\}/);
  assert.match(storiesSource, /preloadImage\(getProductImage\(nextProduct\)\)/);
  assert.match(storiesSource, /preloadImage\(getProductImage\(nextCollection\.products\[0\]\)\)/);
});

test("renders each product slide with price, a wouter View product link and a collection link", () => {
  const slideSource = sectionBetween("function StorySlide", "function CollectionStoryPanel");

  assert.match(storiesSource, /import \{ Link, useLocation \} from "wouter";/);
  assert.doesNotMatch(storiesSource, /react-router|window\.location\.href\s*=|window\.open\(/);
  assert.match(slideSource, /const image = getProductImage\(product\);/);
  assert.match(slideSource, /object-contain/);
  assert.match(slideSource, /blur-3xl/);
  assert.match(slideSource, /bg-gradient-to-t from-black\/85/);
  assert.match(slideSource, /font-bloop text-\[22px\] font-bold[^"]*text-bloop-cream/);
  assert.match(slideSource, /<Link\s+href=\{`\/product\/\$\{product\.slug\}`\}\s+onClick=\{onNavigate\}\s+className="[^"]*h-14[^"]*rounded-full bg-bloop-red[^"]*"\s*>\s*View product/);
  assert.match(slideSource, /<Link\s+href=\{`\/collection\/\$\{collectionSlug\}`\}\s+onClick=\{onNavigate\}[\s\S]*?Shop collection/);
  assert.match(slideSource, /line-through/);
  assert.match(storiesSource, /`৳\$\{amount\.toLocaleString\("en-US"\)\}`/);
  assert.match(storiesSource, /compareAtPrice > currentPrice/);
  assert.match(storiesSource, /Number\(product\.variants\?\.\[0\]\?\.price \?\? product\.price\)/);
  assert.match(storiesSource, /onNavigate=\{onClose\}/);
});

test("falls back to the first assigned product image when a collection has no artwork", () => {
  assert.match(
    storiesSource,
    /function getStoryCollectionImage\(\{ collection, products \}: StoryCollection\) \{\s*return collection\.image \|\| \(products\[0\] \? getProductImage\(products\[0\]\) : ""\);/,
  );
  assert.match(storiesSource, /<img src=\{getStoryCollectionImage\(entry\)\} alt="" className="h-full w-full rounded-full object-cover" \/>/);
  assert.match(storiesSource, /src=\{getStoryCollectionImage\(entry\)\}\s*alt=""\s*loading=/);
  assert.doesNotMatch(storiesSource, /src=\{(entry\.)?collection\.image\}/);
});
