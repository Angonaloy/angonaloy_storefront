import Layout from "@/components/layout";
import HomeProductCard from "@/components/home-product-card";
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
import { generatedStorefrontProducts } from "@/lib/generated-storefront-products";
import {
  getProductsForCollection,
  getTopSellingProducts,
  getVisibleFeaturedCollections,
} from "@/lib/featured-collections";

function HighlightedWord({
  children,
  className = "",
  highlightColor = "#FBBB14",
}: {
  children: string;
  className?: string;
  highlightColor?: string;
}) {
  return (
    <motion.span
      className={`inline ${className}`}
      style={{
        backgroundImage: `linear-gradient(${highlightColor}, ${highlightColor})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0% 0%",
        backgroundSize: "100% 100%",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
      }}
      initial={{ backgroundSize: "0% 100%" }}
      animate={{ backgroundSize: "100% 100%" }}
      transition={{ type: "spring", duration: 1, bounce: 0 }}
    >
      {children}
    </motion.span>
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
  const categoriesRef = useRef<HTMLDivElement>(null);
  const whatsNewGridRef = useRef<HTMLDivElement>(null);

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

  const renderCategorySection = (slug: string) => {
    const collection = visibleFeaturedCollections.find((item) => item.slug === slug);
    if (!collection) return null;

    const products = getProductsForCollection(homepageProducts, collection);
    const [englishLabel, bengaliLabel] = collection.label.split("-");

    return (
      <section key={collection.slug} className="w-full bg-[#f6f6f6] pb-12 pt-2 md:pb-20 md:pt-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-auto max-w-[1500px] px-4 md:px-8 xl:px-12"
        >
          <div className="mb-7 flex items-center justify-between gap-6 md:mb-12">
            <h2 className="font-inter-28pt-semibold text-[clamp(1.35rem,3.6vw,2.15rem)] leading-none tracking-normal text-black [-webkit-text-stroke:0.25px_currentColor] md:text-[clamp(1.5rem,3.9vw,2.35rem)]">
              <span>{englishLabel}</span>-
              <HighlightedWord className="font-display italic" highlightColor="#FBBB14">{bengaliLabel}</HighlightedWord>
            </h2>
            <Link
              href={`/collection/${collection.slug}`}
              className="shrink-0 border-b-2 border-black pb-1 text-[15px] font-medium text-black transition-opacity hover:opacity-60 md:text-[18px]"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
            {isCatalogLoading
              ? Array.from({ length: Math.min(products.length || 4, 4) }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-[3/4] animate-pulse bg-[#e5e5e5] motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ))
              : isCatalogError && catalogProducts.length === 0
                ? (
                    <div className="col-span-full border border-black/10 bg-white px-6 py-10 text-center">
                      <p className="text-sm uppercase tracking-[0.2em] text-black/60">Could not load products right now.</p>
                      <p className="mt-2 text-xs text-black/40">Please try again shortly.</p>
                    </div>
                  )
                : products.slice(0, 4).map((product) => <HomeProductCard key={product.id || product.slug} product={product} />)}
          </div>
        </motion.div>
      </section>
    );
  };

  useEffect(() => {
    const el = categoriesRef.current;
    if (!el) return;

    let paused = false;
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    const advance = () => {
      if (paused || el.scrollWidth <= el.clientWidth) return;
      const step = Math.max(el.clientWidth * 0.34, 104);
      const nextPosition = el.scrollLeft + step;
      el.scrollTo({ left: nextPosition >= el.scrollWidth - el.clientWidth ? 0 : nextPosition, behavior: "smooth" });
    };
    const intervalId = window.setInterval(advance, 2500);

    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume, { passive: true });

    return () => {
      window.clearInterval(intervalId);
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="w-full bg-[#f6f6f6] pt-0 pb-0">
        <div className="relative w-full px-4 pt-4 md:px-0 md:pt-0">
          <div
            ref={heroRef}
            className="relative z-10 aspect-[940/1080] w-full overflow-hidden rounded-none border border-black/10 bg-white md:aspect-auto md:min-h-[600px] md:rounded-[6px]"
          >
            <Link href="/products" className="absolute inset-0 block">
              <img
                src="/hero-mango-lover.webp?v=2"
                alt="ম্যাংগো লাভার — বাংলার সেরা সকল মৌসুমি আম, সরাসরি বাগান থেকে আপনার ঘরে"
                className="h-full w-full object-cover object-top md:hidden"
              />
              <img
                src="/hero-desktop.webp"
                alt="ম্যাংগো লাভার — বাংলার সেরা সকল মৌসুমি আম, সরাসরি বাগান থেকে আপনার ঘরে"
                className="hidden md:block h-full w-full object-cover object-top"
              />
            </Link>
            {/* Foggy gradient bottom blend */}
            <div
              className="absolute bottom-0 left-0 right-0 h-32 md:h-48 pointer-events-none"
              style={{ background: "linear-gradient(to top, #f6f6f6 0%, #f6f6f6 15%, transparent 100%)" }}
            />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 z-30 w-px bg-black/10 md:hidden" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 z-30 w-px bg-black/10 md:hidden" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-4 z-30 h-px bg-black/10 md:hidden" />
        </div>
      </section>

      {/* Categories Section */}
      <section className="w-full bg-[#f5f5f5] pb-2 pt-8 md:pb-3 md:pt-12">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8 xl:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center"
          >
            <h2 className="font-inter-28pt-semibold text-[clamp(1.35rem,3.6vw,2.15rem)] leading-[1.1] tracking-normal text-black [-webkit-text-stroke:0.25px_currentColor] md:text-[clamp(1.5rem,3.9vw,2.35rem)] md:leading-none">
              <HighlightedWord className="font-display italic text-[1.65rem] leading-none md:text-[clamp(1.5rem,3.9vw,2.35rem)]" highlightColor="#FBBB14">আমাদের ক্যাটাগরিসমূহ</HighlightedWord>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.05 }}
            ref={categoriesRef}
            className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:mx-auto sm:max-w-[820px] sm:grid sm:grid-cols-4 sm:gap-x-6 sm:gap-y-8 sm:overflow-visible sm:pb-0 lg:max-w-none lg:flex lg:justify-center lg:overflow-visible"
          >
            {visibleFeaturedCollections.map(({ slug, label, image }, index) => {
              const featuredCategoryLabel = slug === "functional-food" ? "Functional-ফুড" : label;

              return (
                <Link
                  key={label}
                  href={`/collection/${slug}`}
                  className="group flex w-[96px] shrink-0 snap-start flex-col items-center text-center sm:w-auto"
                >
                  <div className="aspect-square w-[104px] overflow-hidden rounded-full sm:w-[112px]">
                    <img
                      src={image}
                      alt={label}
                      loading={index < 4 ? "eager" : "lazy"}
                      fetchPriority={index < 4 ? "high" : "auto"}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                  <span className="mt-3 block text-center text-[13px] font-semibold leading-tight tracking-[0.01em] text-black/80 transition-colors duration-300 group-hover:text-black md:text-[14px]">
                    {featuredCategoryLabel.includes("-") ? (
                      <>
                        <span className="block md:inline">{featuredCategoryLabel.split("-")[0]}</span>
                        <span className="hidden md:inline">-</span>
                        <span className="block md:inline">{featuredCategoryLabel.split("-")[1]}</span>
                      </>
                    ) : (
                      <span>{featuredCategoryLabel}</span>
                    )}
                  </span>
                </Link>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* What's New Section */}
      <section className="w-full overflow-hidden bg-[#f6f6f6] pb-10 pt-4 md:py-16">
        <motion.div
          ref={whatsNewRef}
          className="mx-auto max-w-[1500px] px-4 md:px-8 xl:px-12"
          initial="hidden"
          animate={whatsNewInView ? "visible" : "hidden"}
          transition={{ staggerChildren: 0.12 }}
        >
          <motion.div
            variants={reveal}
            transition={transition}
            className="mb-7 flex items-center justify-between gap-2 overflow-visible md:mb-12 md:gap-4"
          >
            <h2 className="font-inter-28pt-semibold text-[clamp(1.35rem,3.6vw,2.15rem)] leading-[1.1] tracking-normal text-black [-webkit-text-stroke:0.25px_currentColor] md:text-[clamp(1.5rem,3.9vw,2.35rem)] md:leading-none">
              <span className="block md:inline">BEST SELLERS</span>
              <span className="hidden md:inline">-</span>
              <span className="mt-1 block md:ml-1 md:mt-0 md:inline">
                <HighlightedWord className="font-display italic text-[1.65rem] leading-none md:text-[clamp(1.5rem,3.9vw,2.35rem)]" highlightColor="#FBBB14">সবচেয়ে জনপ্রিয়</HighlightedWord>
              </span>
            </h2>
            <Link
              href="/products"
              className="shrink-0 border-b-2 border-black pb-1 text-[15px] font-medium text-black transition-opacity hover:opacity-60 md:text-[18px]"
            >
              View All
            </Link>
          </motion.div>

          <motion.div
            ref={whatsNewGridRef}
            transition={{ staggerChildren: 0.08 }}
            className="mt-8 grid grid-cols-2 gap-2 md:mt-12 md:gap-4 lg:grid-cols-4"
          >
            {isCatalogLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-[3/4] animate-pulse bg-[#e5e5e5] motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ))
              : isCatalogError && catalogProducts.length === 0
                ? (
                    <div className="w-full border border-black/10 bg-white px-6 py-10 text-center">
                      <p className="text-sm uppercase tracking-[0.2em] text-black/60">Could not load products right now.</p>
                      <p className="mt-2 text-xs text-black/40">Please try again shortly.</p>
                    </div>
                  )
                : topSellingProducts.slice(0, 6).map((product) => <HomeProductCard key={product.id || product.slug} product={product} />)}
          </motion.div>
        </motion.div>
      </section>

      {/* Latest Drop Section */}
      <section className="w-full bg-[#f6f6f6] py-10 md:py-16">
        <motion.div
          ref={latestDropRef}
          className="mx-auto max-w-[1500px] px-4 md:px-8 xl:px-12"
          initial="hidden"
          animate={latestDropInView ? "visible" : "hidden"}
          transition={{ staggerChildren: 0.12 }}
        >
          <motion.div
            variants={reveal}
            transition={transition}
            className="mb-7 flex items-center justify-between gap-6 md:mb-12"
          >
            <motion.h2
              className="font-inter-28pt-semibold text-[clamp(1.35rem,3.6vw,2.15rem)] leading-none tracking-normal text-black [-webkit-text-stroke:0.25px_currentColor] md:text-[clamp(1.5rem,3.9vw,2.35rem)]"
            >
              <span className="block md:inline">NEWLY ADDED</span>
              <span className="hidden md:inline">-</span>
              <span className="mt-1 block md:ml-1 md:mt-0 md:inline">
                <HighlightedWord className="font-display italic text-[1.65rem] md:text-[clamp(1.5rem,3.9vw,2.35rem)]" highlightColor="#FBBB14">আমাদের নতুন পণ্য</HighlightedWord>
              </span>
            </motion.h2>

            <Link
              href="/products"
              className="shrink-0 border-b-2 border-black pb-1 text-[15px] font-medium text-black transition-opacity hover:opacity-60 md:text-[18px]"
            >
              See More
            </Link>
          </motion.div>

          <motion.div
            transition={{ staggerChildren: 0.08 }}
            className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4"
          >
            {isCatalogLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-[3/4] animate-pulse bg-[#e5e5e5] motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ))
              : isCatalogError && catalogProducts.length === 0
                ? (
                    <div className="col-span-full border border-black/10 bg-white px-6 py-10 text-center">
                      <p className="text-sm uppercase tracking-[0.2em] text-black/60">Could not load products right now.</p>
                      <p className="mt-2 text-xs text-black/40">Please try again shortly.</p>
                    </div>
                  )
                : homepageProducts.slice(0, 4).map((product) => <HomeProductCard key={product.id || product.slug} product={product} />)}
          </motion.div>
        </motion.div>
      </section>

      {/* Category Section: Homemade */}
      {renderCategorySection("homemade")}

      {/* Category Section: Functional Food */}
      {renderCategorySection("functional-food")}

      {/* Category Section: Honey */}
      {renderCategorySection("honey")}

      {/* Editorial Section */}
      <section className="w-full bg-[#f6f6f6]">
        <motion.div
          ref={editorialRef}
          className="w-full"
          initial="hidden"
          animate={editorialInView ? "visible" : "hidden"}
          transition={{ staggerChildren: 0.12 }}
        >
          <div className="relative w-full overflow-hidden">
            <img
              src="/curated-edit-bg-mobile.webp"
              alt="Editorial collection"
              loading="lazy"
              className="w-full object-cover md:hidden"
            />
            <img
              src="/curated-edit-bg.webp"
              alt="Editorial collection"
              loading="lazy"
              className="hidden md:block w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center">
              <motion.h2
                variants={reveal}
                transition={transition}
                className="font-inter-28pt-semibold text-[clamp(1.35rem,3.6vw,2.15rem)] leading-none tracking-normal text-white [-webkit-text-stroke:0.25px_currentColor] md:text-[clamp(1.5rem,3.9vw,2.35rem)]"
              >
                <HighlightedWord highlightColor="#F4A261">PURE GHEE</HighlightedWord>
              </motion.h2>
              <motion.p
                variants={reveal}
                transition={transition}
                className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 md:text-base"
                style={{ fontFamily: "'IhtishamDeshlipi', serif" }}
              >
                উন্নত মানের দুধ থেকে তৈরি, সমৃদ্ধ স্বাদ ও সুগন্ধের খাঁটি ঘি
              </motion.p>
              <motion.div variants={reveal} transition={transition} className="mt-8">
                <Link
                  href="/product/pure-ghee"
                  className="border-b-2 border-white pb-1 text-[18px] font-medium text-white transition-opacity hover:opacity-60 md:text-lg"
              >
                Shop Now
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Category Section: Oil & Ghee */}
      {renderCategorySection("oil-and-ghee")}

      {/* Category Section: Jaggery */}
      {renderCategorySection("jaggery")}

      {/* Essentials Section */}
      <section className="w-full bg-[#f6f6f6] pb-12 pt-2 md:pb-20 md:pt-4">
        <motion.div
          ref={essentialsRef}
          className="w-full"
          initial="hidden"
          animate={essentialsInView ? "visible" : "hidden"}
          transition={{ staggerChildren: 0.12 }}
        >
          <div className="relative w-full overflow-hidden">
            <img
              src="/essentials-bg-mobile.webp"
              alt="Daily essentials"
              loading="lazy"
              className="w-full object-cover md:hidden"
            />
            <img
              src="/essentials-bg.webp"
              alt="Daily essentials"
              loading="lazy"
              className="hidden md:block w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center">
              <motion.h2
                variants={reveal}
                transition={transition}
                className="font-inter-28pt-semibold text-[clamp(1.35rem,3.6vw,2.15rem)] leading-none tracking-normal text-white [-webkit-text-stroke:0.25px_currentColor] md:text-[clamp(1.5rem,3.9vw,2.35rem)]"
              >
                <span>BLACK SEED</span>{" "}
                <HighlightedWord highlightColor="#B8D8BA">MIX</HighlightedWord>
              </motion.h2>
              <motion.p
                variants={reveal}
                transition={transition}
                className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 md:text-base"
                style={{ fontFamily: "'IhtishamDeshlipi', serif" }}
              >
                প্রাকৃতিক কালোজিরার গুণে তৈরি, অনন্য স্বাদ ও পুষ্টিগুণে ভরপুর স্বাস্থ্যকর মিশ্রণ
              </motion.p>
              <motion.div variants={reveal} transition={transition} className="mt-8">
                <Link
                  href="/product/kalojira-mixed"
                  className="border-b-2 border-white pb-1 text-[18px] font-medium text-white transition-opacity hover:opacity-60 md:text-lg"
                >
                  Shop Now
                </Link>
              </motion.div>
            </div>
          </div>
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
