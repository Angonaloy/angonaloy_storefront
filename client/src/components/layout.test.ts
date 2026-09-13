import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const layoutSource = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

test("uses a compact announcement bar on mobile and restores desktop spacing", () => {
  assert.match(
    layoutSource,
    /min-h-\[34px\][^\n]*py-1\.5[^\n]*sm:min-h-\[42px\][^\n]*sm:py-2\.5/,
  );
});

test("hides the mobile navigation dock at the document bottom with Framer Motion", () => {
  assert.match(layoutSource, /useReducedMotion/);
  assert.match(layoutSource, /window\.innerHeight \+ window\.scrollY >= documentHeight - 24/);
  assert.match(layoutSource, /<motion\.nav/);
  assert.match(layoutSource, /animate=\{\{ y: isAtPageBottom \? "110%" : 0 \}\}/);
  assert.match(layoutSource, /className="fixed inset-x-3 bottom-3[^\"]*md:hidden"/);
});

test("uses the Solar cart icon in both desktop and mobile navigation", () => {
  assert.match(layoutSource, /viewBox="0 0 24 24"/);
  assert.match(layoutSource, /M16 9a1 1 0 1 1-2 0/);
  assert.equal((layoutSource.match(/<BagIcon /g) ?? []).length, 2);
});

test("keeps header cart icons balanced without changing the mobile dock", () => {
  assert.match(layoutSource, /\[&_svg\]:size-6/);
  assert.match(layoutSource, /<BagIcon className="!h-8 !w-8" \/>/);
  assert.match(layoutSource, /<SearchIcon className="opacity-70/);
});

test("uses the mobile menu white treatment for the shared search overlay", () => {
  assert.match(layoutSource, /className="fixed inset-0 z-\[100\][^"]*bg-black\/10/);
  assert.match(layoutSource, /className="relative h-auto max-h-\[70dvh\] w-full[^"]*rounded-\[12px\][^"]*bg-white[^"]*md:max-w-xl/);
});

test("keeps search typing aligned to the left", () => {
  assert.match(layoutSource, /<form onSubmit=\{submitSearch\} className="[^"]*justify-start/);
  assert.match(layoutSource, /className="min-w-0 flex-1 bg-transparent text-left/);
});

test("matches the mobile menu inset shell around dock search", () => {
  assert.match(layoutSource, /className="fixed inset-0 z-\[100\][^"]*p-3 sm:p-4/);
  assert.match(layoutSource, /className="relative h-auto max-h-\[70dvh\] w-full[^"]*rounded-\[12px\][^"]*bg-white/);
});

test("keeps the mobile dock search panel compact", () => {
  assert.match(layoutSource, /className="relative h-auto max-h-\[70dvh\] w-full[^"]*md:h-auto/);
});

test("reserves desktop width for the logo before category navigation", () => {
  assert.match(layoutSource, /md:flex-none md:basis-64/);
  assert.match(layoutSource, /<div className="md:hidden">/);
  assert.match(layoutSource, /hidden min-w-0 flex-1 items-center justify-start md:flex md:overflow-x-auto no-scrollbar/);
  assert.match(layoutSource, /flex w-max items-center justify-center gap-5/);
});

test("uses visible Featured Categories for menu navigation", () => {
  assert.match(layoutSource, /getVisibleFeaturedCollections/);
  assert.match(layoutSource, /getVisibleFeaturedCollections\(searchableProducts\)/);
  assert.match(layoutSource, /\/collection\/\$\{slug\}/);
  assert.match(layoutSource, /visibleCollections\.map/);
});

test("links Top Selling Products in desktop and mobile navigation", () => {
  const menuItemsStart = layoutSource.indexOf("const MENU_ITEMS = [");
  const menuItemsEnd = layoutSource.indexOf("] as const;", menuItemsStart);
  const mobileMenuStart = layoutSource.indexOf('<nav aria-label="Mobile menu"');
  const mobileMenuEnd = layoutSource.indexOf("</nav>", mobileMenuStart);

  assert.notEqual(menuItemsStart, -1);
  assert.notEqual(menuItemsEnd, -1);
  assert.notEqual(mobileMenuStart, -1);
  assert.notEqual(mobileMenuEnd, -1);

  const desktopMenuSource = layoutSource.slice(menuItemsStart, menuItemsEnd);
  const mobileMenuSource = layoutSource.slice(mobileMenuStart, mobileMenuEnd);
  assert.match(desktopMenuSource, /\/collection\/top-selling-products/);
  assert.match(desktopMenuSource, /Top Selling Products - সেরা বিক্রিত পণ্য/);
  assert.match(mobileMenuSource, /\/collection\/top-selling-products/);
  assert.match(mobileMenuSource, /Top Selling Products/);
  assert.match(mobileMenuSource, /সেরা বিক্রিত পণ্য/);
});

test("does not expose obsolete menu categories", () => {
  for (const label of ["Organic", "Spices", "Beverage", "Rice", "Flours & lentils"]) {
    assert.doesNotMatch(layoutSource, new RegExp(label.replace(/&/g, "\\&")));
  }
});

test("connects footer information and support links to real pages", () => {
  for (const path of [
    "/about-us",
    "/contact-us",
    "/how-to-order",
    "/shipping-policy",
    "/payment-policy",
    "/terms-and-conditions",
    "/privacy-policy",
    "/refund-return-exchange",
    "/cancellation-policy",
    "/faq",
    "/track-order",
  ]) {
    assert.match(layoutSource, new RegExp(path));
  }
  assert.doesNotMatch(layoutSource, /href="#"/);
});

test("uses Mango Lover WhatsApp in customer navigation and Arc Labs WhatsApp only for the developer credit", () => {
  const bottomBarIndex = layoutSource.indexOf("/* Bottom Bar */");
  assert.notEqual(bottomBarIndex, -1);
  const customerNavigationSource = layoutSource.slice(0, bottomBarIndex);

  assert.match(customerNavigationSource, /phone=8801301636461/);
  assert.doesNotMatch(customerNavigationSource, /phone=8801733670129/);
  assert.match(layoutSource.slice(bottomBarIndex), /phone=8801733670129/);
});
