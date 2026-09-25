import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Story } from "react-insta-stories/dist/interfaces";
import { getProductsForCollection, type FeaturedCollection } from "@/lib/featured-collections";
import { getProductImage, type StorefrontProduct } from "@/lib/storefront-products";

// The story library is only fetched when a ring is opened, so it stays out of
// the initial homepage bundle.
const ReactInstaStories = lazy(() => import("react-insta-stories"));

const SEEN_STORAGE_KEY = "angonaloy:collection-stories:seen";
const STORY_INTERVAL_MS = 5000;
const HOLD_DELAY_MS = 200;
const TAP_MOVE_TOLERANCE_PX = 10;
const SWIPE_DISTANCE_PX = 60;
const SWIPE_DOWN_DISTANCE_PX = 110;
const BLOOP_CLOSE_PATH =
  "M20.707 4.70697L19.293 3.29297L12 10.586L4.707 3.29297L3.293 4.70697L10.586 12L3.293 19.293L4.707 20.707L12 13.414L19.293 20.707L20.707 19.293L13.414 12L20.707 4.70697Z";

type StoryCollection = {
  collection: FeaturedCollection;
  products: StorefrontProduct[];
  signature: string;
  name: string;
};

type SeenStories = Record<string, string>;

function readSeenStories(): SeenStories {
  try {
    const raw = window.localStorage.getItem(SEEN_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as SeenStories) : {};
  } catch {
    return {};
  }
}

function writeSeenStories(seen: SeenStories) {
  try {
    window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(seen));
  } catch {
    // Storage unavailable (private mode / blocked): seen state stays in memory.
  }
}

function formatStoryAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `৳${amount.toLocaleString("en-US")}` : "৳0";
}

function getStoryPrice(product: StorefrontProduct) {
  const currentPrice = Number(product.variants?.[0]?.price ?? product.price);
  const compareAtPrice = Number(product.compare_at_price);
  const hasDiscount = Number.isFinite(currentPrice) && Number.isFinite(compareAtPrice) && compareAtPrice > currentPrice;
  return { currentPrice, compareAtPrice, hasDiscount };
}

function getRingLabel({ slug, label }: FeaturedCollection) {
  const featuredCategoryLabel = slug === "functional-food" ? "Functional-ফুড" : label;
  const separator = featuredCategoryLabel.includes("-") ? "-" : " ";
  const separatorIndex = featuredCategoryLabel.indexOf(separator);
  return {
    primary: featuredCategoryLabel.slice(0, separatorIndex),
    secondary: featuredCategoryLabel.slice(separatorIndex + 1),
  };
}

// Collections without category artwork use their first assigned product's live image.
function getStoryCollectionImage({ collection, products }: StoryCollection) {
  return collection.image || (products[0] ? getProductImage(products[0]) : "");
}

function isFocusable(element: HTMLElement) {
  return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
}

function preloadImage(src: string) {
  if (!src) return;
  const image = new Image();
  image.decoding = "async";
  image.src = src;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d={BLOOP_CLOSE_PATH} />
    </svg>
  );
}

function StorySlide({
  product,
  collectionSlug,
  onNavigate,
}: {
  product: StorefrontProduct;
  collectionSlug: string;
  onNavigate: () => void;
}) {
  const image = getProductImage(product);
  const { currentPrice, compareAtPrice, hasDiscount } = getStoryPrice(product);

  return (
    <div className="relative h-full w-full overflow-hidden bg-bloop-ink [-webkit-touch-callout:none]">
      {image ? (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 h-full w-full scale-150 object-cover opacity-60 blur-3xl saturate-150"
        />
      ) : null}
      <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
      <div className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+228px)] top-[calc(env(safe-area-inset-top)+92px)] flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={product.name}
            draggable={false}
            className="max-h-full max-w-full rounded-[20px] object-contain shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
          />
        ) : (
          <span className="text-[11px] uppercase tracking-[0.3em] text-bloop-cream/50">No image</span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-[calc(env(safe-area-inset-bottom)+22px)] text-center">
        <p className="line-clamp-2 font-bloop text-[22px] font-bold leading-[1.15] tracking-[-0.01em] text-bloop-cream">
          {product.name}
        </p>
        <div className="mt-2 flex items-baseline justify-center gap-x-2">
          <span className={`text-[18px] font-bold ${hasDiscount ? "text-[#FF6B5E]" : "text-bloop-cream"}`}>
            {formatStoryAmount(currentPrice)}
          </span>
          {hasDiscount ? (
            <span className="text-[15px] text-bloop-cream/55 line-through">{formatStoryAmount(compareAtPrice)}</span>
          ) : null}
          {product.available === false ? (
            <span className="rounded-full bg-bloop-cream/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-bloop-ink">
              Sold out
            </span>
          ) : null}
        </div>
        <Link
          href={`/product/${product.slug}`}
          onClick={onNavigate}
          className="mt-4 flex h-14 w-full max-w-[320px] items-center justify-center rounded-full bg-bloop-red text-[16px] font-semibold text-white transition-colors hover:bg-black"
        >
          View product
        </Link>
        <Link
          href={`/collection/${collectionSlug}`}
          onClick={onNavigate}
          className="mt-3 text-[13px] font-semibold text-bloop-cream/80 underline decoration-bloop-cream/40 underline-offset-4 hover:text-bloop-cream"
        >
          Shop collection
        </Link>
      </div>
    </div>
  );
}

function CollectionStoryPanel({
  entry,
  isPaused,
  onSlideStart,
  onCollectionEnd,
  onNavigate,
  slideTarget,
}: {
  entry: StoryCollection;
  isPaused: boolean;
  onSlideStart: (index: number) => void;
  onCollectionEnd: () => void;
  onNavigate: () => void;
  slideTarget: number | undefined;
}) {
  const productsRef = useRef(entry.products);
  productsRef.current = entry.products;
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  // Keyed by the product signature so catalog polling does not reset progress.
  const stories = useMemo<Story[]>(
    () =>
      productsRef.current.map((product) => ({
        content: () => (
          <StorySlide
            product={product}
            collectionSlug={entry.collection.slug}
            onNavigate={() => onNavigateRef.current()}
          />
        ),
      })),
    [entry.collection.slug, entry.signature],
  );
  const lastIndex = stories.length - 1;

  return (
    <div className="absolute inset-0">
      <Suspense fallback={null}>
        <ReactInstaStories
          stories={stories}
          width="100%"
          height="100%"
          defaultInterval={STORY_INTERVAL_MS}
          isPaused={isPaused}
          currentIndex={slideTarget}
          preventDefault
          keyboardNavigation={false}
          onStoryStart={(index: number) => onSlideStart(index)}
          onStoryEnd={(index: number) => {
            if (index >= lastIndex) onCollectionEnd();
          }}
          storyContainerStyles={{ background: "#111", overflow: "hidden" }}
          progressContainerStyles={{
            width: "100%",
            padding: "0 10px",
            paddingTop: "calc(env(safe-area-inset-top) + 10px)",
            filter: "drop-shadow(0 1px 4px rgba(0, 0, 0, 0.3))",
          }}
          progressWrapperStyles={{ height: 3, margin: "0 2px", background: "rgba(255, 251, 241, 0.32)" }}
          progressStyles={{ background: "#FFFBF1" }}
        />
      </Suspense>
      <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+24px)] z-[1100] flex h-11 items-center gap-2.5 pl-3 pr-16">
        <span className="block h-9 w-9 shrink-0 rounded-full bg-[linear-gradient(45deg,#F08A3C,#DB2828)] p-[2px]">
          <span className="block h-full w-full rounded-full bg-bloop-cream p-[2px]">
            <img src={getStoryCollectionImage(entry)} alt="" className="h-full w-full rounded-full object-cover" />
          </span>
        </span>
        <span className="truncate font-bloop text-[15px] font-bold text-bloop-cream [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">
          {entry.name}
        </span>
      </div>
    </div>
  );
}

// An exiting collection panel stays mounted while it slides out; keep it out of
// the tab order and away from taps until it is removed.
function PresenceInert({ children }: { children: ReactNode }) {
  const isPresent = useIsPresent();
  return (
    <div className="absolute inset-0" inert={!isPresent} aria-hidden={isPresent ? undefined : true}>
      {children}
    </div>
  );
}

function CollectionStoriesViewer({
  storyCollections,
  startIndex,
  onClose,
  onCollectionShown,
}: {
  storyCollections: StoryCollection[];
  startIndex: number;
  onClose: () => void;
  onCollectionShown: (entry: StoryCollection) => void;
}) {
  const isPresent = useIsPresent();
  const prefersReducedMotion = useReducedMotion();
  const [collectionIndex, setCollectionIndex] = useState(startIndex);
  const [direction, setDirection] = useState(1);
  const [slideTarget, setSlideTarget] = useState<number | undefined>(undefined);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHoldPaused, setIsHoldPaused] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const slideIndexRef = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const gestureRef = useRef<{ x: number; y: number; time: number; held: boolean; timer: number } | null>(null);

  const entry = storyCollections[collectionIndex];

  const goToCollection = useCallback(
    (delta: number) => {
      const nextIndex = collectionIndex + delta;
      if (nextIndex >= storyCollections.length) {
        onClose();
        return;
      }
      if (nextIndex < 0) {
        // Already at the very first slide: restart it (remount the story).
        slideIndexRef.current = 0;
        setSlideTarget(undefined);
        setCurrentSlide(0);
        setRestartKey((key) => key + 1);
        return;
      }
      slideIndexRef.current = 0;
      setDirection(delta > 0 ? 1 : -1);
      setSlideTarget(undefined);
      setCurrentSlide(0);
      setCollectionIndex(nextIndex);
    },
    [collectionIndex, onClose, storyCollections.length],
  );

  const goToSlide = useCallback((index: number) => {
    slideIndexRef.current = index;
    setSlideTarget(index);
  }, []);

  const goNext = useCallback(() => {
    if (!entry) return;
    if (slideIndexRef.current < entry.products.length - 1) {
      goToSlide(slideIndexRef.current + 1);
    } else {
      goToCollection(1);
    }
  }, [entry, goToCollection, goToSlide]);

  const goPrevious = useCallback(() => {
    if (slideIndexRef.current > 0) {
      goToSlide(slideIndexRef.current - 1);
    } else {
      goToCollection(-1);
    }
  }, [goToCollection, goToSlide]);

  const handleSlideStart = useCallback((index: number) => {
    slideIndexRef.current = index;
    setCurrentSlide(index);
    // The library applies currentIndex on change only; clearing it lets the
    // next tap target any slide, including one that was targeted before.
    setSlideTarget(undefined);
  }, []);

  useEffect(() => {
    if (entry) onCollectionShown(entry);
  }, [entry, onCollectionShown]);

  useEffect(() => {
    if (!entry && isPresent) onClose();
  }, [entry, isPresent, onClose]);

  // Lock page scroll only while present; a layout effect so the lock is
  // released before App's route-change scroll reset runs.
  useLayoutEffect(() => {
    if (!isPresent) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPresent]);

  useEffect(() => {
    closeButtonRef.current?.focus({ preventScroll: true });
  }, []);

  // Keep focus on a visible control when an arrow hides at either end.
  useEffect(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !dialogRef.current?.contains(active) || !isFocusable(active)) {
      closeButtonRef.current?.focus({ preventScroll: true });
    }
  }, [collectionIndex]);

  useEffect(() => {
    if (!isPresent) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab" && dialogRef.current) {
        // Focus trap: cycle through the dialog's visible controls only.
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
        ).filter(isFocusable);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        const isInside = active instanceof HTMLElement && focusable.includes(active);
        if (event.shiftKey && (!isInside || active === first)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (!isInside || active === last)) {
          event.preventDefault();
          first.focus();
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrevious, isPresent, onClose]);

  useEffect(() => {
    if (!entry) return;
    const nextProduct = entry.products[currentSlide + 1];
    if (nextProduct) preloadImage(getProductImage(nextProduct));
    const nextCollection = storyCollections[collectionIndex + 1];
    if (nextCollection?.products[0]) preloadImage(getProductImage(nextCollection.products[0]));
  }, [collectionIndex, currentSlide, entry, storyCollections]);

  const endGesture = useCallback(
    (event: PointerEvent, surface: HTMLElement) => {
      const gesture = gestureRef.current;
      gestureRef.current = null;
      if (!gesture) return;
      window.clearTimeout(gesture.timer);
      setIsHoldPaused(false);
      if (event.type === "pointercancel") return;

      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (Math.abs(dx) > SWIPE_DISTANCE_PX && Math.abs(dx) > Math.abs(dy)) {
        goToCollection(dx < 0 ? 1 : -1);
        return;
      }
      if (dy > SWIPE_DOWN_DISTANCE_PX && dy > Math.abs(dx)) {
        onClose();
        return;
      }
      if (gesture.held || Math.hypot(dx, dy) > TAP_MOVE_TOLERANCE_PX) return;

      const bounds = surface.getBoundingClientRect();
      if (event.clientX - bounds.left < bounds.width / 3) {
        goPrevious();
      } else {
        goNext();
      }
    },
    [goNext, goPrevious, goToCollection, onClose],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Buttons and links inside the story handle their own clicks.
    if (!event.isPrimary || (event.target as Element).closest("a, button")) return;
    const surface = event.currentTarget;
    const timer = window.setTimeout(() => {
      if (gestureRef.current) {
        gestureRef.current.held = true;
        setIsHoldPaused(true);
      }
    }, HOLD_DELAY_MS);
    gestureRef.current = { x: event.clientX, y: event.clientY, time: Date.now(), held: false, timer };
    const finish = (nativeEvent: PointerEvent) => {
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      endGesture(nativeEvent, surface);
    };
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  useEffect(
    () => () => {
      if (gestureRef.current) window.clearTimeout(gestureRef.current.timer);
    },
    [],
  );

  if (typeof document === "undefined") return null;

  const instant = { duration: 0 };
  const hasPrevious = collectionIndex > 0;
  const hasNext = collectionIndex < storyCollections.length - 1;
  const arrowClassName =
    "hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bloop-cream text-bloop-ink transition-colors hover:bg-white md:flex";

  return createPortal(
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${entry?.name ?? "Collection"} stories`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={prefersReducedMotion ? instant : { duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[200] flex items-center justify-center gap-6 bg-[#111] md:bg-black/85 md:backdrop-blur-md"
    >
      <button
        type="button"
        onClick={() => goToCollection(-1)}
        aria-label="Previous collection"
        className={`${arrowClassName} ${hasPrevious ? "" : "invisible"}`}
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2} />
      </button>

      <motion.div
        initial={prefersReducedMotion ? false : { scale: 0.96 }}
        animate={{ scale: 1 }}
        exit={prefersReducedMotion ? undefined : { scale: 0.96 }}
        transition={prefersReducedMotion ? instant : { duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
        className="relative h-[100dvh] w-full overflow-hidden bg-[#111] md:aspect-[9/16] md:h-[min(90vh,860px)] md:w-auto md:rounded-[20px]"
      >
        <AnimatePresence initial={false} custom={direction}>
          {entry ? (
            <motion.div
              key={entry.collection.slug}
              custom={direction}
              variants={{
                enter: (dir: number) => (prefersReducedMotion ? { x: 0 } : { x: dir > 0 ? "100%" : "-100%" }),
                center: { x: 0 },
                exit: (dir: number) => (prefersReducedMotion ? { x: 0, opacity: 0 } : { x: dir > 0 ? "-100%" : "100%" }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={prefersReducedMotion ? instant : { type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              drag={!prefersReducedMotion}
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.5}
              dragMomentum={false}
              onPointerDown={handlePointerDown}
              onContextMenu={(event) => event.preventDefault()}
              className="absolute inset-0 touch-none select-none"
            >
              <PresenceInert>
                <CollectionStoryPanel
                  key={restartKey}
                  entry={entry}
                  isPaused={isHoldPaused}
                  slideTarget={slideTarget}
                  onSlideStart={handleSlideStart}
                  onCollectionEnd={() => goToCollection(1)}
                  onNavigate={onClose}
                />
              </PresenceInert>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close stories"
          className="absolute right-3 top-[calc(env(safe-area-inset-top)+24px)] z-[1200] flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#333] text-white transition-colors hover:bg-black"
        >
          <CloseIcon />
        </button>
      </motion.div>

      <button
        type="button"
        onClick={() => goToCollection(1)}
        aria-label="Next collection"
        className={`${arrowClassName} ${hasNext ? "" : "invisible"}`}
      >
        <ChevronRight className="h-6 w-6" strokeWidth={2} />
      </button>
    </motion.div>,
    document.body,
  );
}

export default function CollectionStories({
  collections,
  products,
}: {
  collections: readonly FeaturedCollection[];
  products: StorefrontProduct[];
}) {
  const [location] = useLocation();
  const [seenStories, setSeenStories] = useState<SeenStories>(() => readSeenStories());
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ringRefs = useRef(new Map<string, HTMLButtonElement>());
  const openerSlugRef = useRef<string | null>(null);

  const storyCollections = collections
    .map((collection) => {
      const collectionProducts = getProductsForCollection(products, collection);
      return {
        collection,
        products: collectionProducts,
        signature: collectionProducts.map((product) => String(product.id ?? product.slug)).join(","),
        name: collection.label.split("-")[0].trim(),
      };
    })
    .filter((entry) => entry.products.length > 0);

  const closeViewer = useCallback(() => setOpenIndex(null), []);

  const markSeen = useCallback((entry: StoryCollection) => {
    setSeenStories((previous) => {
      if (previous[entry.collection.slug] === entry.signature) return previous;
      const next = { ...previous, [entry.collection.slug]: entry.signature };
      writeSeenStories(next);
      return next;
    });
  }, []);

  useEffect(() => {
    setOpenIndex(null);
  }, [location]);

  const returnFocusToRing = () => {
    const slug = openerSlugRef.current;
    openerSlugRef.current = null;
    if (slug && window.location.pathname === "/") {
      ringRefs.current.get(slug)?.focus({ preventScroll: true });
    }
  };

  return (
    <section className="w-full bg-bloop-cream pt-4 md:pt-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="no-scrollbar flex gap-3 overflow-x-auto px-3 pb-1 md:justify-center md:gap-5 md:overflow-visible md:px-8"
      >
        {storyCollections.map((entry, index) => {
          const { collection, signature, name } = entry;
          const { primary, secondary } = getRingLabel(collection);
          const isUnseen = seenStories[collection.slug] !== signature;

          return (
            <button
              key={collection.slug}
              type="button"
              ref={(element) => {
                if (element) ringRefs.current.set(collection.slug, element);
                else ringRefs.current.delete(collection.slug);
              }}
              onClick={() => {
                openerSlugRef.current = collection.slug;
                setOpenIndex(index);
              }}
              aria-label={`Open ${name} stories`}
              data-story-state={isUnseen ? "unseen" : "seen"}
              className="group flex w-[84px] shrink-0 cursor-pointer flex-col items-center text-center md:w-[80px]"
            >
              <span
                className={`block h-[84px] w-[84px] rounded-full p-[3px] md:h-[72px] md:w-[72px] ${
                  isUnseen ? "bg-[linear-gradient(45deg,#F08A3C,#DB2828)]" : "bg-bloop-ink/15"
                }`}
              >
                <span className="block h-full w-full rounded-full bg-bloop-cream p-[3px]">
                  <img
                    src={getStoryCollectionImage(entry)}
                    alt=""
                    loading={index < 4 ? "eager" : "lazy"}
                    fetchPriority={index < 4 ? "high" : "auto"}
                    className="h-full w-full rounded-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </span>
              </span>
              <span className="mt-1.5 block font-bloop text-[12px] font-bold leading-tight text-bloop-ink md:text-[13px]">
                <span className="block">{primary}</span>
                <span className="block font-bangla font-medium text-bloop-ink/70">{secondary}</span>
              </span>
            </button>
          );
        })}
      </motion.div>

      <AnimatePresence onExitComplete={returnFocusToRing}>
        {openIndex !== null ? (
          <CollectionStoriesViewer
            key="collection-stories-viewer"
            storyCollections={storyCollections}
            startIndex={openIndex}
            onClose={closeViewer}
            onCollectionShown={markSeen}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
