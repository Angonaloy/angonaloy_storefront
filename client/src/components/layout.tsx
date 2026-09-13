import { Link, useLocation } from "wouter";
import { ArrowUpRight, ArrowRight, Globe, ShieldCheck, X } from "lucide-react";
import { Box as ReiconBox, MoneyReceive, TruckFast, ShieldTick, CheckCircle } from "reicon-react";
import { useState, useEffect, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useCart } from "@/contexts/cart-context";
import CartDrawer from "@/components/cart-drawer";
import mangoLoverLogo from "@assets/mango-lover-logo.avif";
import {
  fetchStorefrontProducts,
  getProductImage,
  searchStorefrontProducts,
  STOREFRONT_CATALOG_QUERY_OPTIONS,
} from "@/lib/storefront-products";
import { generatedStorefrontProducts } from "@/lib/generated-storefront-products";
import { getVisibleFeaturedCollections } from "@/lib/featured-collections";

function BagIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path fill="currentColor" d="M16 9a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-6 0a1 1 0 1 1-2 0a1 1 0 0 1 2 0" />
      <path fill="currentColor" fillRule="evenodd" d="M12 2.75A2.25 2.25 0 0 0 9.75 5v.254q.626-.005 1.355-.004h1.79q.73-.001 1.355.004V5A2.25 2.25 0 0 0 12 2.75m3.75 2.557V5a3.75 3.75 0 0 0-7.5 0v.307q-.202.014-.391.035c-.878.095-1.613.293-2.265.74a5 5 0 0 0-.63.516c-.566.552-.905 1.234-1.17 2.076c-.257.819-.465 1.859-.727 3.166l-.019.095c-.376 1.883-.673 3.367-.758 4.549c-.088 1.208.034 2.223.606 3.104q.288.442.664.81c.752.734 1.724 1.052 2.925 1.204c1.176.148 2.69.148 4.61.148h1.81c1.921 0 3.434 0 4.61-.148c1.201-.152 2.174-.47 2.925-1.204a4.8 4.8 0 0 0 .664-.81c.572-.88.694-1.896.607-3.104c-.086-1.182-.382-2.666-.76-4.549l-.018-.095c-.261-1.307-.47-2.347-.727-3.166c-.265-.842-.604-1.524-1.17-2.076a5 5 0 0 0-.63-.516c-.652-.447-1.387-.645-2.265-.74a11 11 0 0 0-.39-.035M8.02 6.833c-.747.08-1.208.233-1.578.486a3.3 3.3 0 0 0-.431.354c-.321.313-.56.735-.786 1.451c-.23.733-.424 1.693-.695 3.052c-.39 1.948-.667 3.34-.744 4.416c-.077 1.062.052 1.693.368 2.179q.196.302.454.554c.415.405 1.008.655 2.065.789c1.07.135 2.49.136 4.476.136h1.703c1.986 0 3.404-.001 4.475-.136c1.057-.134 1.65-.384 2.065-.789a3.3 3.3 0 0 0 .454-.554c.316-.486.445-1.117.369-2.18c-.078-1.076-.355-2.467-.744-4.415c-.272-1.359-.465-2.32-.696-3.052c-.225-.716-.465-1.138-.786-1.451a3 3 0 0 0-.43-.354c-.37-.253-.832-.405-1.579-.486c-.763-.082-1.743-.083-3.129-.083H11.15c-1.386 0-2.366.001-3.13.083" clipRule="evenodd" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 22L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuLinesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M20.75 7C20.75 7.41421 20.4142 7.75 20 7.75L4 7.75C3.58579 7.75 3.25 7.41421 3.25 7C3.25 6.58579 3.58579 6.25 4 6.25L20 6.25C20.4142 6.25 20.75 6.58579 20.75 7Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M20.75 12C20.75 12.4142 20.4142 12.75 20 12.75L4 12.75C3.58579 12.75 3.25 12.4142 3.25 12C3.25 11.5858 3.58579 11.25 4 11.25L20 11.25C20.4142 11.25 20.75 11.5858 20.75 12Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M20.75 17C20.75 17.4142 20.4142 17.75 20 17.75L4 17.75C3.58579 17.75 3.25 17.4142 3.25 17C3.25 16.5858 3.58579 16.25 4 16.25L20 16.25C20.4142 16.25 20.75 16.5858 20.75 17Z" />
    </svg>
  );
}

function HomeDuotoneIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M9.44661 15.3975C9.11385 15.1508 8.64413 15.2206 8.39748 15.5534C8.15082 15.8862 8.22062 16.3559 8.55339 16.6025C9.5258 17.3233 10.715 17.75 12 17.75C13.285 17.75 14.4742 17.3233 15.4466 16.6025C15.7794 16.3559 15.8492 15.8862 15.6025 15.5534C15.3559 15.2208 14.8862 15.1508 14.5534 15.3975C13.825 15.9373 12.9459 16.25 12 16.25C11.0541 16.25 10.175 15.9373 9.44661 15.3975Z" fill="currentColor" opacity="0.55" />
      <path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C11.2919 1.25 10.6485 1.45282 9.95055 1.79224C9.27585 2.12035 8.49642 2.60409 7.52286 3.20832L5.45628 4.4909C4.53509 5.06261 3.79744 5.5204 3.2289 5.95581C2.64015 6.40669 2.18795 6.86589 1.86131 7.46263C1.53535 8.05812 1.38857 8.69174 1.31819 9.4407C1.24999 10.1665 1.24999 11.0541 1.25 12.1672V13.7799C1.24999 15.6837 1.24998 17.1866 1.4027 18.3616C1.55937 19.567 1.88856 20.5401 2.63236 21.3094C3.37958 22.0824 4.33046 22.4277 5.50761 22.5914C6.64849 22.75 8.10556 22.75 9.94185 22.75H14.0581C15.8944 22.75 17.3515 22.75 18.4924 22.5914C19.6695 22.4277 20.6204 22.0824 21.3676 21.3094C22.1114 20.5401 22.4406 19.567 22.5973 18.3616C22.75 17.1866 22.75 15.6838 22.75 13.7799V12.1672C22.75 11.0541 22.75 10.1665 22.6818 9.4407C22.6114 8.69174 22.4646 8.05812 22.1387 7.46263C21.8121 6.86589 21.3599 6.40669 20.7711 5.95581C20.2026 5.5204 19.4649 5.06262 18.5437 4.49091L16.4771 3.20831C15.5036 2.60409 14.7241 2.12034 14.0494 1.79224C13.3515 1.45282 12.7081 1.25 12 1.25ZM8.27953 4.50412C9.29529 3.87371 10.0095 3.43153 10.6065 3.1412C11.1882 2.85833 11.6002 2.75 12 2.75C12.3998 2.75 12.8118 2.85833 13.3935 3.14119C13.9905 3.43153 14.7047 3.87371 15.7205 4.50412L17.7205 5.74537C18.6813 6.34169 19.3559 6.76135 19.8591 7.1467C20.3487 7.52164 20.6303 7.83106 20.8229 8.18285C21.0162 8.53589 21.129 8.94865 21.1884 9.58104C21.2492 10.2286 21.25 11.0458 21.25 12.2039V13.725C21.25 15.6959 21.2485 17.1012 21.1098 18.1683C20.9736 19.2163 20.717 19.8244 20.2892 20.2669C19.8649 20.7058 19.2871 20.9664 18.2858 21.1057C17.2602 21.2483 15.9075 21.25 14 21.25H10C8.09247 21.25 6.73983 21.2483 5.71422 21.1057C4.71286 20.9664 4.13514 20.7058 3.71079 20.2669C3.28301 19.8244 3.02642 19.2163 2.89019 18.1683C2.75149 17.1012 2.75 15.6959 2.75 13.725V12.2039C2.75 11.0458 2.75076 10.2286 2.81161 9.58104C2.87103 8.94865 2.98385 8.53589 3.17709 8.18285C3.36965 7.83106 3.65133 7.52164 4.14092 7.1467C4.6441 6.76135 5.31869 6.34169 6.27953 5.74537L8.27953 4.50412Z" fill="currentColor" />
    </svg>
  );
}

const DHAKA_TIME_ZONE = "Asia/Dhaka";

const MENU_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Top Selling Products - সেরা বিক্রিত পণ্য", href: "/collection/top-selling-products" },
  { label: "Track Order", href: "/track-order" },
  { label: "Contact Us", href: "/contact-us" },
] as const;

const INFORMATION_LINKS = [
  ["About Us", "/about-us"],
  ["Contact", "/contact-us"],
  ["Company Information", "/about-us"],
  ["The Mango Lover Story", "/about-us"],
  ["Terms & Conditions", "/terms-and-conditions"],
  ["Privacy Policy", "/privacy-policy"],
  ["Careers", "/contact-us"],
  ["Refund & Exchange", "/refund-return-exchange"],
] as const;

const SUPPORT_LINKS = [
  ["Help Center", "/faq"],
  ["How to Order", "/how-to-order"],
  ["Order Tracking", "/track-order"],
  ["Payment & Shipping", "/shipping-policy"],
  ["Payment Policy", "/payment-policy"],
  ["Cancellation Policy", "/cancellation-policy"],
  ["Frequently Asked Questions", "/faq"],
  ["Consumer Policy", "/terms-and-conditions"],
] as const;

const pad = (value: number) => value.toString().padStart(2, "0");

// Wall-clock time in Bangladesh whatever timezone the visitor is in, so the
// footer clock follows the shop's own day.
function dhakaClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: DHAKA_TIME_ZONE,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { hours: value("hour"), minutes: value("minute"), seconds: value("second") };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuPage, setMobileMenuPage] = useState<"main" | "collections">("main");
  const [time, setTime] = useState('');
  const [isAtPageBottom, setIsAtPageBottom] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { setIsOpen: setCartOpen, itemCount } = useCart();
  const { data: searchableProducts = [] } = useQuery({
    queryKey: ["merchant-suite-products-listing"],
    queryFn: fetchStorefrontProducts,
    ...STOREFRONT_CATALOG_QUERY_OPTIONS,
    initialData: generatedStorefrontProducts,
    initialDataUpdatedAt: 0,
    enabled: isSearchOpen || isOpen,
  });
  const visibleCollections = getVisibleFeaturedCollections(searchableProducts);
  const desktopMenuItems = [
    ...MENU_ITEMS.slice(0, 2),
    ...visibleCollections.map(({ slug, label }) => ({ label, href: `/collection/${slug}` })),
    ...MENU_ITEMS.slice(2),
  ];

  const openSearch = () => setIsSearchOpen(true);
  const openMenu = () => {
    setMobileMenuPage("main");
    setIsOpen(true);
  };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    setLocation(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
    setIsSearchOpen(false);
  };
  const suggestions = searchStorefrontProducts(searchableProducts, searchQuery).slice(0, 5);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const tick = () => {
      const clock = dhakaClock(new Date());
      setTime(`${pad(clock.hours)}:${pad(clock.minutes)}`);
    };

    tick();
    const intervalId = setInterval(tick, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const updatePageBottom = () => {
      const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      setIsAtPageBottom(window.innerHeight + window.scrollY >= documentHeight - 24);
    };

    updatePageBottom();
    window.addEventListener("scroll", updatePageBottom, { passive: true });
    window.addEventListener("resize", updatePageBottom);
    return () => {
      window.removeEventListener("scroll", updatePageBottom);
      window.removeEventListener("resize", updatePageBottom);
    };
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col md:bg-brand-ivory text-black selection:bg-brand-gold selection:text-white">
      {/* Announcement Bar */}
      <div className="border-b border-black bg-[#FBBB14] px-4 text-black sm:px-10 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex min-h-[34px] items-center justify-center overflow-hidden py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] sm:min-h-[42px] sm:py-2.5 sm:text-xs" aria-label="Free shipping announcement">
            <p className="whitespace-nowrap">
              Free shipping on orders over <strong className="text-[#163B33]">৳2600</strong> <span aria-hidden="true">—</span>{" "}
              <Link href="/products">
                <a className="underline decoration-[#e53935] decoration-2 underline-offset-4 transition-colors hover:text-[#e53935]">Shop now</a>
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-[#f6f6f6] backdrop-blur-xl md:bg-brand-ivory/80 md:backdrop-blur-md transition-all duration-300">
        <div className="flex h-14 items-center justify-between pl-2.5 pr-1.5 md:h-20 md:gap-8 md:px-10 lg:px-16">
          <div className="flex flex-1 items-center justify-start md:flex-none md:basis-64">
            <div className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu" className="group flex h-9 w-auto items-center justify-center rounded-[8px] px-0 [&_svg]:size-7 md:h-12" onClick={openMenu}>
                <MenuLinesIcon className="opacity-70 transition-opacity group-hover:opacity-100" />
              </Button>
            </div>
            <Link href="/">
              <a className="hidden items-center text-black md:flex">
                <img src={mangoLoverLogo} alt="Mango Lover" className="h-10 w-auto" />
              </a>
            </Link>
          </div>

          <div className="flex items-center justify-center md:hidden">
            <Link href="/">
              <a className="flex items-center text-black">
                <img
                  src={mangoLoverLogo}
                  alt="Mango Lover"
                  className="h-7 w-auto md:h-11"
                />
              </a>
            </Link>
          </div>

          <div className="hidden min-w-0 flex-1 items-center justify-start md:flex md:overflow-x-auto no-scrollbar">
            <div className="flex w-max items-center justify-center gap-5 text-[10px] font-medium uppercase tracking-[0.16em] text-black/70 lg:gap-8">
              {visibleCollections.map(({ slug, label }) => (
                <Link key={slug} href={`/collection/${slug}`}>
                  <a className="whitespace-nowrap transition-colors hover:text-brand-gold">{label}</a>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-1 md:flex-none md:basis-44">
            <Button
              variant="ghost"
              onClick={openSearch}
              aria-label="Search"
              className="group flex h-9 w-auto items-center justify-center rounded-[8px] px-1 hover:bg-transparent [&_svg]:size-5 md:h-12 md:px-3"
            >
              <SearchIcon className="opacity-70 transition-opacity group-hover:opacity-100" />
            </Button>

            <Button
              variant="ghost"
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
              className="group relative flex h-9 items-center justify-center rounded-[8px] px-1 hover:bg-transparent [&_svg]:size-6 md:h-12 md:px-3"
            >
              <BagIcon className="opacity-70 transition-opacity group-hover:opacity-100" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-gold text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <motion.nav
        aria-label="Mobile navigation"
        initial={false}
        animate={{ y: isAtPageBottom ? "110%" : 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-3 bottom-3 z-[80] flex h-16 items-center justify-around rounded-[8px] border border-white/10 bg-neutral-500/60 px-2 text-white shadow-2xl backdrop-blur-md md:hidden"
      >
        <Link href="/">
          <a
            aria-label="Home"
            aria-current={location === "/" ? "page" : undefined}
            className={`flex min-w-[52px] flex-col items-center gap-1 text-[9px] font-medium tracking-[0.04em] transition-colors ${location === "/" ? "text-white" : "text-white/55"}`}
          >
            <HomeDuotoneIcon className="h-5 w-5" />
            <span>Home</span>
          </a>
        </Link>
        <Link href="/products">
          <a
            aria-label="Products"
            aria-current={location === "/products" ? "page" : undefined}
            className={`flex min-w-[52px] flex-col items-center gap-1 text-[9px] font-medium tracking-[0.04em] transition-colors ${location === "/products" ? "text-white" : "text-white/55"}`}
          >
            <ReiconBox size={20} color="currentColor" weight="Outline" />
            <span>Products</span>
          </a>
        </Link>
        <Button
          variant="ghost"
          aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
          onClick={() => setCartOpen(true)}
          className="relative flex h-12 w-16 flex-col items-center justify-center rounded-full bg-[#C8F45A] p-0 text-black shadow-none hover:bg-[#C8F45A]"
        >
          <BagIcon className="!h-8 !w-8" />
          {itemCount > 0 && (
            <span className="absolute right-3 top-2 h-1.5 w-1.5 rounded-full bg-[#163B33]" aria-label={`${itemCount} items in cart`} />
          )}
          <span className="sr-only">Cart</span>
        </Button>
        <button type="button" aria-label="Search products" onClick={openSearch} className="flex min-w-[52px] flex-col items-center gap-1 text-[9px] font-medium tracking-[0.04em] text-white/55 transition-colors hover:text-white">
            <SearchIcon className="h-5 w-5" />
            <span>Search</span>
        </button>
        <Button
          variant="ghost"
          aria-label="Open menu"
          onClick={openMenu}
          className="flex min-w-[52px] flex-col items-center gap-1 rounded-none p-0 text-[9px] font-medium tracking-[0.04em] text-white/55 shadow-none transition-colors hover:bg-transparent hover:text-white"
        >
          <MenuLinesIcon className="!h-5 !w-5 scale-125 opacity-70" />
          <span>Menu</span>
        </Button>
      </motion.nav>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/10 p-3 sm:p-4 md:px-4 md:pt-[16vh] md:backdrop-blur-md"
          >
            <motion.div
            initial={{ opacity: 0, y: -28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 360, damping: 28, mass: 0.7 }}
              onClick={(event) => event.stopPropagation()}
              className="relative h-auto max-h-[70dvh] w-full max-w-none overflow-y-auto rounded-[12px] bg-white px-5 pb-8 pt-5 md:h-auto md:max-h-none md:max-w-xl md:overflow-hidden md:rounded-2xl md:border md:border-black/10 md:p-3 md:shadow-2xl"
            >
              <form onSubmit={submitSearch} className="flex items-center justify-start gap-3 border-b border-black/10 px-0 py-4 md:rounded-xl md:border md:bg-[#fafafa] md:px-4 md:py-3">
                <SearchIcon className="h-5 w-5 shrink-0 text-black/60" />
                <input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search products" aria-label="Search products" className="min-w-0 flex-1 bg-transparent text-left text-base outline-none placeholder:text-black/40" />
                <button type="button" onClick={() => setIsSearchOpen(false)} aria-label="Close search" className="rounded-full p-1 text-black/50 transition-colors hover:bg-black/5 hover:text-black">
                  <X size={19} strokeWidth={1.5} />
                </button>
              </form>
              <div className="px-0 pb-2 pt-5 md:px-2">
                <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.3em] text-black/45">
                  {searchQuery ? "Suggestions" : "Popular searches"}
                </p>
                <div className="space-y-1">
                  {suggestions.length > 0 ? suggestions.map((product) => (
                    <button
                      key={product.slug}
                      type="button"
                      onClick={() => {
                        setLocation(`/product/${product.slug}`);
                        setIsSearchOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-black/75 transition-colors hover:bg-white/60 hover:text-black"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-black/5">
                          {getProductImage(product) ? (
                            <img src={getProductImage(product)} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </span>
                        <span className="truncate">{product.name}</span>
                      </span>
                      <ArrowUpRight size={15} strokeWidth={1.5} className="ml-3 shrink-0 text-black/35" />
                    </button>
                  )) : (
                    <p className="px-3 py-2 text-sm text-black/45">No matching products.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={true}>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] w-full h-[100dvh] supports-[height:100dvh]:h-dvh p-3 sm:p-4 pointer-events-none"
          >
            <motion.div
              className="absolute inset-0 bg-black/10 pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3 } }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } }}
              className="relative w-full h-full flex flex-col pointer-events-auto rounded-[12px] bg-white text-black shadow-2xl overflow-hidden md:bg-neutral-500/60 md:text-white md:backdrop-blur-md"
            >
              <div className="flex h-full flex-col px-5 py-5 md:hidden">
                <div className="flex justify-end">
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close menu" className="h-10 w-10 rounded-full text-black hover:bg-black/5">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={mobileMenuPage}
                    initial={{ opacity: 0, y: 4, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.99 }}
                    transition={{ duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }}
                    className="flex min-h-0 flex-1 flex-col"
                  >
                  {mobileMenuPage === "main" ? (
                  <nav aria-label="Mobile menu" className="mt-[14vh] space-y-5">
                    <Link href="/" onClick={() => setIsOpen(false)}>
                      <a className="flex items-center justify-between text-[2rem] font-normal leading-none tracking-[-0.05em]"><span>Home <span className="text-[1.45rem] font-bold text-black/55">/ হোম</span></span><ArrowRight size={27} strokeWidth={1.25} /></a>
                    </Link>
                    <Link href="/products" onClick={() => setIsOpen(false)}>
                      <a className="flex items-center justify-between text-[2rem] font-normal leading-none tracking-[-0.05em]"><span>Products <span className="text-[1.45rem] font-bold text-black/55">/ পণ্যসমূহ</span></span><ArrowRight size={27} strokeWidth={1.25} /></a>
                    </Link>
                    <Link href="/collection/top-selling-products" onClick={() => setIsOpen(false)}>
                      <a className="flex items-center justify-between text-[2rem] font-normal leading-none tracking-[-0.05em]"><span>Top Selling Products <span className="text-[1.45rem] font-bold text-black/55">/ সেরা বিক্রিত পণ্য</span></span><ArrowRight size={27} strokeWidth={1.25} /></a>
                    </Link>
                    <button type="button" onClick={() => setMobileMenuPage("collections")} className="flex w-full items-center justify-between text-left text-[2rem] font-normal leading-none tracking-[-0.05em]"><span>Collection <span className="text-[1.45rem] font-bold text-black/55">/ ক্যাটাগরিসমূহ</span></span><ArrowRight size={27} strokeWidth={1.25} /></button>
                  </nav>
                ) : (
                  <div className="mt-8">
                    <button type="button" onClick={() => setMobileMenuPage("main")} className="mb-10 flex items-center gap-2 text-sm text-black/55"><ArrowRight size={17} className="rotate-180" /> Back</button>
                    <h2 className="mb-7 text-[2rem] font-normal leading-none tracking-[-0.05em]">Collections</h2>
                    <nav aria-label="Collections" className="grid grid-cols-1 gap-4 text-lg">
                      {visibleCollections.map(({ slug, label }) => (
                        <Link key={slug} href={`/collection/${slug}`} onClick={() => setIsOpen(false)}>
                          <a className="transition-opacity hover:opacity-60">{label}</a>
                        </Link>
                      ))}
                    </nav>
                  </div>
                )}
                  {mobileMenuPage === "main" && (
                  <div className="mt-auto grid grid-cols-1 gap-y-4 pb-2 text-base">
                    <a href="https://www.facebook.com/WeAreMangoLover" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-60">Facebook</a>
                    <a href="https://www.instagram.com/wearemangolover" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-60">Instagram</a>
                    <a href="https://api.whatsapp.com/send/?phone=8801301636461" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-60">WhatsApp</a>
                    <a href="tel:+8801301636461" className="transition-opacity hover:opacity-60">Call Mango Lover Team</a>
                  </div>
                )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="hidden md:flex md:flex-col md:h-full md:px-12 md:py-10 md:justify-between md:overflow-y-auto">
                {/* Header */}
                <div className="flex justify-end items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full hover:bg-white/10 text-white transition-all h-10 w-10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-6 md:gap-8 py-8 flex-1 justify-center px-2">
                  {desktopMenuItems.map((item, idx) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: idx * 0.06 + 0.2, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Link href={item.href} onClick={() => setIsOpen(false)}>
                          <a className="group flex items-baseline">
                            <span className="text-2xl font-sans font-medium tracking-tight text-white transition-opacity duration-300 hover:opacity-70 md:text-3xl">{item.label}</span>
                          </a>
                        </Link>
                      </motion.div>
                    ))}
                </div>

                {/* Footer Info */}
                <div className="space-y-6 mt-12 pb-4">
                  <div className="h-px w-full bg-white/10" />
                  <div className="flex justify-between items-center text-white/80 text-sm font-medium">
                    <span className="flex items-center gap-3">
                      Shipping to:
                      <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md text-xs">
                        <span>BD</span> Bangladesh
                      </span>
                    </span>
                  </div>
                  <div className="text-white/60 text-sm">
                    © 2026 ম্যাংগো লাভার - Mango Lover
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Main Content with Transition */}
      <main className="flex-grow overflow-hidden bg-brand-ivory pb-20 md:pb-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 14, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(3px)" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Luxury Swiss Grid Footer */}
      <footer className="relative border-t border-black/10 text-black/70 pt-12 md:pt-24 overflow-hidden">
        {/* Background image — desktop */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 md:opacity-40 hidden md:block"
          style={{ backgroundImage: "url('/footer-bg.webp')" }}
        />
        {/* Background image — mobile */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 md:opacity-40 md:hidden"
          style={{ backgroundImage: "url('/footer-bg-mobile-v2.webp')" }}
        />
        {/* Foggy gradient on left for mobile */}
        <div
          className="absolute inset-0 md:hidden"
          style={{ background: "linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 25%, rgba(255,255,255,0.2) 50%, transparent 70%)" }}
        />
        {/* Foggy gradient on bottom for mobile */}
        <div
          className="absolute inset-0 md:hidden"
          style={{ background: "linear-gradient(to top, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 15%, transparent 40%)" }}
        />
        {/* White overlay for text readability */}
        <div className="absolute inset-0 bg-white/60" />

        {/* Main Grid Content */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 max-w-[1440px] mx-auto px-4 sm:px-8 md:px-16 gap-16 mb-8 md:mb-24">
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-8">
            <img
              src={mangoLoverLogo}
              alt="Mango Lover"
              className="h-9 w-auto md:hidden"
            />
            <p className="text-[13px] font-bold leading-[2] text-black/60 md:max-w-md">
              সাধ্যের মধ্যে সেরা মানের পন্য আপনার ও আপনার পরিবারের জন্য, যা আমরা পাঠাই একদম মাঠ পর্যায় থেকে, তাই পাচ্ছেন সাশ্রয়ী দামে সেরা মানের পন্যের নিশ্চয়তা।
            </p>
            <div className="flex gap-6 items-center">
              <a href="https://www.facebook.com/WeAreMangoLover" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:opacity-80 transition-opacity">
                <img src="https://cdn.reicon.dev/logos/facebook/original.svg" alt="Facebook" width={20} height={20} className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/wearemangolover" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:opacity-80 transition-opacity">
                <img src="https://cdn.reicon.dev/logos/instagram/original.svg" alt="Instagram" width={20} height={20} className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@mango.lover.11" target="_blank" rel="noopener noreferrer" aria-label="Youtube" className="hover:opacity-80 transition-opacity">
                <img src="https://cdn.reicon.dev/logos/youtube/original.svg" alt="Youtube" width={24} height={24} className="w-6 h-6" />
              </a>
            </div>
            <div className="space-y-6 pt-2">
              <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-[#FBBB14] block [-webkit-text-stroke:1px_rgba(0,0,0,0.06)]">Newsletter</span>
              <div className="flex border-b border-black/10 pb-4">
                <input
                  type="email"
                  placeholder="JOIN THE ATELIER"
                  className="bg-transparent border-none outline-none flex-grow text-[9px] uppercase tracking-[0.4em] font-medium placeholder:text-black/20"
                />
                <button className="text-[9px] uppercase tracking-[0.4em] font-bold hover:text-brand-gold transition-colors">Join</button>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-x-8 gap-y-8">
            <div className="space-y-8">
              <span className="text-[28px] md:text-[22px] font-bold text-[#FBBB14] block">Information</span>
              <ul className="space-y-3 text-[15px] md:text-[15px] font-bold text-black">
                {INFORMATION_LINKS.map(([label, href]) => (
                  <li key={label}><Link href={href}><a className="hover:text-black transition-colors block">{label}</a></Link></li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <span className="text-[28px] md:text-[22px] font-bold text-[#FBBB14] block">Shop</span>
              <ul className="space-y-3 text-[17px] md:text-[15px] font-bold text-black">
                {visibleCollections.map(({ slug, label }) => (
                  <li key={slug}>
                    <Link href={`/collection/${slug}`}>
                      <a className="hover:text-black transition-colors block">{label}</a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <span className="text-[28px] md:text-[22px] font-bold text-[#FBBB14] block">Support</span>
              <ul className="space-y-3 text-[17px] md:text-[15px] font-bold text-black">
                {SUPPORT_LINKS.map(([label, href]) => (
                  <li key={label}><Link href={href}><a className="hover:text-black transition-colors block">{label}</a></Link></li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Decorative Divider + Brand Name + Trust Badges */}
        <div className="relative z-10 px-4 md:px-16 pt-10 pb-6 md:pt-12 md:pb-8">
          {/* Gold Divider */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16 bg-[#FBBB14]/40" />
            <div className="w-2 h-2 rotate-45 bg-[#FBBB14]/50" />
            <div className="h-px w-16 bg-[#FBBB14]/40" />
          </div>
          {/* Bengali Brand Name */}
          <p
            className="text-center text-[54px] md:text-[58px] font-bold text-[#FBBB14] mb-8 tracking-wide"
            style={{ fontFamily: "'IhtishamDeshlipi', serif" }}
          >
            ম্যাংগো লাভার
          </p>
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {[
              { icon: MoneyReceive, label: "ক্যাশ অন ডেলিভারি" },
              { icon: TruckFast, label: "দ্রুত ডেলিভারি" },
              { icon: ShieldTick, label: "নিরাপদ পেমেন্ট" },
              { icon: CheckCircle, label: "মান নিশ্চিত" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <Icon size={22} color="#FBBB14" weight="Outline" />
                <span
                  className="text-[11px] md:text-[12px] text-black/50 font-medium"
                  style={{ fontFamily: "'KaiumSimanto', serif" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 bg-transparent border-t border-black/10 px-4 sm:px-8 md:px-16 py-8">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-3 md:gap-6">
            <div className="text-center md:text-left">
              <a
                href="https://api.whatsapp.com/send/?phone=8801733670129"
                className="group inline-flex items-center gap-2 text-black transition-colors hover:text-[#163B33]"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FBBB14] transition-transform duration-300 group-hover:scale-125" />
                <span className="text-[7px] font-medium uppercase tracking-[0.28em] text-black/40">
                  Designed &amp; Developed by
                </span>
                <span
                  className="max-md:-translate-y-0.5 text-[14px] font-bold tracking-[0.12em] underline decoration-[#FBBB14] decoration-2 underline-offset-4 md:text-[13px]"
                  style={{ fontFamily: "'Garet', 'Space Grotesk', 'Inter', sans-serif" }}
                >
                  Arc Labs Corporation
                </span>
              </a>
              <span className="mt-2 block text-[8px] tracking-normal text-black/40">
                © 2026 ম্যাংগো লাভার - Mango Lover
              </span>
            </div>
            <div className="flex gap-8 text-[9px] uppercase tracking-[0.4em] text-black/40">
              <div className="flex items-center gap-2"><Globe className="w-3 h-3" /> Dhaka, Bangladesh</div>
              <div className="hidden md:flex items-center gap-2 font-modern">{time} BST</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
