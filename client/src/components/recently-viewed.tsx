import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import HomeProductCard from "@/components/home-product-card";
import {
  getRecentlyViewedProducts,
  useRecentlyViewedSlugs,
} from "@/lib/recently-viewed";
import type { StorefrontProduct } from "@/lib/storefront-products";

type RecentlyViewedProps = {
  products: StorefrontProduct[];
  excludeSlug?: string;
  className?: string;
};

export default function RecentlyViewed({ products, excludeSlug, className = "" }: RecentlyViewedProps) {
  const slugs = useRecentlyViewedSlugs();
  const recentProducts = getRecentlyViewedProducts(products, slugs, excludeSlug);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    setCanScrollLeft(carousel.scrollLeft > 1);
    setCanScrollRight(carousel.scrollLeft < carousel.scrollWidth - carousel.clientWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      carousel.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [recentProducts.length, updateScrollState]);

  if (recentProducts.length === 0) return null;

  const scrollByPage = (direction: -1 | 1) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({ left: direction * carousel.clientWidth, behavior: "smooth" });
  };

  return (
    <section className={`w-full -mb-20 bg-bloop-cream pb-8 pt-0 md:mb-0 md:py-24 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="mx-auto max-w-[1500px] px-3 md:px-8 xl:px-12"
      >
        <div className="mb-8 text-center md:mb-12">
          <h2 className="font-bloop text-[clamp(2.4rem,7vw,4.75rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
            <span className="bloop-gradient-text">Recently viewed</span>
          </h2>
          <p className="mt-3 font-bangla text-[15px] font-medium text-bloop-ink/75 md:text-[17px]">আপনি সম্প্রতি দেখেছেন</p>
        </div>

        <div
          ref={carouselRef}
          id="recently-viewed-products"
          className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain md:gap-4"
        >
          {recentProducts.map((product) => (
            <HomeProductCard
              key={product.slug}
              product={product}
              className="min-w-0 shrink-0 basis-[calc((100%_-_0.5rem)_/_2)] snap-start md:basis-[calc((100%_-_3rem)_/_4)]"
            />
          ))}
        </div>
        <div className="mt-8 flex items-center justify-center gap-3 md:mt-12">
          <button
            type="button"
            aria-label="Previous recently viewed products"
            aria-controls="recently-viewed-products"
            onClick={() => scrollByPage(-1)}
            disabled={!canScrollLeft}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-bloop-red text-white transition-colors hover:bg-bloop-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-bloop-red"
          >
            <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Next recently viewed products"
            aria-controls="recently-viewed-products"
            onClick={() => scrollByPage(1)}
            disabled={!canScrollRight}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-bloop-red text-white transition-colors hover:bg-bloop-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-bloop-red"
          >
            <ChevronRight aria-hidden="true" size={20} strokeWidth={1.75} />
          </button>
        </div>
      </motion.div>
    </section>
  );
}
