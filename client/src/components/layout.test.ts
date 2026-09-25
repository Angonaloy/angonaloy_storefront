import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const layoutSource = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

test("renders the Bloop-style rotating announcement bar", () => {
  assert.match(layoutSource, /<AnnouncementBar \/>/);
  assert.match(layoutSource, /h-10[^"]*bg-\[#F9D05E\][^"]*font-bloop[^"]*text-\[12px\] font-bold uppercase tracking-\[0\.015em\] text-\[#B40000\] sm:h-11[^"]*sm:text-\[13px\]/);
  assert.match(layoutSource, /aria-label="Store announcements"/);
  assert.match(layoutSource, /aria-label="Previous announcement"/);
  assert.match(layoutSource, /aria-label="Next announcement"/);
  assert.match(layoutSource, /aria-live="polite"/);
  assert.match(layoutSource, /ANNOUNCEMENT_INTERVAL_MS = 5000/);
  assert.match(layoutSource, /if \(shouldReduceMotion \|\| isPaused\) return;/);
  assert.match(layoutSource, /<AnimatePresence mode="wait" initial=\{false\}>/);
  assert.match(layoutSource, /over ৳2600/);
  assert.match(layoutSource, /<span className="font-bangla">দ্রুত ডেলিভারি<\/span> — Fast delivery/);
  assert.match(layoutSource, /<span className="font-bangla">ক্যাশ অন ডেলিভারি<\/span> — Cash on delivery/);
});

test("hides the mobile navigation dock at the document bottom with Framer Motion", () => {
  assert.match(layoutSource, /useReducedMotion/);
  assert.match(layoutSource, /window\.innerHeight \+ window\.scrollY >= documentHeight - 24/);
  assert.match(layoutSource, /<motion\.nav/);
  assert.match(layoutSource, /animate=\{\{ y: isAtPageBottom \? "calc\(100% \+ 24px\)" : 0 \}\}/);
  assert.match(layoutSource, /className="fixed inset-x-3 bottom-3[^\"]*md:hidden"/);
});

test("uses the Bloop bag icon in both desktop and mobile navigation", () => {
  const bagIconSource = readFileSync(new URL("./bag-icon.tsx", import.meta.url), "utf8");
  assert.match(layoutSource, /from "@\/components\/bag-icon"/);
  assert.match(bagIconSource, /viewBox="0 0 24 24"/);
  assert.match(bagIconSource, /M16 7V6C16 4\.93913/);
  assert.doesNotMatch(bagIconSource, /stroke/);
  assert.equal((layoutSource.match(/<BagIcon /g) ?? []).length, 2);
});

test("keeps header cart icons balanced", () => {
  assert.match(layoutSource, /<BagIcon className="h-6 w-6" \/>/);
  assert.match(layoutSource, /<HeaderSearchIcon className="h-6 w-6" \/>/);
  // The search popup submits through the same Bloop search glyph; the old outline icon is gone.
  assert.match(layoutSource, /<button type="submit" aria-label="Submit search"[^>]*>\s*<HeaderSearchIcon className="h-6 w-6" \/>/);
  assert.doesNotMatch(layoutSource, /<SearchIcon /);
});

test("styles the mobile dock as a Bloop cream pill with a raised red bag", () => {
  const dockStart = layoutSource.indexOf("{/* Mobile bottom navigation */}");
  const dockEnd = layoutSource.indexOf("</motion.nav>", dockStart);
  assert.notEqual(dockStart, -1);
  assert.notEqual(dockEnd, -1);
  const dockSource = layoutSource.slice(dockStart, dockEnd);

  // Opaque cream full pill: 64px tall, hairline ink border, one soft floating shadow, no glass.
  assert.match(dockSource, /className="fixed inset-x-3 bottom-3 z-\[80\] flex h-16[^"]*rounded-full border border-\[#333333\]\/10 bg-bloop-cream[^"]*shadow-\[0_8px_24px_rgba\(51,51,51,0\.12\)\] md:hidden"/);
  assert.doesNotMatch(dockSource, /backdrop-blur|bg-neutral-500|text-white|bg-\[#C8F45A\]/);

  // Side items: >=44px targets, matching 24px glyphs, 11px Bricolage bold labels that never wrap.
  assert.match(layoutSource, /const dockItemClass = "flex h-14 min-w-\[56px\][^"]*whitespace-nowrap font-bloop text-\[11px\] font-bold/);
  assert.equal((dockSource.match(/\$\{dockItemClass\}/g) ?? []).length, 4);
  assert.match(dockSource, /<DockHomeIcon className="h-6 w-6" \/>/);
  assert.match(dockSource, /<DockProductsIcon className="h-6 w-6" \/>/);
  assert.match(dockSource, /<HeaderSearchIcon className="h-6 w-6" \/>/);
  assert.match(dockSource, /<HeaderMenuIcon className="h-6 w-6" \/>/);
  assert.equal((dockSource.match(/text-\[#333333\]\/70/g) ?? []).length, 4);

  // Active route turns icon + label Bloop red; route detection and aria-current are unchanged.
  assert.match(dockSource, /aria-current=\{location === "\/" \? "page" : undefined\}/);
  assert.match(dockSource, /aria-current=\{location === "\/products" \? "page" : undefined\}/);
  assert.match(dockSource, /location === "\/" \? "text-\[#DB2828\]" : "text-\[#333333\]"/);
  assert.match(dockSource, /location === "\/products" \? "text-\[#DB2828\]" : "text-\[#333333\]"/);

  // Every dock action and label is preserved.
  assert.match(dockSource, /<Link asChild href="\/">\s*<a\s+aria-label="Home"/);
  assert.match(dockSource, /<Link asChild href="\/products">\s*<a\s+aria-label="Products"/);
  assert.match(dockSource, /aria-label=\{`Cart\$\{itemCount > 0 \? `, \$\{itemCount\} items` : ""\}`\}\s*onClick=\{\(\) => setCartOpen\(true\)\}/);
  assert.match(dockSource, /aria-label="Search products" onClick=\{openSearch\}/);
  assert.match(dockSource, /aria-label="Open menu" onClick=\{openMenu\}/);

  // Centre bag: 52px red circle raised 6px, cream bag glyph, reduced-motion-aware press.
  assert.match(dockSource, /h-\[52px\] w-\[52px\][^"]*-translate-y-1\.5[^"]*rounded-full bg-\[#DB2828\] text-\[#FFFDF3\][^"]*active:scale-\[0\.94\] motion-reduce:transition-none motion-reduce:active:scale-100/);
  assert.match(dockSource, /<BagIcon className="h-6 w-6 shrink-0" \/>/);

  // Yellow count badge with red Bricolage number and a cream ring, hidden at zero.
  assert.match(dockSource, /\{itemCount > 0 && \(\s*<span className="[^"]*h-\[18px\] min-w-\[18px\][^"]*rounded-full bg-\[#F9D05E\][^"]*font-bloop text-\[11px\] font-bold[^"]*text-\[#B40000\] ring-2 ring-\[#FFFBF1\]"[^>]*>\s*\{itemCount\}/);
});

test("uses the Bloop cream treatment for the shared search overlay", () => {
  assert.match(layoutSource, /className="fixed inset-0 z-\[100\][^"]*bg-black\/10/);
  assert.match(layoutSource, /className="relative h-auto max-h-\[70dvh\] w-full[^"]*rounded-\[12px\][^"]*bg-bloop-cream[^"]*md:max-w-xl/);
});

test("keeps search typing aligned to the left", () => {
  assert.match(layoutSource, /<form onSubmit=\{submitSearch\} className="[^"]*justify-start/);
  assert.match(layoutSource, /className="min-w-0 flex-1 bg-transparent text-left/);
});

test("matches the mobile menu inset shell around dock search", () => {
  assert.match(layoutSource, /className="fixed inset-0 z-\[100\][^"]*p-3 sm:p-4/);
  assert.match(layoutSource, /className="relative h-auto max-h-\[70dvh\] w-full[^"]*rounded-\[12px\][^"]*bg-bloop-cream/);
});

test("keeps the mobile dock search panel compact", () => {
  assert.match(layoutSource, /className="relative h-auto max-h-\[70dvh\] w-full[^"]*md:h-auto/);
});

test("restyles the search popup in the Bloop language without changing its motion or search behaviour", () => {
  const searchStart = layoutSource.indexOf("{isSearchOpen && (");
  const searchEnd = layoutSource.indexOf("</AnimatePresence>", searchStart);
  assert.notEqual(searchStart, -1);
  const searchSource = layoutSource.slice(searchStart, searchEnd);

  // Container motion, backdrop and outside-click close are unchanged.
  assert.match(searchSource, /initial=\{\{ opacity: 0 \}\}\s*animate=\{\{ opacity: 1 \}\}\s*exit=\{\{ opacity: 0 \}\}\s*onClick=\{\(\) => setIsSearchOpen\(false\)\}/);
  assert.match(searchSource, /initial=\{\{ opacity: 0, y: -28, scale: 0\.94 \}\}\s*animate=\{\{ opacity: 1, y: 0, scale: 1 \}\}\s*exit=\{\{ opacity: 0, y: -18, scale: 0\.96 \}\}\s*transition=\{\{ type: "spring", stiffness: 360, damping: 28, mass: 0\.7 \}\}/);
  assert.match(searchSource, /onClick=\{\(event\) => event\.stopPropagation\(\)\}/);
  assert.match(searchSource, /if \(event\.key === "Escape"\) setIsSearchOpen\(false\);/);

  // Input row: Bricolage uppercase text over a 2px ink rule, CLEAR only with text, dark close square.
  assert.match(searchSource, /<form onSubmit=\{submitSearch\} className="[^"]*border-b-2 border-\[#333333\][^"]*" id="site-search-form">/);
  assert.match(searchSource, /<input autoFocus value=\{searchQuery\}[\s\S]*?placeholder="Search products" aria-label="Search products" className="[^"]*font-bloop text-\[20px\] font-bold uppercase[^"]*md:text-\[24px\]"/);
  assert.match(searchSource, /\{searchQuery \? \(\s*<button type="button" onClick=\{\(\) => setSearchQuery\(""\)\}[^>]*>\s*Clear\s*<\/button>/);
  assert.match(searchSource, /onClick=\{\(\) => setIsSearchOpen\(false\)\} aria-label="Close search" className="flex h-11 w-11[^"]*rounded-\[12px\] bg-\[#333333\] text-white[^"]*">\s*<DrawerCloseIcon \/>/);
  assert.match(searchSource, /font-bloop text-\[12px\] font-bold uppercase[^"]*text-\[#333333\]\/60/);
  assert.match(searchSource, /\{searchQuery \? "Suggestions" : "Popular searches"\}/);

  // Results keep the same data source and product links; mobile rows, desktop 4-column cards.
  assert.match(layoutSource, /const suggestions = searchStorefrontProducts\(searchableProducts, searchQuery\)\.slice\(0, 5\);/);
  assert.match(searchSource, /setLocation\(`\/product\/\$\{product\.slug\}`\);\s*setIsSearchOpen\(false\);/);
  assert.match(searchSource, /divide-y divide-\[#333333\]\/15 md:grid md:grid-cols-4/);
  assert.match(searchSource, /h-\[100px\] w-\[100px\] shrink-0 overflow-hidden rounded-\[20px\] bg-bloop-card/);
  assert.match(searchSource, /hasDiscount \? "text-\[#DB2828\]" : "text-\[#333333\]"/);
  assert.match(searchSource, /line-through/);
  assert.match(layoutSource, /`৳\$\{amount\.toLocaleString\("en-US"\)\}`/);
  assert.match(searchSource, /No matching products\./);

  // "View all results" submits the same search form (/products?search=…).
  assert.match(searchSource, /className="sticky bottom-0[^"]*">\s*<button type="submit" form="site-search-form" className="[^"]*rounded-full bg-\[#DB2828\][^"]*">\s*View all results/);
});

test("uses the requested Remix home and Hugeicons product glyphs in the dock", () => {
  assert.match(layoutSource, /function DockHomeIcon\(\{ className \}: \{ className\?: string \}\) \{[\s\S]*?viewBox="0 0 24 24" className=\{className\} aria-hidden="true"[\s\S]*?Remix Icon[\s\S]*?fill="currentColor" d="M21 20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9\.49a1 1 0 0 1 \.386-\.79l8-6\.223a1 1 0 0 1 1\.228 0l8 6\.223a1 1 0 0 1 \.386\.79zm-2-1V9\.978l-7-5\.444l-7 5\.444V19zM7 15h10v2H7z"/);
  assert.match(layoutSource, /function DockProductsIcon\(\{ className \}: \{ className\?: string \}\) \{[\s\S]*?viewBox="0 0 24 24" className=\{className\} aria-hidden="true"[\s\S]*?Huge Icons[\s\S]*?strokeWidth=\{1\.5\}[\s\S]*?d="M15 17\.5h7M18\.5 21v-7"[\s\S]*?d="M7\.326 9\.691/);
});

test("renders the Bloop-style header row with a centred wordmark", () => {
  const navStart = layoutSource.indexOf("{/* Navigation */}");
  const navEnd = layoutSource.indexOf("{/* Mobile bottom navigation */}");
  const navSource = layoutSource.slice(navStart, navEnd);

  assert.match(navSource, /className="sticky top-0 z-50 w-full bg-bloop-cream text-\[#DB2828\]"/);
  assert.doesNotMatch(navSource, /backdrop-blur|border-b|shadow/);
  assert.match(navSource, /relative flex h-14 items-center justify-between px-4 md:h-\[82px\] md:px-\[49px\]/);
  assert.match(navSource, /absolute left-1\/2 top-1\/2 -translate-x-1\/2 -translate-y-1\/2/);
  assert.match(navSource, /"hidden items-center gap-10 font-bloop text-\[13px\] font-bold tracking-\[0\.015em\] xl:flex"/);
  assert.match(navSource, /"mr-5 hidden items-center gap-10 font-bloop text-\[13px\] font-bold tracking-\[0\.015em\] xl:flex"/);
  assert.doesNotMatch(navSource, /uppercase/);
  assert.match(navSource, /flex items-center gap-5/);

  // One hamburger below xl (mobile + tablet); from xl the collection links replace it.
  // Search sits beside it on mobile and before the cart on desktop.
  assert.equal((navSource.match(/aria-label="Open menu"/g) ?? []).length, 1);
  assert.match(navSource, /aria-label="Open menu" onClick=\{openMenu\} className="[^"]*xl:hidden"/);
  assert.match(navSource, /<HeaderMenuIcon className="h-6 w-6" \/>/);
  assert.match(navSource, /aria-label="Search" onClick=\{openSearch\} className="[^"]*md:hidden"/);
  assert.match(navSource, /aria-label="Search" onClick=\{openSearch\} className="hidden[^"]*md:flex"/);
  assert.match(navSource, /aria-label="Cart" onClick=\{\(\) => setCartOpen\(true\)\}/);
  assert.match(navSource, /itemCount > 0 &&/);
  assert.match(layoutSource, /d="M4 8V10H20V8H4ZM4 16H20V14H4V16Z"/);
  assert.match(layoutSource, /d="M22\.2069 20\.7929L16\.3141 14\.8999/);
});

test("uses visible Featured Categories for menu navigation", () => {
  assert.match(layoutSource, /getVisibleFeaturedCollections/);
  assert.match(layoutSource, /getVisibleFeaturedCollections\(searchableProducts\)/);
  assert.match(layoutSource, /\/collection\/\$\{slug\}/);
  assert.match(layoutSource, /visibleCollections\.map/);
});

test("splits every visible collection around the centred logo in the desktop header nav", () => {
  assert.doesNotMatch(layoutSource, /slug !== "new-essentials"|slug !== "best-sellers"/);
  assert.match(layoutSource, /const headerNavLeftCollections = visibleCollections\.slice\(0, 3\);/);
  assert.match(layoutSource, /const headerNavRightCollections = visibleCollections\.slice\(3\);/);
  assert.match(layoutSource, /xl:flex">\s*\{headerNavLeftCollections\.map\(\(\{ slug, label \}\) => \(/);
  assert.match(layoutSource, /xl:flex">\s*\{headerNavRightCollections\.map\(\(\{ slug, label \}\) => \(/);
  assert.ok(
    layoutSource.indexOf("headerNavRightCollections.map") < layoutSource.indexOf('aria-label="Search" onClick={openSearch} className="hidden'),
    "right-hand links render before the desktop search icon",
  );
  assert.match(layoutSource, /<nav aria-label="Collections" className="mt-8">\s*\{visibleCollections\.map/);
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

test("restyles the menu drawer in the Bloop cream language", () => {
  // Opaque cream surface for both the mobile card and the desktop panel (no dark glass).
  assert.match(layoutSource, /className="relative w-full h-full flex flex-col pointer-events-auto rounded-\[12px\] bg-bloop-cream text-\[#333333\] shadow-2xl overflow-hidden"/);
  assert.doesNotMatch(layoutSource, /md:bg-neutral-500\/60 md:text-white/);
  assert.doesNotMatch(layoutSource, /Shipping to:/);

  // Header: MENU label + dark 44px close square with the Bloop X glyph, shared by both variants.
  assert.match(layoutSource, /const menuLabelClass = "font-bloop text-\[13px\] font-bold uppercase[^"]*text-\[#333333\]"/);
  assert.match(layoutSource, /aria-label="Close menu" className="flex h-11 w-11[^"]*rounded-\[12px\] bg-\[#333333\] text-white/);
  assert.match(layoutSource, /d="M20\.707 4\.70697L19\.293 3\.29297/);
  assert.equal((layoutSource.match(/\{menuCloseButton\}/g) ?? []).length, 2);

  // Search field reuses the site's existing /products?search= behaviour.
  assert.match(layoutSource, /<form onSubmit=\{submitMenuSearch\} role="search" className="[^"]*border-b-2 border-\[#333333\]/);
  assert.match(layoutSource, /const submitMenuSearch = [\s\S]*?goToSearch\(\);\s*setIsOpen\(false\);/);
  assert.match(layoutSource, /const submitSearch = [\s\S]*?goToSearch\(\);\s*setIsSearchOpen\(false\);/);
  assert.match(layoutSource, /setLocation\(query \? `\/products\?search=\$\{encodeURIComponent\(query\)\}` : "\/products"\)/);

  // Big red Bricolage links; Collections opens the sub-page with a red chevron.
  assert.match(layoutSource, /const mobileMenuLinkClass = "flex min-h-\[49px\][^"]*font-bloop text-\[24px\] font-bold[^"]*text-\[#DB2828\]/);
  assert.match(layoutSource, /onClick=\{\(\) => setMobileMenuPage\("collections"\)\}[^\n]*<AnnouncementChevronRightIcon \/>/);
  assert.match(layoutSource, /font-bloop text-\[32px\] font-bold[^"]*text-\[#DB2828\]/);
  assert.match(layoutSource, /<span className="font-bangla text-\[28px\] font-semibold">\/ \{banglaLabel\}<\/span>/);

  // Small columns only use routes that exist, then brand line, socials and contact.
  const columns = layoutSource.slice(layoutSource.indexOf("const MENU_LINK_COLUMNS"), layoutSource.indexOf("const MENU_SOCIAL_LINKS"));
  assert.deepEqual([...columns.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]), [
    "/track-order", "/how-to-order", "/faq", "/contact-us", "/about-us", "/privacy-policy", "/refund-return-exchange",
  ]);
  assert.match(layoutSource, /Icon: FooterFacebookIcon/);
  assert.match(layoutSource, /Icon: FooterInstagramIcon/);
  assert.match(layoutSource, /Icon: FooterWhatsAppIcon/);
  assert.equal((layoutSource.match(/<BrandTagline \/>/g) ?? []).length, 2);
  assert.match(layoutSource, /<a href="tel:\+8801819502705" aria-label="Call Angonaloy Team"/);
  assert.match(layoutSource, /const menuBrandBlock = \(showContact: boolean\)/);
  assert.match(layoutSource, /\{showContact \? \([\s\S]*?<h2 className=\{`mt-8 \$\{menuLabelClass\}`\}>Contact<\/h2>/);
  assert.match(layoutSource, /<div className="mt-10">\{menuBrandBlock\(false\)\}<\/div>/);
  assert.match(layoutSource, /<div className="mt-12">\{menuBrandBlock\(true\)\}<\/div>/);
  assert.match(layoutSource, /MENU_LINK_COLUMNS\.filter\(\(\{ heading \}\) => showInfo \|\| heading !== "Info"\)/);
  assert.match(layoutSource, /<div className="mt-10">\{menuLinkColumns\(false\)\}<\/div>/);
  assert.match(layoutSource, /\{menuLinkColumns\(true\)\}/);
});

test("keeps the menu drawer popup motion unchanged", () => {
  assert.match(layoutSource, /initial=\{\{ opacity: 0, scale: 0\.96 \}\}\s*animate=\{\{ opacity: 1, scale: 1, transition: \{ duration: 0\.58, ease: \[0\.22, 1, 0\.36, 1\] \} \}\}\s*exit=\{\{ opacity: 0, scale: 0\.96, transition: \{ duration: 0\.42, ease: \[0\.22, 1, 0\.36, 1\] \} \}\}/);
  assert.match(layoutSource, /className="fixed inset-0 z-\[100\] w-full h-\[100dvh\] supports-\[height:100dvh\]:h-dvh p-3 sm:p-4 pointer-events-none"/);
  assert.match(layoutSource, /transition=\{\{ duration: 0\.6, delay: idx \* 0\.06 \+ 0\.2, ease: \[0\.22, 1, 0\.36, 1\] \}\}/);
  assert.match(layoutSource, /transition=\{\{ duration: 0\.42, ease: \[0\.25, 0\.1, 0\.25, 1\] \}\}/);
  assert.match(layoutSource, /document\.body\.style\.overflow = "hidden";/);
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
    "/terms-and-conditions",
    "/privacy-policy",
    "/refund-return-exchange",
    "/faq",
    "/track-order",
  ]) {
    assert.match(layoutSource, new RegExp(path));
  }
  assert.doesNotMatch(layoutSource, /href="#"/);
});

test("places the tagline beneath the footer logo and stacks Support after Information on mobile", () => {
  const footerSource = layoutSource.slice(layoutSource.indexOf("<footer"), layoutSource.indexOf("</footer>"));
  const logoIndex = footerSource.indexOf('aria-label="Angonaloy home"');
  const taglineIndex = footerSource.indexOf("<BrandTagline />");
  const linksIndex = footerSource.indexOf("{/* Small link columns */}");
  const bottomBarIndex = footerSource.indexOf("{/* Bottom Bar */}");

  assert.ok(logoIndex >= 0 && logoIndex < taglineIndex && taglineIndex < linksIndex);
  assert.ok(taglineIndex < bottomBarIndex);
  assert.equal((footerSource.match(/<BrandTagline \/>/g) ?? []).length, 1);
  assert.match(footerSource, /<div className="mt-10 grid grid-cols-1[^\"]*md:grid-cols-4/);
  assert.match(footerSource, /\[\["Information", INFORMATION_LINKS\], \["Support", SUPPORT_LINKS\]\]/);
});

test("uses the footer text wordmark in the header instead of the logo image", () => {
  const navStart = layoutSource.indexOf("{/* Navigation */}");
  const navEnd = layoutSource.indexOf("{/* Mobile bottom navigation */}");
  assert.notEqual(navStart, -1);
  assert.notEqual(navEnd, -1);
  const navSource = layoutSource.slice(navStart, navEnd);

  assert.match(navSource, />\s*আঙ্গনালয়\s*<\/span>/);
  assert.match(navSource, /IhtishamDeshlipi/);
  assert.match(navSource, /text-\[#FF2849\]/);
  assert.doesNotMatch(navSource, /angonaloyLogo/);
  assert.doesNotMatch(layoutSource, /angonaloyLogo/);
});

test("uses Angonaloy WhatsApp in customer navigation and Arc Labs WhatsApp only for the developer credit", () => {
  const bottomBarIndex = layoutSource.indexOf("/* Bottom Bar */");
  assert.notEqual(bottomBarIndex, -1);
  const customerNavigationSource = layoutSource.slice(0, bottomBarIndex);

  assert.match(customerNavigationSource, /phone=8801819502705/);
  assert.doesNotMatch(customerNavigationSource, /phone=8801733670129/);
  assert.match(layoutSource.slice(bottomBarIndex), /phone=8801733670129/);
});

test("renders the compact Bloop-style footer", () => {
  const footerStart = layoutSource.indexOf("<footer");
  const footerEnd = layoutSource.indexOf("</footer>");
  assert.notEqual(footerStart, -1);
  assert.notEqual(footerEnd, -1);
  const footerSource = layoutSource.slice(footerStart, footerEnd);

  assert.match(footerSource, /bg-\[#DB2828\][^"]*text-\[#FFFDF3\]/);
  assert.match(footerSource, /text-\[#F9D05E\]/);
  assert.match(footerSource, /IhtishamDeshlipi/);
  assert.match(footerSource, /md:grid-cols-12/);
  assert.match(footerSource, /font-bloop text-\[25px\] font-bold[^"]*md:text-\[43px\] md:leading-\[58px\]/);
  assert.match(footerSource, />Explore Products<\/a>/);
  assert.match(footerSource, /visibleCollections\.map/);
  assert.match(footerSource, /font-bloop-body/);
  assert.match(footerSource, /h-px bg-\[#FFFDF3\]\/25/);
  assert.match(footerSource, /© 2026 Angonaloy-আঙ্গনালয়/);
  assert.match(footerSource, /All rights reserved/);
  assert.match(footerSource, /className="mt-4 font-bangla/);
  for (const label of ["Facebook", "Instagram", "WhatsApp"]) {
    assert.match(footerSource, new RegExp(`aria-label="${label}"`));
    assert.match(footerSource, new RegExp(`<Footer${label}Icon />`));
  }
  assert.match(layoutSource, /viewBox="0 0 40 40"/);

  for (const removed of ["JOIN THE ATELIER", "Newsletter", "Dhaka, Bangladesh", "BST", "MoneyReceive", "rotate-45", "footer-bg", "নিরাপদ পেমেন্ট", "মান নিশ্চিত"]) {
    assert.doesNotMatch(layoutSource, new RegExp(removed));
  }
  assert.doesNotMatch(layoutSource, /setInterval\(tick/);
});

test("keeps only the important footer information and support links", () => {
  const information = layoutSource.slice(layoutSource.indexOf("const INFORMATION_LINKS"), layoutSource.indexOf("const SUPPORT_LINKS"));
  const support = layoutSource.slice(layoutSource.indexOf("const SUPPORT_LINKS"), layoutSource.indexOf("export default function Layout"));
  assert.deepEqual([...information.matchAll(/\["([^"]+)", "([^"]+)"\]/g)].map((m) => [m[1], m[2]]), [
    ["About Us", "/about-us"],
    ["Contact", "/contact-us"],
    ["Terms & Conditions", "/terms-and-conditions"],
    ["Privacy Policy", "/privacy-policy"],
    ["Refund & Exchange", "/refund-return-exchange"],
  ]);
  assert.deepEqual([...support.matchAll(/\["([^"]+)", "([^"]+)"\]/g)].map((m) => [m[1], m[2]]), [
    ["How to Order", "/how-to-order"],
    ["Order Tracking", "/track-order"],
    ["Payment & Shipping", "/shipping-policy"],
    ["FAQ", "/faq"],
  ]);
  for (const dropped of ["Company Information", "Careers", "Help Center", "Payment Policy", "Cancellation Policy", "Consumer Policy"]) {
    assert.doesNotMatch(layoutSource, new RegExp(dropped));
  }
});

test("keeps the Arc Labs Corporation developer credit linked in the footer", () => {
  const footerSource = layoutSource.slice(layoutSource.indexOf("<footer"), layoutSource.indexOf("</footer>"));
  assert.match(footerSource, /Designed &amp; Developed by/);
  assert.match(
    footerSource,
    /<a\s+href="https:\/\/api\.whatsapp\.com\/send\/\?phone=8801733670129"\s+className="underline[^"]*"\s*>\s*Arc Labs Corporation\s*<\/a>/,
  );
});

test("aligns the footer bottom bar into three desktop columns while stacking on mobile", () => {
  const bottomBar = layoutSource.slice(layoutSource.indexOf("{/* Bottom Bar */}"), layoutSource.indexOf("</footer>"));
  assert.match(bottomBar, /grid grid-cols-1[^\"]*md:grid-cols-12[^\"]*md:items-start/);
  assert.match(bottomBar, /<div className="md:col-span-4">\s*<p>© 2026 Angonaloy-আঙ্গনালয়<\/p>\s*<p>All rights reserved<\/p>\s*<\/div>/);
  assert.match(bottomBar, /<p className="md:col-span-4">\s*Designed &amp; Developed by/);
  assert.match(bottomBar, /className="-ml-\[10px\] -mt-\[10px\] flex items-start md:col-span-4[^\"]*md:justify-self-end"/);
});

test("never nests an <a> inside wouter's <Link> (which already renders an anchor)", () => {
  assert.match(layoutSource, /<Link href="\/products" className="underline[^"]*">\s*Shop now\s*<\/Link>/);
  const lines = layoutSource.split("\n");
  lines.forEach((line, index) => {
    if (/<Link\b/.test(line) && /^\s*<a(\s|>|$)/.test(lines[index + 1] ?? "")) {
      assert.match(line, /<Link asChild\b/, `line ${index + 1} wraps an <a> without asChild`);
    }
  });
});
