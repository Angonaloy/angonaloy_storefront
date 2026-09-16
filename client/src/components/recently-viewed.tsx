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
    <section className={`w-full bg-[#f6f6f6] py-10 md:py-16 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="mx-auto max-w-[1500px] px-2.5 md:px-8 xl:px-12"
      >
        <div className="mb-7 flex items-center justify-between gap-4 md:mb-12">
          <h2 className="font-inter-28pt-semibold text-[clamp(1.5rem,4vw,2.4rem)] leading-none tracking-normal text-black [-webkit-text-stroke:0.25px_currentColor]">
            <span>RECENTLY</span>{" "}
            <span
              className="inline-block bg-[#FBBB14] px-1"
              aria-label="Recently Viewed"
            >
              VIEWED
            </span>
          </h2>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Previous recently viewed products"
              aria-controls="recently-viewed-products"
              onClick={() => scrollByPage(-1)}
              disabled={!canScrollLeft}
              className="flex h-9 w-9 items-center justify-center border border-black/20 text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black md:h-11 md:w-11"
            >
              <ChevronLeft aria-hidden="true" size={18} strokeWidth={1.25} />
            </button>
            <button
              type="button"
              aria-label="Next recently viewed products"
              aria-controls="recently-viewed-products"
              onClick={() => scrollByPage(1)}
              disabled={!canScrollRight}
              className="flex h-9 w-9 items-center justify-center border border-black/20 text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black md:h-11 md:w-11"
            >
              <ChevronRight aria-hidden="true" size={18} strokeWidth={1.25} />
            </button>
          </div>
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
      </motion.div>
    </section>
  );
}
