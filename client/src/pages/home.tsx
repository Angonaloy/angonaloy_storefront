import Layout from "@/components/layout";
import HomeProductCard from "@/components/home-product-card";
import CollectionStories from "@/components/collection-stories";
import RecentlyViewed from "@/components/recently-viewed";
import {
  fetchStorefrontProducts,
  STOREFRONT_CATALOG_QUERY_OPTIONS,
  STOREFRONT_POLL_INTERVAL_MS,
} from "@/lib/storefront-products";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, BadgeCheck, HandCoins, Truck } from "lucide-react";
import { generatedStorefrontProducts } from "@/lib/generated-storefront-products";
import {
  getProductsForCollection,
  getTopSellingProducts,
  getVisibleFeaturedCollections,
} from "@/lib/featured-collections";

const SECTION_HEADING_CLASS_NAME =
  "font-bloop text-[clamp(2.4rem,7vw,4.75rem)] font-extrabold leading-[0.95] tracking-[-0.04em]";

const MARQUEE_PHRASES = [
  "Made for Home",
  "আঙ্গনালয়",
  "Everyday Living",
  "ক্যাশ অন ডেলিভারি",
  "দ্রুত ডেলিভারি",
  "নিরাপদ পেমেন্ট",
  "মান নিশ্চিত",
] as const;

const WHY_ANGONALOY_BENEFITS = [
  { icon: Truck, title: "Free shipping over ৳2600", bangla: "৳2600-এর বেশি অর্ডারে ফ্রি শিপিং" },
  { icon: HandCoins, title: "Cash on delivery", bangla: "ক্যাশ অন ডেলিভারি" },
  { icon: BadgeCheck, title: "Quality assured", bangla: "মান নিশ্চিত" },
] as const;

function SectionHeader({
  eyebrow,
  title,
  bangla,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  bangla?: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-center text-center md:mb-12">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-bloop-ink/70 md:text-[11px]">{eyebrow}</p>
      <h2 className={`mt-3 ${SECTION_HEADING_CLASS_NAME}`}>
        <span className="bloop-gradient-text">{title}</span>
      </h2>
      {bangla ? (
        <p className="mt-3 font-bangla text-[15px] font-medium text-bloop-ink/75 md:text-[17px]">{bangla}</p>
      ) : null}
      <Link
        href={href}
        className="bloop-pill mt-5 border-bloop-red bg-bloop-red px-8 py-2 text-[14px] text-white hover:border-bloop-ink hover:bg-bloop-ink md:text-[15px]"
      >
        {cta}
      </Link>
    </div>
  );
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    // Fallback: some mobile Safari engines never fire the initial
    // intersection callback, leaving content stuck at opacity:0 (blank page).
    // Reveal after a short delay so the page is never invisible.
    const fallback = window.setTimeout(() => setInView(true), 1000);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return [ref, inView] as const;
}

export default function Home() {
  const {
    data: catalogProducts = [],
    isError: isCatalogError,
    isLoading: isCatalogLoading,
  } = useQuery({
    queryKey: ["merchant-suite-products-listing"],
    queryFn: fetchStorefrontProducts,
    ...STOREFRONT_CATALOG_QUERY_OPTIONS,
    initialData: generatedStorefrontProducts,
    initialDataUpdatedAt: 0,
    refetchInterval: STOREFRONT_POLL_INTERVAL_MS,
  });
  const homepageProducts = catalogProducts.map((product) => {
    const snapshotProduct = generatedStorefrontProducts.find((snapshot) => snapshot.slug === product.slug);
    return product.compare_at_price == null && snapshotProduct?.compare_at_price != null
      ? { ...product, compare_at_price: snapshotProduct.compare_at_price }
      : product;
  });
  const topSellingProducts = getTopSellingProducts(homepageProducts);
  const visibleFeaturedCollections = getVisibleFeaturedCollections(catalogProducts);

  const transition = { duration: 1, ease: [0.25, 0.1, 0.25, 1] as const };

  const reveal = {
    hidden: { transform: "translateY(12px)", opacity: 0 },
    visible: { transform: "translateY(0)", opacity: 1 },
  };

  const [heroRef] = useReveal();
  const [whatsNewRef, whatsNewInView] = useReveal();
  const [latestDropRef, latestDropInView] = useReveal();
  const [editorialRef, editorialInView] = useReveal();
  const [essentialsRef, essentialsInView] = useReveal();
  const whatsNewGridRef = useRef<HTMLDivElement>(null);
  const benefitRailRef = useRef<HTMLDivElement>(null);
  const [activeBenefit, setActiveBenefit] = useState(0);

  const updateActiveBenefit = () => {
    const rail = benefitRailRef.current;
    if (!rail?.clientWidth) return;
    setActiveBenefit(Math.max(0, Math.min(WHY_ANGONALOY_BENEFITS.length - 1, Math.round(rail.scrollLeft / rail.clientWidth))));
  };

  const goToBenefit = (index: number) => {
    const rail = benefitRailRef.current;
    if (!rail) return;
    rail.scrollTo({ left: index * rail.clientWidth });
  };

  useEffect(() => {
    const grids = [whatsNewGridRef.current];
    const cleanups: Array<() => void> = [];
    for (const el of grids) {
      if (!el) continue;
      const onWheel = (event: WheelEvent) => {
        if (event.deltaX !== 0) return;
        const canScrollLeft = el.scrollLeft > 0;
        const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
        if ((event.deltaY > 0 && !canScrollRight) || (event.deltaY < 0 && !canScrollLeft)) {
          return;
        }
        event.preventDefault();
        el.scrollLeft += event.deltaY;
      };
      let startX = 0;
      let startY = 0;
      let startScrollLeft = 0;
      let dir: "v" | "h" | null = null;
      const onTouchStart = (event: TouchEvent) => {
        if (event.touches.length !== 1) {
          dir = null;
          return;
        }
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        startScrollLeft = el.scrollLeft;
        dir = null;
      };
      const onTouchMove = (event: TouchEvent) => {
        if (dir === null && event.touches.length === 1) {
          const dx = event.touches[0].clientX - startX;
          const dy = event.touches[0].clientY - startY;
          if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            dir = Math.abs(dy) > Math.abs(dx) ? "v" : "h";
          }
        }
        if (dir === "v") {
          el.scrollLeft = startScrollLeft;
        }
      };
      el.addEventListener("wheel", onWheel, { passive: false });
      el.addEventListener("touchstart", onTouchStart, { passive: true });
      el.addEventListener("touchmove", onTouchMove, { passive: true });
      cleanups.push(() => {
        el.removeEventListener("wheel", onWheel);
        el.removeEventListener("touchstart", onTouchStart);
        el.removeEventListener("touchmove", onTouchMove);
      });
    }
    return () => cleanups.forEach((fn) => fn());
  }, []);

  const renderProductGrid = (items: typeof homepageProducts, skeletonCount: number) => (
    <>
      {isCatalogLoading
        ? Array.from({ length: skeletonCount }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/5] animate-pulse rounded-[20px] bg-bloop-card motion-reduce:animate-none"
              aria-hidden="true"
            />
          ))
        : isCatalogError && catalogProducts.length === 0
          ? (
              <div className="col-span-full rounded-[20px] bg-bloop-card px-6 py-10 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-bloop-ink/70">Could not load products right now.</p>
                <p className="mt-2 text-xs text-bloop-ink/50">Please try again shortly.</p>
              </div>
            )
          : items.map((product) => <HomeProductCard key={product.id || product.slug} product={product} />)}
    </>
  );

  const renderCategorySection = (slug: string) => {
    const collection = visibleFeaturedCollections.find((item) => item.slug === slug);
    if (!collection) return null;

    const products = getProductsForCollection(homepageProducts, collection);
    const [englishLabel, bengaliLabel] = collection.label.split("-");

    return (
      <section key={collection.slug} className="w-full bg-bloop-cream pb-14 pt-6 md:pb-24 md:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-auto max-w-[1500px] px-3 md:px-8 xl:px-12"
        >
          <SectionHeader
            eyebrow="Shop by category"
            title={englishLabel}
            bangla={bengaliLabel}
            href={`/collection/${collection.slug}`}
            cta="View all"
          />

          <div className="grid grid-cols-2 gap-x-2 gap-y-6 md:gap-x-4 md:gap-y-10 lg:grid-cols-4">
            {renderProductGrid(products.slice(0, 4), Math.min(products.length || 4, 4))}
          </div>
        </motion.div>
      </section>
    );
  };

  return (
    <Layout>
      {/* Collection Stories Section */}
      <CollectionStories collections={visibleFeaturedCollections} products={homepageProducts} />

      {/* Hero Section */}
      <section className="w-full bg-bloop-cream pb-1 pt-7 md:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-auto flex max-w-[1200px] flex-col items-center px-1 text-center md:px-4"
        >
          {/* Mobile: each line is sized to span the viewport minus the 4px gutters the image mosaic uses. */}
          <h1 className="w-full font-bloop text-[length:calc((100vw-12px)*0.0798)] font-extrabold leading-[0.95] tracking-[-0.04em] md:w-auto md:text-[clamp(2.6rem,6.2vw,5.75rem)]">
            <span className="bloop-gradient-text block whitespace-nowrap md:inline md:whitespace-normal">Angonaloy—Made for Home</span>{" "}
            <span className="mt-1 block whitespace-nowrap font-bloop-serif text-[length:calc((100vw-12px)*0.1162)] font-normal tracking-[-0.02em] text-bloop-red md:whitespace-normal md:text-[length:1em]">
              and Everyday Living
            </span>
          </h1>
          <p className="mt-4 font-bangla text-[15px] font-medium text-bloop-ink/75 md:mt-5 md:text-[18px]">
            আপনার ঘর ও জীবনযাত্রার জন্য একটি সম্পূর্ণ সমাধান
          </p>
          <Link
            href="/products"
            className="bloop-pill mt-5 border-bloop-red px-10 py-2 text-[15px] text-bloop-red hover:bg-bloop-red hover:text-white md:mt-7 md:text-base"
          >
            Explore
          </Link>
        </motion.div>

        {/* Image mosaic */}
        <div
          ref={heroRef}
          className="mt-8 grid grid-cols-2 gap-1 px-1 md:mt-12 md:aspect-[2/1] md:grid-cols-4 md:grid-rows-2"
        >
          <Link
            href="/products"
            className="group relative col-span-2 block aspect-[4/5] overflow-hidden rounded-[28px] md:row-span-2 md:aspect-auto"
          >
            <img
              src="/hero-desktop.webp?v=2"
              alt="Angonaloy kitchen essentials on a sunny countertop"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover object-[48%_center] transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-black/45 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/30 to-transparent" aria-hidden="true" />
            <p className="absolute inset-x-0 top-6 px-6 text-center font-bloop text-[clamp(2rem,4.2vw,3.75rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-bloop-lime md:top-10">
              Everything for your kitchen
            </p>
            <span className="bloop-pill absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap border-bloop-lime bg-bloop-lime px-6 py-2 text-[14px] text-bloop-ink md:bottom-10 md:text-[15px]">
              Shop the collection
            </span>
          </Link>

          <Link
            href="/products"
            className="group relative block aspect-square overflow-hidden rounded-[28px] md:col-start-3 md:row-start-1 md:aspect-auto"
          >
            <img
              src="/pure-ghee-editorial-mobile-20260917.webp"
              alt="Angonaloy home and kitchen products"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-[72%_center] transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-4 flex flex-col items-center px-2 text-center text-white md:bottom-6">
              <span className="font-bloop text-[17px] font-bold leading-tight tracking-[-0.02em] md:text-[24px]">Home &amp; Kitchen</span>
              <span className="mt-1 text-[12px] font-semibold underline decoration-2 underline-offset-4 md:text-[14px]">Explore</span>
            </div>
          </Link>

          <Link
            href="/product/glass-water-bottles-with-time-marker"
            className="group relative block aspect-square overflow-hidden rounded-[28px] md:col-start-4 md:row-start-1 md:aspect-auto"
          >
            <img
              src="/glass-bottle-editorial-mobile-20260917.webp"
              alt="Glass Water Bottles With Time Marker"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-[40%_center] transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-4 flex flex-col items-center px-2 text-center text-white md:bottom-6">
              <span className="font-bloop text-[17px] font-bold leading-tight tracking-[-0.02em] md:text-[24px]">Glass Bottles</span>
              <span className="mt-1 text-[12px] font-semibold underline decoration-2 underline-offset-4 md:text-[14px]">Shop now</span>
            </div>
          </Link>

          <Link
            href="/collection/top-selling-products"
            className="group col-span-2 flex aspect-[2/1] flex-col items-center justify-center overflow-hidden rounded-[28px] bg-bloop-lime text-center md:col-start-3 md:row-start-2 md:aspect-auto"
          >
            <span className="font-bloop text-[clamp(3rem,7vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em] text-bloop-purple transition-transform duration-500 group-hover:scale-[1.03]">
              Best
              <br />
              Sellers
            </span>
            <span className="mt-3 font-bangla text-[14px] font-semibold text-bloop-purple/80 md:text-[17px]">সেরা বিক্রিত পণ্য</span>
          </Link>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="w-full bg-bloop-cream pb-14 pt-16 md:pb-24 md:pt-24">
        <motion.div
          ref={whatsNewRef}
          className="mx-auto max-w-[1500px] px-3 md:px-8 xl:px-12"
          initial="hidden"
          animate={whatsNewInView ? "visible" : "hidden"}
          transition={{ staggerChildren: 0.12 }}
        >
          <motion.div variants={reveal} transition={transition}>
            <SectionHeader
              eyebrow="Popular choice"
              title="Best Sellers"
              bangla="সবচেয়ে জনপ্রিয় পণ্য"
              href="/collection/top-selling-products"
              cta="View all"
            />
          </motion.div>

          <motion.div
            ref={whatsNewGridRef}
            transition={{ staggerChildren: 0.08 }}
            className="grid grid-cols-2 gap-x-2 gap-y-6 md:gap-x-4 md:gap-y-10 lg:grid-cols-4"
          >
            {renderProductGrid(topSellingProducts.slice(0, 8), 8)}
          </motion.div>
        </motion.div>
      </section>

      {/* Highlights Section */}
      <section className="w-full overflow-hidden bg-[linear-gradient(90deg,#6CF7B2,#C9F77A,#FFF35C)] pt-14 md:pt-24">
        <motion.div
          ref={editorialRef}
          className="mx-auto max-w-[1200px] px-4 text-center md:px-8"
          initial="hidden"
          animate={editorialInView ? "visible" : "hidden"}
          transition={{ staggerChildren: 0.12 }}
        >
          <motion.p variants={reveal} transition={transition} className="text-[10px] font-semibold uppercase tracking-[0.28em] text-bloop-purple/80 md:text-[11px]">
            Highlights
          </motion.p>
          <motion.h2 variants={reveal} transition={transition} className={`mt-3 text-bloop-purple ${SECTION_HEADING_CLASS_NAME}`}>
            Why Angonaloy
          </motion.h2>
          <div
            ref={benefitRailRef}
            onScroll={updateActiveBenefit}
            role="region"
            aria-label="Why Angonaloy benefits"
            tabIndex={0}
            className="no-scrollbar mt-10 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain motion-safe:scroll-smooth md:mt-14 md:grid md:grid-cols-3 md:gap-10 md:overflow-visible"
          >
            {WHY_ANGONALOY_BENEFITS.map(({ icon: Icon, title, bangla }) => (
              <motion.div key={title} variants={reveal} transition={transition} className="w-full shrink-0 snap-start flex flex-col items-center md:min-w-0">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-bloop-purple text-bloop-lime">
                  <Icon className="h-7 w-7" strokeWidth={1.75} />
                </span>
                <p className="mt-4 font-bloop text-[22px] font-bold leading-tight tracking-[-0.03em] text-bloop-purple md:text-[26px]">{title}</p>
                <p className="mt-1 font-bangla text-[15px] font-medium text-bloop-purple/75">{bangla}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 flex items-center md:hidden">
            {WHY_ANGONALOY_BENEFITS.map(({ title }, index) => (
              <button
                key={title}
                type="button"
                onClick={() => goToBenefit(index)}
                aria-label={`Go to benefit ${index + 1}`}
                aria-current={activeBenefit === index ? "true" : undefined}
                className="flex h-5 flex-1 items-center"
              >
                <span
                  aria-hidden="true"
                  className={`block h-[2px] w-full transition-colors duration-300 ${
                    activeBenefit === index ? "bg-bloop-purple" : "bg-bloop-purple/15"
                  }`}
                />
              </button>
            ))}
          </div>
        </motion.div>
        <div className="mt-14 overflow-hidden border-t-2 border-bloop-purple/15 py-5 md:mt-20 md:py-7" aria-hidden="true">
          <div className="bloop-marquee">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center">
                {MARQUEE_PHRASES.map((phrase) => (
                  <span key={phrase} className="flex items-center whitespace-nowrap font-bloop text-[28px] font-extrabold tracking-[-0.03em] text-bloop-purple md:text-[44px]">
                    <span className={/[ঀ-৿]/.test(phrase) ? "font-bangla" : undefined}>{phrase}</span>
                    <span className="mx-6 text-bloop-red md:mx-10">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Drop Section */}
      <section className="w-full bg-bloop-cream py-14 md:py-24">
        <motion.div
          ref={latestDropRef}
          className="mx-auto max-w-[1500px] px-3 md:px-8 xl:px-12"
          initial="hidden"
          animate={latestDropInView ? "visible" : "hidden"}
          transition={{ staggerChildren: 0.12 }}
        >
          <motion.div variants={reveal} transition={transition}>
            <SectionHeader
              eyebrow="Just in"
              title="New Arrivals"
              bangla="আমাদের নতুন পণ্য"
              href="/products"
              cta="See more"
            />
          </motion.div>

          <motion.div
            transition={{ staggerChildren: 0.08 }}
            className="grid grid-cols-2 gap-x-2 gap-y-6 md:gap-x-4 md:gap-y-10 lg:grid-cols-4"
          >
            {renderProductGrid(homepageProducts.slice(0, 4), 4)}
          </motion.div>
        </motion.div>
      </section>

      {/* Shop By Category Section */}
      <section className="w-full bg-bloop-cream pb-14 md:pb-24">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-bloop-ink/70 md:text-[11px]">
            Shop by category
          </p>
          <ul className="mt-6 border-t border-bloop-red/20 md:mt-10">
            {visibleFeaturedCollections.map((collection) => {
              const [englishLabel, bengaliLabel] = collection.label.split("-");
              return (
                <li key={collection.slug} className="border-b border-bloop-red/20">
                  <Link
                    href={`/collection/${collection.slug}`}
                    className="group flex items-center justify-between gap-4 py-4 md:py-6"
                  >
                    <span className="min-w-0">
                      <span className="block font-bloop text-[clamp(2rem,6.4vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-bloop-red transition-colors group-hover:text-bloop-orange">
                        {englishLabel}
                      </span>
                      {bengaliLabel ? (
                        <span className="mt-1 block font-bangla text-[14px] font-medium text-bloop-ink/60 md:text-[16px]">{bengaliLabel}</span>
                      ) : null}
                    </span>
                    <ArrowUpRight className="h-7 w-7 shrink-0 text-bloop-red transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 md:h-12 md:w-12" strokeWidth={1.5} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-8 flex justify-center md:mt-12">
            <Link
              href="/products"
              className="bloop-pill border-bloop-red px-10 py-2 text-[15px] text-bloop-red hover:bg-bloop-red hover:text-white"
            >
              View all
            </Link>
          </div>
        </div>
      </section>

      {/* Category Section: Homemade */}
      {renderCategorySection("homemade")}

      {/* Category Section: Functional Food */}
      {renderCategorySection("functional-food")}

      {/* Category Section: Honey */}
      {renderCategorySection("honey")}

      {/* Editorial Section */}
      <section className="w-full bg-bloop-purple px-3 py-10 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-[1400px] items-center gap-8 md:grid-cols-2 md:gap-12">
          <Link
            href="/products"
            aria-label="Explore Angonaloy home and kitchen products"
            className="group block overflow-hidden rounded-[28px]"
          >
            <picture>
              <source media="(min-width: 768px)" srcSet="/pure-ghee-editorial-desktop-20260917.webp" />
              <img
                src="/pure-ghee-editorial-mobile-20260917.webp"
                alt="Explore all Angonaloy products"
                loading="lazy"
                className="block aspect-square w-full object-cover object-[70%_center] transition-transform duration-700 group-hover:scale-[1.03] md:aspect-[4/3]"
              />
            </picture>
          </Link>
          <div className="flex flex-col items-center px-2 pb-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-bloop-lime/80 md:text-[11px]">Angonaloy home &amp; kitchen</p>
            <h2 className={`mt-4 bg-[linear-gradient(90deg,#6CF7B2,#E8F78F)] bg-clip-text text-transparent ${SECTION_HEADING_CLASS_NAME}`}>
              For the Heart of Home
            </h2>
            <p className="mt-5 max-w-md font-bangla text-[16px] font-medium leading-relaxed text-bloop-cream/85 md:text-[18px]">
              ঘর ও রান্নাঘরের প্রতিদিনের জন্য বেছে নেওয়া সুন্দর, দরকারি জিনিস।
            </p>
            <Link
              href="/products"
              className="bloop-pill mt-7 border-bloop-lime bg-bloop-lime px-10 py-2 text-[15px] text-bloop-purple hover:border-bloop-cream hover:bg-bloop-cream"
            >
              Explore
            </Link>
          </div>
        </div>
      </section>

      {/* Category Section: Oil & Ghee */}
      {renderCategorySection("oil-and-ghee")}

      {/* Category Section: Jaggery */}
      {renderCategorySection("jaggery")}

      {/* Essentials Section */}
      <section className="w-full bg-bloop-cream px-1 pb-14 md:pb-24">
        <motion.div
          ref={essentialsRef}
          initial="hidden"
          animate={essentialsInView ? "visible" : "hidden"}
          transition={{ staggerChildren: 0.12 }}
          className="grid overflow-hidden rounded-[28px] bg-bloop-lime md:grid-cols-2"
        >
          <motion.div variants={reveal} transition={transition} className="order-2 flex flex-col items-center justify-center px-6 py-10 text-center md:order-1 md:px-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-bloop-purple/80 md:text-[11px]">Everyday essentials</p>
            <h2 className={`mt-4 text-bloop-purple ${SECTION_HEADING_CLASS_NAME}`}>
              Hydrate with Intention
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-bloop-ink/80 md:text-base">
              A beautiful daily ritual for home, work, and everywhere in between.
            </p>
            <Link
              href="/product/glass-water-bottles-with-time-marker"
              className="bloop-pill mt-7 border-bloop-red bg-bloop-red px-8 py-2 text-[15px] text-white hover:border-bloop-purple hover:bg-bloop-purple"
            >
              Shop glass bottles
            </Link>
          </motion.div>
          <Link
            href="/product/glass-water-bottles-with-time-marker"
            aria-label="View Glass Water Bottles With Time Marker"
            className="group order-1 block overflow-hidden md:order-2"
          >
            <picture>
              <source media="(min-width: 768px)" srcSet="/glass-bottle-editorial-desktop-20260917.webp" />
              <img
                src="/glass-bottle-editorial-mobile-20260917.webp"
                alt="Glass Water Bottles With Time Marker"
                loading="lazy"
                className="block aspect-square h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] md:aspect-[4/3]"
              />
            </picture>
          </Link>
        </motion.div>
      </section>

      {/* Category Section: Semai */}
      {renderCategorySection("semai")}

      {/* Category Section: Nuts & Seeds */}
      {renderCategorySection("nuts-and-seeds")}

      <RecentlyViewed products={homepageProducts} />

    </Layout>
  );
}
