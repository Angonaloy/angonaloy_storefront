import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import "@videojs/react/video/skin.css";
import { PlayButton } from "@videojs/react";
import { VideoPlayer, VideoSkin } from "@videojs/react/video";
import { MuxVideo } from "@videojs/react/media/mux-video";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, Phone, Minus, MoveLeft, MoveRight, Pause, Play, Plus } from "lucide-react";
import { ShoppingBag, ClipboardCheck } from "reicon-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BagIcon } from "@/components/bag-icon";
import HomeProductCard from "@/components/home-product-card";
import RecentlyViewed from "@/components/recently-viewed";
import { useCart } from "@/contexts/cart-context";
import Layout from "@/components/layout";
import OrderDialog, { type OrderDialogBundle } from "@/components/order-dialog";
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

// On mobile the announcement bar stays above the sticky header; on desktop
// only the header sticks.
function getStickyHeaderOffset() {
  const header = document.querySelector<HTMLElement>("nav.sticky");
  const announcement = window.matchMedia("(max-width: 767px)").matches
    ? document.querySelector<HTMLElement>('[aria-label="Store announcements"]')
    : null;
  return (header?.getBoundingClientRect().height ?? 0) + (announcement?.getBoundingClientRect().height ?? 0) + 16;
}

const PRODUCT_SECTION_IDS = ["product-description", "product-details", "product-reels", "you-may-also-like"] as const;

function ProductSkeleton() {
  return (
    <div className="min-h-screen bg-bloop-cream">
      <div className="mx-auto grid w-full max-w-[1360px] grid-cols-1 gap-6 px-4 pb-10 pt-2 md:px-6 md:pt-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10 lg:px-10 xl:gap-16">
        <div className="min-w-0">
          <div className="mx-auto aspect-square w-full max-w-[720px] animate-pulse rounded-[20px] bg-bloop-card md:rounded-[28px] lg:max-w-none" />
        </div>
        <div className="flex w-full flex-col gap-5">
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-bloop-card" />
          <div className="h-10 w-3/4 animate-pulse rounded-full bg-bloop-card" />
          <div className="h-7 w-1/3 animate-pulse rounded-full bg-bloop-card" />
          <div className="mt-4 h-11 w-32 animate-pulse rounded-full bg-bloop-card" />
          <div className="mt-4 h-14 w-full animate-pulse rounded-full bg-bloop-red/20" />
        </div>
      </div>
    </div>
  );
}

// Shared "আমরা ও আমাদের সত্যতা" reels — same 3 Mux videos on every
// product page. See the MuxVideo branch below, now unconditional.
const GLASS_WATER_BOTTLE_MUX_PLAYBACK_IDS = [
  "h5q3b3EKEzQgPUQ002xPb2jmVORrBlvIlbMDejxOSJeY",
  "cwW02TU2uP1XRUsB02GmCW1YL01PTdR56302suoUJR2kTJQ",
  "ctMKREyeQESGJu5D56c4tqvDXvzMBVPcU9lkWren66w",
] as const;
const GLASS_WATER_BOTTLE_REEL_MEDIA = GLASS_WATER_BOTTLE_MUX_PLAYBACK_IDS.map((playbackId) => ({
  src: `https://stream.mux.com/${playbackId}.m3u8`,
  poster: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
}));

export default function ProductPage({ params }: { params?: { id: string } }) {
  const slug = getMerchantSlug(params?.id || "");
  // Same authenticity reels on every product — no per-product video split.
  const isGlassWaterBottleMuxProduct = true;
  const reelMedia = GLASS_WATER_BOTTLE_REEL_MEDIA;
  const reelCount = reelMedia.length;
  const { addToCart } = useCart();
  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedBundleIdx, setSelectedBundleIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [availabilityBlocked, setAvailabilityBlocked] = useState(false);

  const [activeImage, setActiveImage] = useState(0);
  const [currentReel, setCurrentReel] = useState(0);
  // The mobile mini bar appears once the primary COD button has scrolled up
  // out of view, and hides again when the button is back on screen.
  const primaryCtaRef = useRef<HTMLDivElement>(null);
  const [showMiniBar, setShowMiniBar] = useState(false);
  const buyBoxRef = useRef<HTMLDivElement>(null);
  const [buyBoxTop, setBuyBoxTop] = useState<number | undefined>(undefined);
  const [activeSection, setActiveSection] = useState<string>(PRODUCT_SECTION_IDS[0]);
  // Only one <video> is ever mounted. Mounting all three attaches three hardware
  // decoders to layers that Embla re-transforms every frame, which is what makes the
  // horizontal drag stutter on real phones but not on a desktop localhost.
  const [playingReel, setPlayingReel] = useState<number | null>(null);
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
    breakpoints: { "(min-width: 768px)": { active: false } },
  });
  const goReel = (dir: number) => {
    const canSwipeReels = reelApi && !window.matchMedia("(min-width: 768px)").matches;
    if (canSwipeReels) {
      if (dir < 0) reelApi.scrollPrev();
      if (dir > 0) reelApi.scrollNext();
      return;
    }
    setCurrentReel((i) => Math.min(reelCount - 1, Math.max(0, i + dir)));
  };
  const selectReel = (index: number) => {
    const canSwipeReels = reelApi && !window.matchMedia("(min-width: 768px)").matches;
    if (canSwipeReels) reelApi.scrollTo(index);
    else setCurrentReel(index);
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
    // video.js owns play/pause state for the Mux player — an external, direct
    // .pause() call here would fight its own toggle logic on the next click.
    // The plain <video> branch has no such state to desync, so this is safe
    // there and still pauses playback the moment a drag starts.
    if (isGlassWaterBottleMuxProduct) return;
    const pauseReelsDuringDrag = () => {
      activeReelVideoRef.current?.pause();
    };
    reelApi.on("pointerDown", pauseReelsDuringDrag);
    return () => {
      reelApi.off("pointerDown", pauseReelsDuringDrag);
    };
  }, [reelApi, isGlassWaterBottleMuxProduct]);
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
    setPlayingReel(null);
  }, [currentReel, isGlassWaterBottleMuxProduct]);
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

  const glassBottleOffers = product?.bundle_offers ?? [];
  const isBundleOfferProduct = glassBottleOffers.length > 0;

  useEffect(() => {
    if (!isBundleOfferProduct || glassBottleOffers.some((offer) => offer.quantity === quantity)) return;
    const firstOffer = glassBottleOffers[0];
    if (firstOffer) setQuantity(firstOffer.quantity);
  }, [glassBottleOffers, isBundleOfferProduct, quantity]);

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

  // Bundle offer totals come from Merchant Suite's public catalog. The
  // storefront only selects the offer ID; checkout recalculates its price on
  // the Merchant Suite server.
  const activeGlassBottleOffer = isBundleOfferProduct
    ? glassBottleOffers.find((offer) => offer.quantity === quantity) ?? glassBottleOffers[0]
    : null;
  const pricedBundle = activeGlassBottleOffer
    ? {
        ...selectedBundle,
        amount: activeGlassBottleOffer.total_price / activeGlassBottleOffer.quantity,
        price: `৳${Math.round(activeGlassBottleOffer.total_price / activeGlassBottleOffer.quantity).toLocaleString()}`,
      }
    : selectedBundle;
  const checkoutSubtotal = activeGlassBottleOffer
    ? activeGlassBottleOffer.total_price * (quantity / activeGlassBottleOffer.quantity)
    : pricedBundle.amount * quantity;
  const heroDisplayAmount = activeGlassBottleOffer ? activeGlassBottleOffer.total_price : selectedBundle.amount;
  const heroCompareAtAmount = activeGlassBottleOffer
    ? activeGlassBottleOffer.compare_at_total
    : Number(product?.compare_at_price);

  const productAnalyticsItem = useMemo(() => toGoogleAnalyticsItem({
    id: selectedVariant?.id ?? product?.id ?? product?.slug ?? slug,
    name: product?.name ?? slug,
    variant: selectedBundle.title === "Default" ? null : selectedBundle.title,
    price: pricedBundle.amount,
    quantity: 1,
  }), [product?.id, product?.name, product?.slug, slug, pricedBundle.amount, selectedBundle.title, selectedVariant?.id]);
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
  const detailSections = getProductDetailSections(product);
  const [openSection, setOpenSection] = useState<number | null>(0);
  // Low-stock copy only uses live inventory numbers, never the catalog snapshot.
  const liveStockQuantity = merchantInventory?.inventory
    ? selectedVariant?.id !== undefined
      ? merchantInventory.inventory.variants[String(selectedVariant.id)]?.stock_quantity
      : merchantInventory.inventory.stock_quantity
    : undefined;
  const lowStockCount =
    typeof liveStockQuantity === "number" && liveStockQuantity > 0 && liveStockQuantity <= 10
      ? liveStockQuantity
      : null;

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
        value: pricedBundle.amount,
        items: [productAnalyticsItem],
      });
    }

  }, [isLoading, product, productAnalyticsItem, pricedBundle.amount]);

  // SEO: per-product title/meta/OG + JSON-LD so crawlers index real mango
  // products. Unknown slugs get noindex instead of a fake Stepprs fallback.
  useEffect(() => {
    if (isLoading) return;
    const siteUrl = "https://angonaloy.shop";
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
      document.title = "Product not found | Angonaloy-আঙ্গনালয়";
      setMeta('meta[name="robots"]', "content", "noindex, follow");
      return;
    }
    const price = Number(pricedBundle.amount) || Number(product.price) || 0;
    const desc = (product.description || "Angonaloy-আঙ্গনালয়. Fresh, authentic products delivered across Bangladesh.").slice(0, 160);
    const title = `${product.name} | Angonaloy-আঙ্গনালয়`;
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
      brand: { "@type": "Brand", name: "Angonaloy" },
      offers: {
        "@type": "Offer",
        priceCurrency: "BDT",
        price: String(price),
        availability: isProductOrderable(product) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url,
      },
    });
    document.head.appendChild(script);
  }, [isLoading, product, pricedBundle.amount, displayImage, displayGallery]);

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

  const hasProduct = Boolean(product);
  useEffect(() => {
    const cta = primaryCtaRef.current;
    if (!cta) return;
    // A scroll listener (not IntersectionObserver) so jumps past the button,
    // e.g. via the section anchor links, still toggle the bar.
    const syncMiniBar = () => setShowMiniBar(cta.getBoundingClientRect().bottom < 0);
    syncMiniBar();
    window.addEventListener("scroll", syncMiniBar, { passive: true });
    window.addEventListener("resize", syncMiniBar);
    return () => {
      window.removeEventListener("scroll", syncMiniBar);
      window.removeEventListener("resize", syncMiniBar);
    };
  }, [isLoading, hasProduct]);

  useEffect(() => {
    const box = buyBoxRef.current;
    if (!box) return;
    // Sticky offset for the lg+ buy box. A box taller than the viewport gets a
    // negative top, so it scrolls naturally until its bottom is visible and only
    // then sticks — its lower buttons are never hidden.
    const syncBuyBoxTop = () => {
      setBuyBoxTop(Math.min(getStickyHeaderOffset(), window.innerHeight - box.offsetHeight - 16));
    };
    syncBuyBoxTop();
    const observer = new ResizeObserver(syncBuyBoxTop);
    observer.observe(box);
    window.addEventListener("resize", syncBuyBoxTop);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncBuyBoxTop);
    };
  }, [isLoading, hasProduct]);

  useEffect(() => {
    // Highlights the anchor of the section currently under the sticky header.
    const syncActiveSection = () => {
      const offset = getStickyHeaderOffset();
      let current: string = PRODUCT_SECTION_IDS[0];
      for (const id of PRODUCT_SECTION_IDS) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top - offset <= 1) current = id;
      }
      setActiveSection(current);
    };
    syncActiveSection();
    window.addEventListener("scroll", syncActiveSection, { passive: true });
    window.addEventListener("resize", syncActiveSection);
    return () => {
      window.removeEventListener("scroll", syncActiveSection);
      window.removeEventListener("resize", syncActiveSection);
    };
  }, [isLoading, hasProduct]);

  // Section anchors scroll the window themselves. A native fragment navigation
  // fires popstate, which App.tsx treats as back/forward and restores the saved
  // scroll position — snapping the page straight back. replaceState fires no
  // popstate and no wouter navigation.
  const scrollToSection = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    const section = document.getElementById(href.slice(1));
    if (!section) return;
    event.preventDefault();
    const top = section.getBoundingClientRect().top + window.scrollY - getStickyHeaderOffset();
    window.scrollTo({ top: Math.max(0, top), left: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
    window.history.replaceState(window.history.state, "", href);
  };

  const openOrderDialog = async () => {
    if (await verifyOrderable()) {
      setOrderOpen(true);
    }
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
        price: checkoutSubtotal,
        quantity,
        unitPrice: pricedBundle.amount,
        images: [{ src: displayImage, alt: product.name }],
        analyticsItems: [{ ...productAnalyticsItem, quantity }],
        captureItems: [{
          productName: product.name,
          variantName: selectedBundle.title,
          quantity,
          unitPrice: pricedBundle.amount,
        }],
        items: selectedVariant?.id !== undefined && product.id !== undefined
           ? [{
               productId: String(product.id),
               variantId: String(selectedVariant.id),
               quantity,
               ...(activeGlassBottleOffer ? { offerId: activeGlassBottleOffer.id } : {}),
             }]
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
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-bloop-cream px-6 text-center">
          <h1 className="font-bloop text-[clamp(2rem,5vw,2.75rem)] font-bold tracking-[-0.03em] text-bloop-red">Product not found</h1>
          <p className="max-w-md font-bloop-body text-sm text-bloop-ink/70">
            This product is no longer available. Browse fresh mangoes, honey, ghee and more.
          </p>
          <Link href="/products" className="bloop-pill border-bloop-red bg-bloop-red px-8 py-3 font-bloop text-[15px] font-bold text-bloop-cream hover:bg-bloop-ink hover:border-bloop-ink">
            Browse products
          </Link>
        </div>
      </Layout>
    );
  }

  const hasPriceOptions = new Set(bundles.map((bundle) => bundle.amount)).size > 1;
  const showSizeOptions = !(bundles.length === 1 && selectedBundle.title === "Default");
  const hasCompareAt = Number.isFinite(heroCompareAtAmount) && heroCompareAtAmount > heroDisplayAmount;
  const miniBarDetail = activeGlassBottleOffer
    ? activeGlassBottleOffer.label
    : selectedBundle.title === "Default"
      ? null
      : selectedBundle.title;
  const anchorLinks = [
    { href: "#product-description", label: "Description" },
    ...(detailSections.length ? [{ href: "#product-details", label: "Details" }] : []),
    { href: "#product-reels", label: "Reels" },
    ...(relatedProducts.length ? [{ href: "#you-may-also-like", label: "You may also like" }] : []),
  ];

  return (
    <Layout>
      <div className="min-h-screen overflow-x-clip bg-bloop-cream text-bloop-ink">
        <div className="mx-auto grid w-full max-w-[1360px] grid-cols-1 gap-6 px-4 pb-12 pt-2 md:px-6 md:pt-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10 lg:px-10 xl:gap-16">
          <div className="min-w-0">
            {/* Mobile: swipe carousel with a thin progress bar */}
            <div className="md:hidden">
              <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-bloop-card">
                {displayGallery.length ? (
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
                            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute inset-0 h-full w-full select-none object-cover object-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bloop text-[11px] font-bold uppercase tracking-[0.3em] text-bloop-ink/30">
                    No image
                  </div>
                )}
              </div>
              {displayGallery.length > 1 ? (
                <div className="mt-3 flex items-center">
                  {displayGallery.map((url, idx) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => goToImage(idx)}
                      aria-label={`Go to product image ${idx + 1}`}
                      aria-current={activeImage === idx ? "true" : undefined}
                      className="flex h-5 flex-1 items-center"
                    >
                      <span
                        aria-hidden="true"
                        className={`block h-[2px] w-full transition-colors duration-300 ${
                          activeImage === idx ? "bg-bloop-ink" : "bg-bloop-ink/15"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Desktop: first image large, the rest in a 2-col grid */}
            <div className="mx-auto hidden max-w-[720px] md:block lg:max-w-none">
              {displayGallery.length ? (
                <>
                  <div className="overflow-hidden rounded-[28px] bg-bloop-card">
                    <img
                      src={displayGallery[0]}
                      alt={product.name}
                      width={1080}
                      height={1080}
                      className="h-auto w-full object-cover object-center"
                    />
                  </div>
                  {displayGallery.length > 1 ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {displayGallery.slice(1).map((url, idx, rest) => (
                        <div
                          key={url}
                          className={`overflow-hidden rounded-[28px] bg-bloop-card ${
                            rest.length % 2 === 1 && idx === rest.length - 1 ? "col-span-2" : ""
                          }`}
                        >
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
                <div className="flex aspect-square w-full items-center justify-center rounded-[28px] bg-bloop-card font-bloop text-[11px] font-bold uppercase tracking-[0.3em] text-bloop-ink/30">
                  No image
                </div>
              )}
            </div>
          </div>

          {/* Buy box */}
          <div ref={buyBoxRef} style={{ top: buyBoxTop }} className="min-w-0 lg:sticky lg:self-start">
            <div className="flex w-full flex-col">
              <nav aria-label="Breadcrumb" className="font-bloop text-[13px] font-bold text-bloop-ink">
                <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <li><Link href="/" className="transition-opacity hover:opacity-60">Home</Link></li>
                  <li aria-hidden="true">/</li>
                  <li><Link href="/products" className="transition-opacity hover:opacity-60">Products</Link></li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page" className="min-w-0 truncate">{product.name}</li>
                </ol>
              </nav>

              <h1 className="mt-4 break-words font-bloop text-[32px] font-bold leading-[1.05] tracking-[-0.02em] text-bloop-red md:text-[40px]">
                {product.name}
              </h1>

              {product.description ? (
                // lg+: CSS order moves this below the delivery timeline card.
                <p className="mt-4 line-clamp-5 font-bloop-body text-[14px] leading-[1.6] text-bloop-ink/80 lg:order-last lg:mt-6">
                  {product.description}
                </p>
              ) : null}

              <div className="mt-5 flex items-center gap-3">
                <div className={`flex items-center font-bloop text-[26px] font-bold ${hasCompareAt ? "text-bloop-red" : "text-bloop-ink"}`}>
                  <span>৳</span>
                  <Counter
                    end={heroDisplayAmount}
                    fontSize={26}
                    className={`font-bloop font-bold !px-0 ${hasCompareAt ? "text-bloop-red" : "text-bloop-ink"}`}
                  />
                </div>
                {hasCompareAt ? (
                  <span className="font-bloop text-[16px] font-bold text-bloop-ink/35 line-through">৳{heroCompareAtAmount.toLocaleString()}</span>
                ) : null}
              </div>

              {isBundleOfferProduct ? (
                <div className="mt-6 space-y-3">
                  <p className="font-bangla text-[14px] font-semibold text-bloop-ink">
                    নিচের {toBengaliNumeral(glassBottleOffers.length)}টি অপশন থেকে ১টি সিলেক্ট করুন।
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {glassBottleOffers.map((offer) => {
                      const selected = quantity === offer.quantity;
                      return (
                        <button
                          key={offer.id}
                          type="button"
                          onClick={() => setQuantity(offer.quantity)}
                          aria-pressed={selected}
                          className={`flex items-center gap-3 rounded-[20px] border-2 px-4 py-3.5 text-left transition-colors duration-200 ${
                            selected
                              ? "border-bloop-red bg-bloop-cream"
                              : "border-bloop-ink/15 bg-white hover:border-bloop-ink/40"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              selected ? "border-bloop-red" : "border-bloop-ink/25"
                            }`}
                          >
                            {selected ? <span className="h-2.5 w-2.5 rounded-full bg-bloop-red" /> : null}
                          </span>
                          <span className="min-w-0 flex-1 font-bangla text-[14px] font-semibold leading-snug text-bloop-ink">{offer.label}</span>
                          <span className="shrink-0 font-bloop text-[16px] font-bold tracking-tight text-bloop-ink">
                            Tk {Number(offer.total_price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : showSizeOptions ? (
                <div className="mt-6">
                  <p className="font-bloop-body text-[13px] text-bloop-ink">
                    Size — {selectedBundle.title}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {bundles.map((bundle, idx) => {
                      const selected = selectedBundleIdx === idx;
                      return (
                        <button
                          key={bundle.id}
                          type="button"
                          onClick={() => setSelectedBundleIdx(idx)}
                          aria-pressed={selected}
                          className={`inline-flex h-10 items-center gap-1.5 rounded-full border-2 px-4 font-bloop text-[12px] font-bold uppercase tracking-[0.02em] text-bloop-ink transition-colors duration-200 ${
                            selected ? "border-bloop-ink" : "border-transparent hover:border-bloop-ink/30"
                          }`}
                        >
                          <span>{bundle.title}</span>
                          {hasPriceOptions ? (
                            <span className="font-medium normal-case text-bloop-ink/55">{bundle.price}</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {lowStockCount !== null ? (
                <div className="mt-6">
                  <p className="font-bloop text-[13px] font-bold text-bloop-red">Only {lowStockCount} left in stock</p>
                  <div aria-hidden="true" className="mt-2 h-[2px] w-full bg-bloop-ink" />
                </div>
              ) : null}

              {!isBundleOfferProduct ? (
                <div className="mt-6 inline-flex h-11 w-32 items-center justify-between rounded-full border-2 border-bloop-ink px-1 text-bloop-ink">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity === 1}
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-bloop-ink/5 disabled:cursor-not-allowed disabled:text-bloop-ink/25"
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span aria-live="polite" className="font-bloop-body text-[14px] font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((current) => current + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-bloop-ink/5"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : null}

              {isUnavailable ? (
                <div className="mt-6 rounded-full bg-bloop-card px-4 py-3 text-center font-bloop text-[12px] font-bold uppercase tracking-[0.2em] text-bloop-ink/50">
                  Unavailable
                </div>
              ) : null}

              <div className="mt-6 space-y-3">
                <div ref={primaryCtaRef}>
                  <Button
                    disabled={isUnavailable || pricedBundle.amount <= 0}
                    onClick={openOrderDialog}
                    className="flex h-14 w-full items-center justify-center rounded-full bg-bloop-red px-4 font-bangla text-[17px] font-bold text-bloop-cream shadow-none transition-colors hover:bg-bloop-ink disabled:cursor-not-allowed disabled:opacity-50 md:h-16"
                  >
                    ক্যাশ অন ডেলিভারিতে অর্ডার করুন
                  </Button>
                </div>
                <Button
                  disabled={isUnavailable || pricedBundle.amount <= 0}
                  onClick={async () => {
                    if (!(await verifyOrderable())) {
                      return;
                    }

                    addToCart(
                      {
                        id: getProductNumericId(product),
                        title: `${product.name} (${selectedBundle.title})`,
                        price: pricedBundle.price,
                        image: displayImage,
                        analyticsItem: productAnalyticsItem,
                        productUuid: String(product.id ?? ""),
                        variantId: String(selectedVariant?.id ?? ""),
                        ...(activeGlassBottleOffer ? {
                          offerId: activeGlassBottleOffer.id,
                          quantityStep: activeGlassBottleOffer.quantity,
                        } : {}),
                      },
                      selectedBundle.title,
                      quantity,
                    );
                  }}
                  className="flex h-12 w-full items-center justify-center rounded-full border-2 border-bloop-red bg-transparent px-4 font-bloop text-[16px] font-bold text-bloop-red shadow-none transition-colors hover:bg-bloop-red hover:text-bloop-cream disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to cart
                </Button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-bloop-ink/15" />
                  <span className="font-bangla text-[13px] font-medium text-bloop-ink/50">অথবা</span>
                  <div className="h-px flex-1 bg-bloop-ink/15" />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href="tel:+8801819502705"
                    className="bloop-pill h-11 border-bloop-ink px-2 font-bangla text-[14px] text-bloop-ink hover:bg-bloop-ink hover:text-bloop-cream"
                  >
                    <Phone className="h-4 w-4 stroke-[1.75px]" aria-hidden="true" />
                    ফোনে অর্ডার
                  </a>
                  <a
                    href={`https://wa.me/8801819502705?text=${encodeURIComponent(
                      `Hello, I'd like to order: ${product.name} (${selectedBundle.title})`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bloop-pill h-11 border-bloop-ink px-2 font-bangla text-[14px] text-bloop-ink hover:bg-bloop-ink hover:text-bloop-cream"
                  >
                    <img
                      src="https://cdn.reicon.dev/logos/whatsapp/original.svg"
                      alt=""
                      aria-hidden="true"
                      width={16}
                      height={16}
                      className="h-4 w-4 brightness-0 group-hover:invert"
                    />
                    হোয়াটসএপ-এ অর্ডার
                  </a>
                </div>
              </div>

              <div className="mt-6 rounded-[20px] bg-bloop-card px-3 py-4">
                <div className="relative">
                  <div aria-hidden="true" className="absolute left-[18%] right-[18%] top-[10px] h-px bg-bloop-ink/15" />
                  <div className="relative grid grid-cols-3 gap-2">
                    {deliveryTimeline.map((item) => (
                      <div key={item.title} className="flex flex-col items-center text-center">
                        <span className="mb-1.5 flex h-5 w-8 items-center justify-center bg-bloop-card text-bloop-red">
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
                        <span className="font-bloop-body text-[11px] font-medium text-bloop-ink/50">
                          {item.date}
                        </span>
                        <span className="mt-0.5 block font-bangla text-[14px] font-semibold leading-5 text-bloop-ink">
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Below the fold */}
        <div className="mx-auto w-full max-w-[1360px] px-4 md:px-6 lg:px-10">
          <div className="mx-auto max-w-[760px]">
          <nav aria-label="Product sections" className="no-scrollbar -mx-4 flex gap-x-5 overflow-x-auto whitespace-nowrap px-4 pb-2 pt-6 md:mx-0 md:gap-x-7 md:px-0 md:pt-10">
            {anchorLinks.map((link) => {
              const active = activeSection === link.href.slice(1);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => scrollToSection(event, link.href)}
                  aria-current={active ? "location" : undefined}
                  className={`shrink-0 font-bloop text-[16px] font-bold underline decoration-2 underline-offset-[6px] transition-colors hover:opacity-70 md:text-[18px] ${
                    active ? "text-bloop-ink/70" : "text-bloop-red"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          <section id="product-description" className="scroll-mt-24 pt-14 md:pt-20">
            <p className="font-bloop text-[12px] font-bold uppercase tracking-[0.06em] text-bloop-ink">Product details</p>
            <h2 className="bloop-gradient-text mt-4 break-words pb-2 font-bloop text-[clamp(40px,8vw,88px)] font-bold leading-[0.95] tracking-[-0.04em]">
              {product.name}
            </h2>
            {/* Text only — no product imagery in the details block. */}
            <div className="mt-8 max-w-[70ch] font-bloop-body text-[15px] leading-[1.7] text-bloop-ink/85 md:mt-10">
              {product.description ? (
                <p className="whitespace-pre-line">{product.description}</p>
              ) : null}
            </div>
          </section>

          {detailSections.length ? (
            <section id="product-details" aria-label="Product information" className="scroll-mt-24 pt-14 md:pt-20">
              <div className="border-t border-bloop-ink/15">
                {detailSections.map((item, i) => {
                  const open = openSection === i;
                  return (
                    <div key={item.label} className="border-b border-bloop-ink/15">
                      <button
                        type="button"
                        id={`product-detail-trigger-${i}`}
                        aria-expanded={open}
                        aria-controls={`product-detail-panel-${i}`}
                        onClick={() => setOpenSection(open ? null : i)}
                        className="flex w-full items-center justify-between gap-4 py-5 text-left text-bloop-ink transition-opacity hover:opacity-70"
                      >
                        <span className="font-bangla text-[17px] font-semibold">{item.label}</span>
                        {open ? (
                          <Minus className="h-5 w-5 shrink-0" aria-hidden="true" />
                        ) : (
                          <Plus className="h-5 w-5 shrink-0" aria-hidden="true" />
                        )}
                      </button>
                      <AnimatePresence initial={false}>
                        {open ? (
                          <motion.div
                            key="panel"
                            id={`product-detail-panel-${i}`}
                            role="region"
                            aria-labelledby={`product-detail-trigger-${i}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2 pb-6 text-left">
                              {item.body?.map((paragraph, idx) => (
                                <p key={idx} className="font-bloop-body text-[14px] leading-[1.7] text-bloop-ink/75">
                                  {paragraph}
                                </p>
                              ))}
                              {item.details?.length ? (
                                <ul className="max-w-[720px] space-y-1 pt-1 text-left">
                                  {item.details.map((detail, detailIndex) => (
                                    <li
                                      key={detail}
                                      className="grid w-full max-w-full grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-2 font-bloop-body text-[14px] font-medium leading-6 text-bloop-ink/80"
                                    >
                                      <span
                                        className="w-6 text-right font-normal tabular-nums text-bloop-red"
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
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
          </div>

          {/* Reels Section — smooth horizontal carousel */}
          <section id="product-reels" className="-mx-4 scroll-mt-24 overflow-hidden pt-14 md:mx-0 md:pt-20">
            <h2 className="mb-6 px-4 text-center font-bangla text-[clamp(28px,5vw,44px)] font-bold leading-[1.1] text-bloop-red md:mb-8">
              আমরা ও আমাদের সত্যতা
            </h2>
            <div className="relative mx-auto w-full max-w-none md:max-w-[1100px]">
              <div ref={reelRef} className="overflow-hidden [touch-action:pan-y_pinch-zoom] overscroll-x-contain">
                <div className="flex will-change-transform gap-0 px-0 md:gap-6">
                  {reelMedia.map(({ src, poster }, i) => (
                    <div key={src} className="mr-3 min-w-0 shrink-0 basis-[60vw] md:mr-0 md:basis-[calc((100%_-_3rem)_/_3)]">
                      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[20px] bg-black">
                        {isGlassWaterBottleMuxProduct ? (
                          i === currentReel ? (
                            <div className="absolute inset-0">
                              <VideoPlayer poster={poster} title={`Angonaloy reel ${i + 1}`}>
                                <VideoSkin className="absolute inset-0 h-full w-full [--media-border-radius:0px]">
                                  <MuxVideo
                                    src={src}
                                    playsInline
                                    preload="metadata"
                                    className="h-full w-full object-contain bg-black"
                                  />
                                  <PlayButton
                                    className="absolute left-1/2 top-1/2 z-30 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-bloop-cream/90 text-bloop-ink shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                                    render={(props, state) => (
                                      <button {...props}>
                                        {state.paused ? (
                                          <Play className="ml-1 h-7 w-7 fill-current" />
                                        ) : (
                                          <Pause className="h-7 w-7 fill-current" />
                                        )}
                                      </button>
                                    )}
                                  />
                                </VideoSkin>
                              </VideoPlayer>
                            </div>
                          ) : (
                            <button type="button" aria-label={`Select reel ${i + 1}`} onClick={() => selectReel(i)} className="absolute inset-0 z-10 h-full w-full">
                              <img
                                src={poster}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                decoding="async"
                                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                              />
                            </button>
                          )
                        ) : (
                          <>
                            {i === currentReel ? (
                              <video
                                src={src}
                                title={`Angonaloy reel ${i + 1}`}
                                poster={poster}
                                controls
                                playsInline
                                preload="metadata"
                                onPlay={() => setPlayingReel(i)}
                                onPlaying={() => setPlayingReel(i)}
                                onPause={() => setPlayingReel((active) => (active === i ? null : active))}
                                onEnded={() => setPlayingReel((active) => (active === i ? null : active))}
                                ref={(video) => {
                                  activeReelVideoRef.current = video;
                                }}
                                onPointerDown={(event) => event.stopPropagation()}
                                className="h-full w-full object-contain bg-black"
                              />
                            ) : null}
                            {i !== currentReel ? (
                              <button type="button" aria-label={`Select reel ${i + 1}`} onClick={() => selectReel(i)} className="absolute inset-0 h-full w-full">
                                <img
                                  src={poster}
                                  alt=""
                                  aria-hidden="true"
                                  loading="lazy"
                                  decoding="async"
                                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                                />
                              </button>
                            ) : null}
                          </>
                        )}
                        {!isGlassWaterBottleMuxProduct && i === currentReel ? (
                          <button
                            type="button"
                            aria-label={playingReel === i ? `Pause reel ${i + 1}` : `Play reel ${i + 1}`}
                            aria-pressed={playingReel === i}
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => {
                              const video = activeReelVideoRef.current;
                              if (!video) return;
                              if (video.paused) {
                                video.muted = false;
                                void video.play().catch(() => setPlayingReel(null));
                              } else {
                                video.pause();
                              }
                            }}
                            className="absolute left-1/2 top-1/2 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-bloop-cream/90 text-bloop-ink shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                          >
                            {playingReel === i ? (
                              <Pause className="h-6 w-6 fill-current" />
                            ) : (
                              <Play className="ml-1 h-6 w-6 fill-current" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-5 pb-2 pt-5">
              <button
                type="button"
                aria-label="Previous reel"
                onClick={() => goReel(-1)}
                className="flex h-10 w-12 items-center justify-center text-bloop-ink transition-opacity hover:opacity-60"
              >
                <MoveLeft className="h-6 w-10" strokeWidth={1.25} aria-hidden="true" />
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: reelCount }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to reel ${i + 1}`}
                    onClick={() => selectReel(i)}
                    className={`h-1.5 rounded-full transition-all ${i === currentReel ? "w-5 bg-bloop-ink" : "w-1.5 bg-bloop-ink/25"}`}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Next reel"
                onClick={() => goReel(1)}
                className="flex h-10 w-12 items-center justify-center text-bloop-ink transition-opacity hover:opacity-60"
              >
                <MoveRight className="h-6 w-10" strokeWidth={1.25} aria-hidden="true" />
              </button>
            </div>
          </section>
        </div>

        {/* You May Also Like Section */}
        {relatedProducts.length ? (
          <section id="you-may-also-like" className="w-full scroll-mt-24 pb-12 pt-16 md:pb-20 md:pt-24">
            <motion.div
              initial="hidden"
              animate="visible"
              transition={{ staggerChildren: 0.12 }}
              className="mx-auto w-full max-w-[1360px] px-4 md:px-6 lg:px-10"
            >
              <motion.div variants={reveal} transition={transition} className="mb-8 text-center md:mb-12">
                <h2 className="font-bloop text-[clamp(40px,6vw,72px)] font-bold leading-[0.95] tracking-[-0.04em] text-bloop-red">
                  You may also like
                </h2>
                <p className="mt-3 font-bangla text-[16px] font-medium text-bloop-ink/70 md:text-[18px]">আমাদের আরও কিছু পণ্য</p>
              </motion.div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-8 md:gap-x-4 lg:grid-cols-4">
                {relatedProducts.map((p) => (
                  <HomeProductCard key={p.slug} product={p} />
                ))}
              </div>

              <div className="mt-10 flex justify-center md:mt-14">
                <Link
                  href="/products"
                  className="bloop-pill border-bloop-red bg-bloop-red px-10 py-3 font-bloop text-[15px] font-bold text-bloop-cream hover:border-bloop-ink hover:bg-bloop-ink"
                >
                  View all
                </Link>
              </div>
            </motion.div>
          </section>
        ) : null}

        <RecentlyViewed products={relatedSource} excludeSlug={product?.slug} />
      </div>

      {/* Mobile sticky mini bar — sits above the site's floating bottom nav.
          Portaled to <body>: the page-transition wrapper's CSS filter would
          otherwise become the containing block for position: fixed. */}
      {typeof document !== "undefined" ? createPortal(
      <AnimatePresence>
        {showMiniBar ? (
          <motion.div
            key="product-mini-bar"
            initial={shouldReduceMotion ? { opacity: 0 } : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: 24, opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[70] flex items-center gap-3 rounded-[20px] bg-bloop-cream p-2 pr-2.5 shadow-[0_10px_30px_rgba(31,26,23,0.18)] md:hidden"
            data-testid="product-mini-bar"
          >
            {displayImage ? (
              <img src={displayImage} alt="" aria-hidden="true" className="h-12 w-12 shrink-0 rounded-[12px] bg-bloop-card object-cover" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate font-bloop text-[14px] font-bold leading-tight text-bloop-ink">{product.name}</p>
              <p className="mt-0.5 flex min-w-0 items-center gap-2 text-[12px] leading-tight text-bloop-ink/70">
                <span className="shrink-0 font-bloop font-bold text-bloop-ink">৳{heroDisplayAmount.toLocaleString()}</span>
                {miniBarDetail ? <span className="truncate font-bangla">{miniBarDetail}</span> : null}
              </p>
            </div>
            <button
              type="button"
              aria-label="ক্যাশ অন ডেলিভারিতে অর্ডার করুন"
              disabled={isUnavailable || pricedBundle.amount <= 0}
              onClick={openOrderDialog}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bloop-red text-bloop-cream transition-colors hover:bg-bloop-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BagIcon className="h-6 w-6" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
      ) : null}

      <OrderDialog open={orderOpen} onOpenChange={setOrderOpen} bundle={orderBundle} />
    </Layout>
  );
}
