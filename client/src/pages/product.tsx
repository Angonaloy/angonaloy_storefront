import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, Phone, ChevronLeft, ChevronRight, Minus, Play, Plus } from "lucide-react";
import { ShoppingBag, ClipboardCheck } from "reicon-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import HomeProductCard from "@/components/home-product-card";
import RecentlyViewed from "@/components/recently-viewed";
import { useCart } from "@/contexts/cart-context";
import Layout from "@/components/layout";
import OrderDialog, { type OrderDialogBundle } from "@/components/order-dialog";
import { createEventId, trackMetaEvent } from "@/lib/meta";
import { toGoogleAnalyticsItem, trackGoogleEcommerceEvent } from "@/lib/google-analytics";
import { getProductDetailSections } from "@/lib/product-details";
import { Counter } from "@/components/ui/animated-counter";
import {
  fetchStorefrontProduct,
  fetchStorefrontProductInventory,
  fetchStorefrontProducts,
  findGeneratedStorefrontProduct,
  formatProductPrice,
  getCachedStorefrontProduct,
  getProductGallery,
  getProductImage,
  getProductNumericId,
  isProductOrderable,
  mergeInventory,
  removeCachedStorefrontProduct,
  setCachedStorefrontProduct,
  STOREFRONT_CATALOG_QUERY_OPTIONS,
  STOREFRONT_POLL_INTERVAL_MS,
  type StorefrontProduct,
} from "@/lib/storefront-products";
import { generatedStorefrontProducts } from "@/lib/generated-storefront-products";
import { recordRecentlyViewedSlug } from "@/lib/recently-viewed";

// Use the direct catalog image URL. Vercel's image optimizer currently
// rejects these Supabase URLs in production (INVALID_IMAGE_OPTIMIZE_REQUEST),
// so we skip it and rely on Supabase's own CDN.
const optimizedImage = (url: string | null | undefined) => url ?? "";

const transition = { duration: 1, ease: [0.25, 0.1, 0.25, 1] as const };
const reveal = {
  hidden: { filter: "blur(2px)", transform: "translateY(20%)", opacity: 0 },
  visible: { filter: "blur(0)", transform: "translateY(0)", opacity: 1 },
};

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

function getMerchantSlug(slug: string) {
  return slug || "";
}

const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;

function toBengaliNumeral(value: number) {
  return String(value)
    .split("")
    .map((digit) => BENGALI_DIGITS[Number(digit)] ?? digit)
    .join("");
}

function formatTimelineDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ProductSkeleton() {
  return (
    <div className="min-h-screen bg-brand-ivory">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 bg-brand-ivory p-[10px] md:p-16 xl:p-20">
          <div className="mx-auto aspect-square w-full max-w-[1080px] animate-pulse rounded-[8px] bg-[#ededed]" />
        </div>
        <div className="lg:col-span-5 flex flex-col gap-5 bg-brand-ivory p-8 md:p-16">
          <div className="h-9 w-2/3 animate-pulse rounded bg-[#ededed]" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-[#ededed]" />
          <div className="mt-4 h-12 w-1/2 animate-pulse rounded-[4px] bg-[#ededed]" />
          <div className="mt-8 h-12 w-full animate-pulse rounded-[4px] bg-black/10" />
        </div>
      </div>
    </div>
  );
}

// Poster stills are derived once at module load, and requested at a small width so
// phones download a thumbnail rather than a full-size frame extraction.
const REEL_MEDIA = [
  "https://res.cloudinary.com/n0d6bs08/video/upload/f_auto,q_auto/AQP0F3rOkxkmZAypesPlDQOTocYaBtrkDIqDQ12tOOwJ7ktCVtdtP-R7iFbrgWWcfl8yM5zWtDLpiUVM-bfCBhyKDbRxOu6YwGzciKxZiepGdw.mp4",
  "https://res.cloudinary.com/n0d6bs08/video/upload/f_auto,q_auto/snapsave-app_1C33w5xnV7_hd.mp4",
  "https://res.cloudinary.com/n0d6bs08/video/upload/f_auto,q_auto/snapsave-app_1700766014578997_hd.mp4",
].map((src) => ({
  src,
  poster: src.replace("/f_auto,q_auto/", "/so_1,w_480,f_auto,q_auto/").replace(".mp4", ".jpg"),
}));

const HONEY_NUT_REEL_MEDIA = [
  {
    src: "https://res.cloudinary.com/n0d6bs08/video/upload/f_auto,q_auto/FDown.vn_Facebook_Video_Downloader_720p_HD__7925.mp4",
    poster: "https://res.cloudinary.com/n0d6bs08/video/upload/so_1,w_480,f_auto,q_auto/FDown.vn_Facebook_Video_Downloader_720p_HD__7925.jpg",
  },
  {
    src: "https://res.cloudinary.com/n0d6bs08/video/upload/f_auto,q_auto/snapsave-app_1432224402135483_hd.mp4",
    poster: "https://res.cloudinary.com/n0d6bs08/video/upload/so_1,w_480,f_auto,q_auto/snapsave-app_1432224402135483_hd.jpg",
  },
  {
    src: "https://res.cloudinary.com/n0d6bs08/video/upload/f_auto,q_auto/FDown.vn_Facebook_Video_Downloader_720p_HD__8e09.mp4",
    poster: "https://res.cloudinary.com/n0d6bs08/video/upload/so_1,w_480,f_auto,q_auto/FDown.vn_Facebook_Video_Downloader_720p_HD__8e09.jpg",
  },
] as const;

export default function ProductPage({ params }: { params?: { id: string } }) {
  const slug = getMerchantSlug(params?.id || "");
  const honeyNutReelMedia = slug === "honey-nut" ? HONEY_NUT_REEL_MEDIA : null;
  const reelMedia = honeyNutReelMedia ? honeyNutReelMedia : REEL_MEDIA;
  const reelCount = reelMedia.length;
  const { addToCart } = useCart();
  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedBundleIdx, setSelectedBundleIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [availabilityBlocked, setAvailabilityBlocked] = useState(false);

  const [activeImage, setActiveImage] = useState(0);
  const [currentReel, setCurrentReel] = useState(0);
  const quantityControlRef = useRef<HTMLDivElement>(null);
  const [quantityControlWidth, setQuantityControlWidth] = useState<number | null>(null);
  // Only one <video> is ever mounted. Mounting all three attaches three hardware
  // decoders to layers that Embla re-transforms every frame, which is what makes the
  // horizontal drag stutter on real phones but not on a desktop localhost.
  const [activeReelVideo, setActiveReelVideo] = useState<number | null>(null);
  const activeReelVideoRef = useRef<HTMLVideoElement | null>(null);
  const viewedGoogleItemRef = useRef("");
  const [cachedProduct, setCachedProduct] = useState<StorefrontProduct | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [galleryRef, galleryApi] = useEmblaCarousel({
    align: "start",
    containScroll: false,
    loop: false,
    skipSnaps: false,
  });
  const [reelRef, reelApi] = useEmblaCarousel({
    align: "center",
    containScroll: false,
    duration: 35,
    loop: true,
    skipSnaps: false,
  });
  useLayoutEffect(() => {
    const quantityControl = quantityControlRef.current;
    if (!quantityControl) return;
    const updateWidth = () => setQuantityControlWidth(quantityControl.getBoundingClientRect().width);
    updateWidth();
    if (typeof ResizeObserver === "undefined") return;
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(quantityControl);
    return () => resizeObserver.disconnect();
  }, []);
  const goReel = (dir: number) => {
    if (reelApi) {
      if (dir < 0) reelApi.scrollPrev();
      if (dir > 0) reelApi.scrollNext();
      return;
    }
    setCurrentReel((i) => Math.min(reelCount - 1, Math.max(0, i + dir)));
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goReel(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goReel(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reelApi]);
  useEffect(() => {
    if (!reelApi) return;
    const pauseReelsDuringDrag = () => {
      activeReelVideoRef.current?.pause();
    };
    reelApi.on("pointerDown", pauseReelsDuringDrag);
    return () => {
      reelApi.off("pointerDown", pauseReelsDuringDrag);
    };
  }, [reelApi]);
  useEffect(() => {
    if (!reelApi) return;
    const syncActiveReel = () => setCurrentReel(reelApi.selectedScrollSnap());
    syncActiveReel();
    reelApi.on("select", syncActiveReel);
    reelApi.on("reInit", syncActiveReel);
    return () => {
      reelApi.off("select", syncActiveReel);
      reelApi.off("reInit", syncActiveReel);
    };
  }, [reelApi]);
  useEffect(() => {
    // Leaving a slide tears its <video> down so no decoder stays attached to an
    // off-screen slide while the track is being dragged.
    setActiveReelVideo((active) => (active === null || active === currentReel ? active : null));
  }, [currentReel]);
  const { data: merchantProduct, isFetchedAfterMount, isSuccess, refetch } = useQuery({
    queryKey: ["merchant-suite-product", slug],
    queryFn: () => fetchStorefrontProduct(slug),
    enabled: Boolean(slug),
    refetchInterval: STOREFRONT_POLL_INTERVAL_MS,
  });

  const { data: merchantInventory } = useQuery({
    queryKey: ["merchant-suite-inventory", slug],
    queryFn: () => fetchStorefrontProductInventory(slug),
    enabled: Boolean(slug),
    refetchInterval: STOREFRONT_POLL_INTERVAL_MS,
  });

  const { data: catalogProducts } = useQuery({
    queryKey: ["merchant-suite-products-listing"],
    queryFn: fetchStorefrontProducts,
    ...STOREFRONT_CATALOG_QUERY_OPTIONS,
    refetchInterval: STOREFRONT_POLL_INTERVAL_MS,
  });

  const generatedProduct = findGeneratedStorefrontProduct(generatedStorefrontProducts, slug);
  const productMissingFromMerchant = isFetchedAfterMount && isSuccess && merchantProduct === null;
  const product = productMissingFromMerchant
    ? null
    : mergeInventory(merchantProduct ?? cachedProduct, merchantInventory?.inventory) || generatedProduct;

  const relatedSource =
    catalogProducts && catalogProducts.length ? catalogProducts : generatedStorefrontProducts;
  const relatedProducts = relatedSource
    .filter((p) => p.slug !== product?.slug)
    .slice(0, 8);

  useEffect(() => {
    if (typeof window === "undefined" || !product?.slug) return;
    recordRecentlyViewedSlug(window.localStorage, product.slug);
  }, [product?.slug]);

  const bundles = (() => {
    const variants = product?.variants?.filter((variant) => {
      if (variant.available === false) return false;
      return typeof variant.stock_quantity !== "number" || variant.stock_quantity > 0;
    });
    if (variants?.length) {
      return variants.map((variant, i) => {
        const amount = Number.isFinite(Number(variant.price)) ? Number(variant.price) : Number(product?.price) || 0;
        return {
          id: i + 1,
          title: String(variant.attributes?.size ?? Object.values(variant.attributes ?? {})[0] ?? "Default"),
          price: `৳${amount.toLocaleString()}`,
          amount,
        };
      });
    }
    const base = Number(product?.price) || 0;
    return [{ id: 1, title: "Default", price: `৳${base.toLocaleString()}`, amount: base }];
  })();
  const selectedBundle = bundles[selectedBundleIdx] ?? bundles[0];
  const selectedVariant = product?.variants?.find((variant) => {
    const label = String(variant.attributes?.size ?? Object.values(variant.attributes ?? {})[0] ?? "Default");
    return label === selectedBundle.title;
  }) || null;
  const productAnalyticsItem = useMemo(() => toGoogleAnalyticsItem({
    id: selectedVariant?.id ?? product?.id ?? product?.slug ?? slug,
    name: product?.name ?? slug,
    variant: selectedBundle.title === "Default" ? null : selectedBundle.title,
    price: selectedBundle.amount,
    quantity: 1,
  }), [product?.id, product?.name, product?.slug, slug, selectedBundle.amount, selectedBundle.title, selectedVariant?.id]);
  const productImage = product?.image_url || "";
  const merchantAvailabilityKnown = isFetchedAfterMount && isSuccess && merchantProduct !== undefined;
  const merchantProductUnavailable = productMissingFromMerchant || merchantProduct?.available === false;
  const inventoryUnavailable = merchantInventory?.inventory ? !isProductOrderable(product) : false;
  const merchantUnavailable = merchantProductUnavailable || inventoryUnavailable;
  const isUnavailable = availabilityBlocked || merchantUnavailable;
  const gallery = product ? getProductGallery(product) : [];
  const displayImage = (product ? getProductImage(product) : "") || productImage;
  const displayGallery = gallery.length ? gallery : [displayImage].filter(Boolean);
  const isLoading = !merchantAvailabilityKnown && !cachedProduct && !generatedProduct;
  const compareAtAmount = Number(product?.compare_at_price);
  const detailSections = getProductDetailSections(product);
  const [openSection, setOpenSection] = useState(0);

  const verifyOrderable = async () => {
    if (isUnavailable) {
      return false;
    }

    if (!merchantAvailabilityKnown) {
      const result = await refetch();
      const orderable = isProductOrderable(mergeInventory(result.data, merchantInventory?.inventory));
      setAvailabilityBlocked(!orderable);
      return orderable;
    }

    return true;
  };

  useEffect(() => {
    setCachedProduct(getCachedStorefrontProduct(window.localStorage, slug));
  }, [slug]);

  useEffect(() => {
    setSelectedBundleIdx(0);
    setQuantity(1);
  }, [slug]);

  useEffect(() => {
    const imageUrl = displayImage;
    if (!imageUrl || imageUrl.startsWith("/")) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = imageUrl;
    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [displayImage]);

  useEffect(() => {
    if (!isFetchedAfterMount || !isSuccess) return;

    if (merchantProduct === null) {
      removeCachedStorefrontProduct(window.localStorage, slug);
      setCachedProduct(null);
      return;
    }

    if (merchantProduct) {
      setCachedStorefrontProduct(window.localStorage, merchantProduct);
      setCachedProduct(merchantProduct);
    }
  }, [isFetchedAfterMount, isSuccess, merchantProduct, slug]);

  useEffect(() => {
    if (isLoading || !product) return;
    const googleViewKey = product.slug;
    if (viewedGoogleItemRef.current !== googleViewKey) {
      viewedGoogleItemRef.current = googleViewKey;
      trackGoogleEcommerceEvent("view_item", {
        pageType: "product",
        value: selectedBundle.amount,
        items: [productAnalyticsItem],
      });
    }

    const eventId = createEventId();
    trackMetaEvent({
      eventName: "ViewContent",
      eventId,
      capi: true,
      customData: {
        currency: "BDT",
        value: selectedBundle.amount,
        content_type: "product",
        content_ids: [product.slug],
        contents: [{ id: product.slug, quantity: 1, item_price: selectedBundle.amount }],
      },
    });
  }, [isLoading, product, productAnalyticsItem, selectedBundle.amount]);

  // SEO: per-product title/meta/OG + JSON-LD so crawlers index real mango
  // products. Unknown slugs get noindex instead of a fake Stepprs fallback.
  useEffect(() => {
    if (isLoading) return;
    const siteUrl = "https://www.mangolover.com.bd";
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        if (selector.includes('property="')) {
          el.setAttribute("property", selector.split('property="')[1].split('"')[0]);
        } else if (selector.includes('name="')) {
          el.setAttribute("name", selector.split('name="')[1].split('"')[0]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    // Clean up previously injected product JSON-LD.
    document.head.querySelectorAll('script[data-seo="product"]').forEach((n) => n.remove());
    document.head.querySelectorAll('link[data-seo="canonical"]').forEach((n) => n.remove());
    if (!product) {
      document.title = "Product not found | ম্যাংগো লাভার - Mango Lover";
      setMeta('meta[name="robots"]', "content", "noindex, follow");
      return;
    }
    const price = Number(selectedBundle.amount) || Number(product.price) || 0;
    const desc = (product.description || "ম্যাংগো লাভার — Mango Lover BD. Fresh, authentic products delivered across Bangladesh.").slice(0, 160);
    const title = `${product.name} | ম্যাংগো লাভার - Mango Lover`;
    const url = `${siteUrl}/product/${product.slug}`;
    document.title = title;
    setMeta('meta[name="description"]', "content", desc);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[property="og:type"]', "content", "product");
    setMeta('meta[property="og:url"]', "content", url);
    if (displayImage) {
      setMeta('meta[property="og:image"]', "content", displayImage);
      setMeta('meta[name="twitter:image"]', "content", displayImage);
    }
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", desc);
    setMeta('meta[name="robots"]', "content", "index, follow");
    const link = document.createElement("link");
    link.rel = "canonical";
    link.href = url;
    link.setAttribute("data-seo", "canonical");
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo", "product");
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: desc,
      image: displayGallery.length ? displayGallery : undefined,
      url,
      brand: { "@type": "Brand", name: "Mango Lover" },
      offers: {
        "@type": "Offer",
        priceCurrency: "BDT",
        price: String(price),
        availability: isProductOrderable(product) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url,
      },
    });
    document.head.appendChild(script);
  }, [isLoading, product, selectedBundle.amount, displayImage, displayGallery]);

  useEffect(() => {
    if (!galleryApi) return;

    const syncActiveImage = () => setActiveImage(galleryApi.selectedScrollSnap());

    galleryApi.scrollTo(0, true);
    syncActiveImage();
    galleryApi.on("select", syncActiveImage);
    galleryApi.on("reInit", syncActiveImage);

    return () => {
      galleryApi.off("select", syncActiveImage);
      galleryApi.off("reInit", syncActiveImage);
    };
  }, [galleryApi, displayGallery.length]);

  const goToImage = (idx: number) => {
    galleryApi?.scrollTo(idx);
  };

  const today = new Date();
  const processedDate = new Date(today);
  processedDate.setDate(today.getDate() + 1);
  const deliveredDate = new Date(processedDate);
  deliveredDate.setDate(processedDate.getDate() + 1);
  const deliveryTimeline = [
    { title: "অর্ডার গ্রহণ", date: formatTimelineDate(today) },
    { title: "প্রসেসিং", date: formatTimelineDate(processedDate) },
    { title: "ডেলিভারি", date: formatTimelineDate(deliveredDate) },
  ];

  const orderBundle: OrderDialogBundle | null = product ? {
        title: product.name,
        details: selectedBundle.title,
        price: selectedBundle.amount * quantity,
        quantity,
        unitPrice: selectedBundle.amount,
        images: [{ src: displayImage, alt: product.name }],
        analyticsItems: [{ ...productAnalyticsItem, quantity }],
        captureItems: [{
          productName: product.name,
          variantName: selectedBundle.title,
          quantity,
          unitPrice: selectedBundle.amount,
        }],
        items: selectedVariant?.id !== undefined && product.id !== undefined
          ? [{ productId: String(product.id), variantId: String(selectedVariant.id), quantity }]
          : undefined,
      } : null;

  if (isLoading) {
    return (
      <Layout>
        <ProductSkeleton />
      </Layout>
    );
  }

  if (!product || !orderBundle) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-brand-ivory px-6 text-center">
          <h1 className="text-2xl font-semibold text-black">Product not found</h1>
          <p className="max-w-md text-sm text-black/60">
            This product is no longer available. Browse fresh mangoes, honey, ghee and more.
          </p>
          <Link href="/products" className="rounded-[8px] bg-black px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-white">
            Browse products
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-brand-ivory">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 bg-brand-ivory p-[10px] md:p-16 xl:p-20">
              {/* Mobile: carousel with vertical thumbnails on left inside image */}
              <div className="md:hidden">
                <div className="relative mx-auto aspect-square w-full max-w-[1080px] overflow-hidden rounded-[8px] bg-[#f6f6f6]">
                  {displayGallery.length ? (
                    <>
                      <div ref={galleryRef} className="h-full cursor-grab overflow-hidden active:cursor-grabbing">
                        <div className="flex h-full touch-pan-y">
                          {displayGallery.map((url, idx) => (
                            <div key={url} className="relative h-full min-w-0 flex-[0_0_100%] overflow-hidden">
                              <motion.img
                                src={url}
                                alt={product.name}
                                width={1080}
                                height={1080}
                                draggable={false}
                                initial={false}
                                animate={shouldReduceMotion ? { opacity: 1, scale: 1 } : {
                                  opacity: activeImage === idx ? 1 : 0.55,
                                  scale: activeImage === idx ? 1 : 0.96,
                                }}
                                whileHover={shouldReduceMotion ? undefined : { scale: activeImage === idx ? 1.035 : 0.98 }}
                                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute inset-0 h-full w-full select-none object-cover object-center"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      {displayGallery.length > 1 ? (
                        <div className="absolute left-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
                          {displayGallery.map((url, idx) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() => goToImage(idx)}
                              aria-label={`Go to product image ${idx + 1}`}
                              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-[6px] border-2 bg-white shadow-md transition-all ${
                                activeImage === idx ? "border-black opacity-100" : "border-white/70 opacity-70 hover:opacity-100"
                              }`}
                            >
                              <img src={url} alt={`${product.name} ${idx + 1}`} className="h-full w-full object-cover object-center" />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-[0.35em] text-black/25">
                      No image
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop: Pinterest style — first image big, rest in 2-col grid */}
              <div className="hidden md:block mx-auto max-w-[1080px]">
                {displayGallery.length ? (
                  <>
                    <div className="overflow-hidden rounded-[8px] bg-[#f6f6f6]">
                      <img
                        src={displayGallery[0]}
                        alt={product.name}
                        width={1080}
                        height={1080}
                        className="h-auto w-full object-cover object-center"
                      />
                    </div>
                    {displayGallery.length > 1 ? (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {displayGallery.slice(1).map((url, idx) => (
                          <div key={url} className="overflow-hidden rounded-[8px] bg-[#f6f6f6]">
                            <img
                              src={url}
                              alt={`${product.name} ${idx + 2}`}
                              width={540}
                              height={540}
                              loading="lazy"
                              className="h-auto w-full object-cover object-center transition-transform duration-500 hover:scale-[1.02]"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-[8px] bg-[#f6f6f6] text-[10px] font-bold uppercase tracking-[0.35em] text-black/25">
                    No image
                  </div>
                )}
              </div>
            </div>

            <div
              className="lg:col-span-5 flex flex-col bg-brand-ivory"
            >
              <div className="flex-grow space-y-6 px-4 pb-10 pt-2 md:space-y-10 md:p-16 xl:p-20">
                <div className="space-y-4 md:space-y-6">
                  <h1 className="max-w-full break-words font-sans text-2xl font-semibold leading-tight tracking-tight text-black sm:text-3xl md:text-4xl lg:text-[2.75rem]">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center font-sans text-2xl font-semibold text-black">
                      <span>৳</span>
                      <Counter end={selectedBundle.amount} fontSize={24} className="text-black font-semibold !px-0" />
                    </div>
                    {Number.isFinite(compareAtAmount) && compareAtAmount > selectedBundle.amount ? (
                      <span className="text-sm font-semibold text-black/35 line-through">৳{compareAtAmount.toLocaleString()}</span>
                    ) : null}
                    <div className="h-px flex-grow bg-black/5" />
                  </div>

                  {product.description ? (
                    <p className="text-xs font-medium leading-[1.8] text-black/60 md:text-sm">
                      {product.description}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2.5 md:space-y-3">
                  <span className="block pb-1 text-[10px] font-bold uppercase tracking-[0.4em] text-black/60">
                    Quantity
                  </span>
                  <div ref={quantityControlRef} className="inline-flex items-center overflow-hidden rounded-[8px] border border-black/15 bg-white">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={quantity === 1}
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      className="flex h-11 w-11 items-center justify-center text-black transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:text-black/20"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span
                      aria-live="polite"
                      className="flex h-11 min-w-12 items-center justify-center border-x border-black/10 px-3 text-sm font-semibold tabular-nums text-black"
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity((current) => current + 1)}
                      className="flex h-11 w-11 items-center justify-center text-black transition-colors hover:bg-black/5"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 md:space-y-3">
                  <span className="block pb-1 text-[10px] font-bold uppercase tracking-[0.4em] text-black/60">
                    Select Size
                  </span>
                  <div
                    className={bundles.length === 1 ? "inline-flex" : "grid grid-cols-2 gap-2"}
                    style={bundles.length === 1 && quantityControlWidth ? { width: `${quantityControlWidth + 7}px` } : undefined}
                  >
                    {bundles.map((bundle, idx) => {
                      const selected = selectedBundleIdx === idx;
                      return (
                        <button
                          key={bundle.id}
                          type="button"
                          onClick={() => setSelectedBundleIdx(idx)}
                          aria-pressed={selected}
                          className={`${bundles.length === 1 ? "w-full" : ""} flex flex-col items-center justify-center rounded-[6px] border-2 px-3 py-1.5 text-center transition-all duration-200 ${
                            selected
                              ? "border-black bg-white text-black"
                              : "border-black/10 bg-white text-black hover:border-black/30"
                          }`}
                        >
                          <span className="text-[11px] font-medium tracking-[0.04em]">
                            {bundle.title}
                          </span>
                          <span className="mt-0.5 text-[11px] font-medium font-garet">
                            {bundle.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isUnavailable ? (
                  <div className="rounded-[8px] border border-black/10 bg-white/35 p-4 text-center text-[10px] font-bold uppercase tracking-[0.35em] text-black/45">
                    Unavailable
                  </div>
                ) : null}

                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Button
                      disabled={isUnavailable || selectedBundle.amount <= 0}
                      onClick={async () => {
                        if (!(await verifyOrderable())) {
                          return;
                        }

                        addToCart(
                          {
                            id: getProductNumericId(product),
                            title: `${product.name} (${selectedBundle.title})`,
                            price: selectedBundle.price,
                            image: displayImage,
                            analyticsItem: productAnalyticsItem,
                            productUuid: String(product.id ?? ""),
                            variantId: String(selectedVariant?.id ?? ""),
                          },
                          selectedBundle.title,
                          quantity,
                        );
                      }}
                      className="group flex h-12 items-center justify-center gap-2 rounded-[8px] border border-black/20 bg-transparent px-2 text-[10px] font-bold uppercase tracking-[0.4em] text-black transition-all hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add to Cart
                    </Button>
                    <Button
                      disabled={isUnavailable || selectedBundle.amount <= 0}
                      onClick={async () => {
                        if (await verifyOrderable()) {
                          setOrderOpen(true);
                        }
                      }}
                      className="group flex h-12 items-center justify-center gap-2 rounded-[8px] bg-[#FBBB14] px-2 text-[14px] md:text-[10px] font-bold text-black transition-all hover:bg-[#e5a80f] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ক্যাশ অন ডেলিভারিতে অর্ডার করুন।
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-black/10" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/40">
                      অথবা
                    </span>
                    <div className="h-px flex-1 bg-black/10" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href="tel:+8801301636461"
                      className="group flex h-11 items-center justify-center gap-2 rounded-[8px] border border-white/20 bg-[#f26b4f] px-2 text-[11px] font-medium tracking-[0.02em] text-white shadow-none transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-[#d9573d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f26b4f]/40"
                    >
                      <Phone className="h-4 w-4 stroke-[1.5px]" />
                      ফোনে অর্ডার
                    </a>
                    <a
                      href={`https://wa.me/8801301636461?text=${encodeURIComponent(
                        `Hello, I'd like to order: ${product.name} (${selectedBundle.title})`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex h-11 items-center justify-center gap-2 rounded-[8px] border border-white/20 bg-[#25d366] px-2 text-[11px] font-medium tracking-[0.02em] text-white shadow-none transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25d366]/40"
                    >
                      <img
                        src="https://cdn.reicon.dev/logos/whatsapp/original.svg"
                        alt="Whatsapp"
                        width={16}
                        height={16}
                        className="h-4 w-4 brightness-0 invert"
                      />
                      হোয়াটসএপ-এ অর্ডার
                    </a>
                  </div>

                  <div className="rounded-[8px] border border-black/[0.06] bg-white/20 px-3 py-1.5 md:px-3">
                    <div className="relative pb-0.5 pt-1.5">
                       <div className="absolute left-[14%] right-[14%] top-[18px] h-px bg-black/10" />
                      <div className="relative z-20 grid grid-cols-3 gap-2">
                        {deliveryTimeline.map((item) => (
                          <div key={item.title} className="flex flex-col items-center text-center">
                             <span className="mb-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-ivory text-black">
                              {item.title === "অর্ডার গ্রহণ" ? (
                                 <ShoppingBag className="h-5 w-5" weight="Filled" />
                              ) : item.title === "প্রসেসিং" ? (
                                 <ClipboardCheck className="h-5 w-5" weight="Filled" />
                              ) : (
                                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                                  <path fillRule="evenodd" clipRule="evenodd" d="M1.25 5.5C1.25 3.70508 2.70507 2.25 4.5 2.25H12.5C14.2949 2.25 15.75 3.70507 15.75 5.5V5.75H18.5341C19.4165 5.75 20.2173 6.26571 20.5825 7.06894L22.6761 11.675C22.7213 11.7689 22.7476 11.8737 22.7498 11.9844L22.75 12.0017V16.5C22.75 17.7426 21.7426 18.75 20.5 18.75H19.7388C19.7462 18.8323 19.75 18.9157 19.75 19C19.75 20.5188 18.5188 21.75 17 21.75C15.4812 21.75 14.25 20.5188 14.25 19C14.25 18.9157 14.2538 18.8323 14.2612 18.75H9.73879C9.74621 18.8323 9.75 18.9157 9.75 19C9.75 20.5188 8.51878 21.75 7 21.75C5.48122 21.75 4.25 20.5188 4.25 19C4.25 18.9157 4.25379 18.8323 4.26121 18.75H3.5C2.25736 18.75 1.25 17.7426 1.25 16.5V5.5ZM17 17.75C16.3096 17.75 15.75 18.3096 15.75 19C15.75 19.6904 16.3096 20.25 17 20.25C17.6904 20.25 18.25 19.6904 18.25 19C18.25 18.3096 17.6904 17.75 17 17.75ZM5.75 19C5.75 18.3096 6.30964 17.75 7 17.75C7.69036 17.75 8.25 18.3096 8.25 19C8.25 19.6904 7.69036 20.25 7 20.25C6.30964 20.25 5.75 19.6904 5.75 19ZM15.75 11.25H20.8352L19.2169 7.68965C19.0952 7.4219 18.8282 7.25 18.5341 7.25H15.75V11.25Z" fill="currentColor" />
                                </svg>
                              )}
                            </span>
                             <span className="font-garet text-[11px] font-normal tracking-[0.03em] text-black/45">
                              {item.date}
                            </span>
                             <span
                               className="mt-1 block text-[14px] font-normal leading-4 text-black/80"
                 style={{ fontFamily: "'KaiumSimanto', serif" }}
                            >
                              {item.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Details — compact, scannable list */}
                 <div className="border border-black/10 bg-white/35 rounded-[8px] p-5 md:p-6">
                   <div className="mb-6 flex items-baseline gap-2">
                    <h2
                       className="text-[23px] font-normal text-black"
                       style={{ fontFamily: "'IhtishamDeshlipi', serif" }}
                    >
                      বিস্তারিত
                    </h2>
                    <span
                      className="relative inline-block text-[23px] font-normal text-black/65"
                      style={{ fontFamily: "'IhtishamDeshlipi', serif" }}
                    >
                      বৈশিষ্ট্য
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 120 60"
                        preserveAspectRatio="none"
                        className="pointer-events-none absolute left-1/2 top-1/2 h-[165%] w-[140%] -translate-x-1/2 -translate-y-1/2"
                        style={{ overflow: "visible" }}
                      >
                        <path
                          d="M14,32 C9,15 48,6 72,8 C108,11 116,22 112,34 C108,49 56,56 32,52 C13,49 9,42 15,30"
                          fill="none"
                          stroke="#FBBB14"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </div>

                  <div>
                    <div
                      role="tablist"
                      className="flex gap-1 overflow-x-auto border-b border-black/10"
                    >
                      {detailSections.map((item, i) => {
                        const active = openSection === i;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setOpenSection(i)}
                             className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-[17px] transition-colors md:text-[19px] ${
                              active
                                ? "border-black text-black"
                                : "border-transparent text-black/40"
                            }`}
                 style={{ fontFamily: "'KaiumSimanto', serif" }}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-4">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={openSection}
                          role="tabpanel"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {(() => {
                            const item = detailSections[openSection];
                            return (
                              <div className="space-y-1.5 text-left">
                                {item.body?.map((paragraph, idx) => (
                                  <p
                                    key={idx}
                                     className="text-[13px] leading-[1.7] tracking-[0.01em] text-black/55"
                                  >
                                    {paragraph}
                                  </p>
                                ))}
                                {item.details?.length ? (
                                    <ul className="-ml-3 max-w-[720px] space-y-1 text-left md:-ml-4">
                                     {item.details.map((detail, detailIndex) => (
                                       <li
                                         key={detail}
                                          className="grid w-full max-w-full grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-2 text-[13px] uppercase tracking-[0.03em] font-medium leading-6 text-black/70"
                                       >
                                         <span
                                           className="w-6 text-right font-normal tabular-nums text-brand-gold"
                                           style={{ fontFamily: "inherit" }}
                                         >
                                           {toBengaliNumeral(detailIndex + 1)}.
                                         </span>
                                         <span>{detail}</span>
                                       </li>
                                     ))}
                                  </ul>
                                ) : null}
                              </div>
                            );
                          })()}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Reels Section — smooth horizontal carousel */}
                <div className="-mx-4 pt-4 mt-4 overflow-hidden bg-brand-ivory md:mx-0 md:mt-0 md:pt-0">
                  <h2
                    className="mb-3 text-center text-[1.6rem] font-normal tracking-[-0.01em] text-black md:text-[1.8rem]"
                     style={{ fontFamily: "'KaiumSimanto', serif" }}
                  >
                    আমরা ও আমাদের{" "}
                    <span
                      className="relative inline-block"
                      style={{ fontFamily: "'IhtishamDeshlipi', serif" }}
                    >
                      সত্যতা
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 120 60"
                        preserveAspectRatio="none"
                        className="pointer-events-none absolute left-1/2 top-1/2 h-[165%] w-[140%] -translate-x-1/2 -translate-y-1/2"
                        style={{ overflow: "visible" }}
                      >
                        <path
                          d="M14,32 C9,15 48,6 72,8 C108,11 116,22 112,34 C108,49 56,56 32,52 C13,49 9,42 15,30"
                          fill="none"
                          stroke="#FBBB14"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </h2>
                  <div className="relative mx-auto w-full max-w-none md:max-w-[480px]">
                    <div ref={reelRef} className="overflow-hidden [touch-action:pan-y_pinch-zoom] overscroll-x-contain">
                      <div className="flex will-change-transform gap-0 px-0 md:px-6">
                        {reelMedia.map(({ src, poster }, i) => (
                          <div key={src} className="mr-3 min-w-0 shrink-0 basis-[60vw] md:mr-6 md:basis-[240px]">
                            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[6px] bg-black">
                              {i === currentReel ? (
                                <video
                                  src={src}
                                  title={`Mango Lover BD reel ${i + 1}`}
                                  poster={poster}
                                  controls={activeReelVideo === i}
                                  playsInline
                                  preload="metadata"
                                  onPlay={() => setActiveReelVideo(i)}
                                  onPause={() => setActiveReelVideo((active) => (active === i ? null : active))}
                                  ref={(video) => {
                                    activeReelVideoRef.current = video;
                                  }}
                                  className="h-full w-full object-contain bg-black"
                                />
                              ) : null}
                              {activeReelVideo !== i ? (
                                <img
                                  src={poster}
                                  alt=""
                                  aria-hidden="true"
                                  loading="lazy"
                                  decoding="async"
                                  className="pointer-events-none absolute inset-0 z-10 h-full w-full object-cover"
                                />
                              ) : null}
                              {activeReelVideo !== i ? (
                                <button
                                  type="button"
                                  aria-label={`Play reel ${i + 1}`}
                                  onClick={() => {
                                    if (i !== currentReel) {
                                      reelApi?.scrollTo(i);
                                      return;
                                    }
                                    const video = activeReelVideoRef.current;
                                    if (!video) return;
                                    video.muted = false;
                                    setActiveReelVideo(i);
                                    void video.play().catch(() => setActiveReelVideo(null));
                                  }}
                                  className="absolute left-1/2 top-1/2 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                                >
                                  <Play className="ml-1 h-6 w-6 fill-current" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Previous reel"
                      onClick={() => goReel(-1)}
                      className="absolute left-2 top-1/2 flex -translate-y-1/2 rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm hover:bg-black/60"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Next reel"
                      onClick={() => goReel(1)}
                      className="absolute right-2 top-1/2 flex -translate-y-1/2 rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm hover:bg-black/60"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 pb-5 pt-2">
                    {Array.from({ length: reelCount }, (_, i) => (
                      <button
                        key={i}
                        aria-label={`Go to reel ${i + 1}`}
                        onClick={() => {
                          if (reelApi) {
                            reelApi.scrollTo(i);
                          } else {
                            setCurrentReel(i);
                          }
                        }}
                        className={`h-1.5 rounded-full transition-all ${i === currentReel ? "w-5 bg-black" : "w-1.5 bg-black/25"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* You May Also Like Section */}
      <section className="w-full bg-[#f6f6f6] pb-10 md:pb-16 pt-0">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12 }}
          className="mx-auto max-w-[1500px] px-4 md:px-8 xl:px-12"
        >
          <motion.div
            variants={reveal}
            transition={transition}
            className="mb-7 flex items-start justify-between gap-6 md:mb-12"
          >
            <motion.h2
              className="text-[1.4rem] whitespace-nowrap font-normal tracking-[-0.02em] text-black md:text-[clamp(1.9rem,5vw,3rem)] md:whitespace-normal"
            >
              <span className="font-medium">আমাদের</span>{" "}
              <span
                className="relative inline-block"
                 style={{ fontFamily: "'IhtishamDeshlipi', serif" }}
              >
                আরও কিছু পণ্য
                <svg
                  aria-hidden="true"
                  viewBox="0 0 120 60"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[165%] w-[140%] -translate-x-1/2 -translate-y-1/2"
                  style={{ overflow: "visible" }}
                >
                  <path
                    d="M14,32 C9,15 48,6 72,8 C108,11 116,22 112,34 C108,49 56,56 32,52 C13,49 9,42 15,30"
                    fill="none"
                    stroke="#FBBB14"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </motion.h2>

            <Link
              href="/products"
              className="mt-1.5 shrink-0 border-b-2 border-black pb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-60 md:mt-2 md:text-base md:tracking-[0.24em]"
            >
              Discover More
            </Link>
          </motion.div>

          <motion.div
            transition={{ staggerChildren: 0.08 }}
            className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4"
          >
            {relatedProducts.map((p) => (
              <HomeProductCard key={p.slug} product={p} />
            ))}
          </motion.div>
        </motion.div>
      </section>

      <RecentlyViewed products={relatedSource} excludeSlug={product?.slug} />

      <OrderDialog open={orderOpen} onOpenChange={setOrderOpen} bundle={orderBundle} />
    </Layout>
  );
}
