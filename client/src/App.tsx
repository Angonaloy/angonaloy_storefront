import { Switch, Route, useLocation } from "wouter";
import { AnimatePresence, motion, useIsPresent } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/cart-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ProductPage from "@/pages/product";
import ProductsPage from "@/pages/products";
import BookingPage from "@/pages/booking";
import SundarbansHoneyPage from "@/pages/sundarbans-honey";
import SundarbansHoneyThankYouPage from "@/pages/sundarbans-honey-thank-you";
import KalojiraMixedPage from "@/pages/kalojira-mixed";
import KalojiraMixedThankYouPage from "@/pages/kalojira-mixed-thank-you";
import HoneyNutPage from "@/pages/honey-nut";
import HoneyNutThankYouPage from "@/pages/honey-nut-thank-you";
import CollectionPage from "@/pages/collection";
import SiteInformationPage from "@/pages/site-information";
import { SITE_PAGES } from "@/lib/site-pages";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const CAMPAIGN_PAGE_TITLES: Record<string, string> = {
  "/step/sundarbans-natural-honey": "সুন্দরবনের প্রাকৃতিক মধু | ম্যাংগো লাভার",
  "/step/sundarbans-natural-honey/thank-you": "অর্ডারের জন্য ধন্যবাদ | ম্যাংগো লাভার",
  "/step/kalojira-mixed": "কালোজিরা মিক্সড | ম্যাংগো লাভার",
  "/step/kalojira-mixed/thank-you": "কালোজিরা মিক্সড অর্ডারের জন্য ধন্যবাদ | ম্যাংগো লাভার",
  "/step/honey-nut": "হানি নাট | ম্যাংগো লাভার",
  "/step/honey-nut/thank-you": "হানি নাট অর্ডারের জন্য ধন্যবাদ | ম্যাংগো লাভার",
};

function CampaignMetadata({ location }: { location: string }) {
  const pathname = location.endsWith("/") ? location.slice(0, -1) : location;
  const pageTitle = CAMPAIGN_PAGE_TITLES[pathname];

  useEffect(() => {
    if (!pageTitle) {
      return;
    }

    const previousTitle = document.title;
    let robots = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const previousRobotsContent = robots?.getAttribute("content") ?? null;

    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }

    document.title = pageTitle;
    robots.content = "noindex, nofollow";

    return () => {
      document.title = previousTitle;
      if (previousRobotsContent === null) {
        robots.remove();
      } else {
        robots.content = previousRobotsContent;
      }
    };
  }, [pageTitle]);

  return null;
}

function PageTransition({ children }: { children: ReactNode }) {
  const isPresent = useIsPresent();
  const ref = useRef<HTMLDivElement>(null);
  const [exitStyle, setExitStyle] = useState<CSSProperties | undefined>(undefined);

  useLayoutEffect(() => {
    if (!isPresent && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setExitStyle({
        position: "fixed",
        top: r.top,
        left: r.left,
        width: r.width,
        zIndex: 50,
        opacity: 1,
      });
    }
  }, [isPresent]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={isPresent ? { zIndex: 60, willChange: "opacity" } : exitStyle}
    >
      {children}
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();
  const scrollPositions = useRef(new Map<string, number>());
  const currentLocation = useRef(location);
  const isHistoryNavigation = useRef(false);
  const isInitialLoad = useRef(true);

  const restoreScrollPosition = (top: number) => {
    const restoreScroll = () => window.scrollTo({ top, left: 0, behavior: "auto" });
    window.requestAnimationFrame(restoreScroll);
    [80, 240, 520, 900, 1300].forEach((delay) => {
      window.setTimeout(restoreScroll, delay);
    });
  };

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const saveCurrentScroll = () => {
      scrollPositions.current.set(currentLocation.current, window.scrollY);
    };

    const saveBeforeInternalNavigation = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.origin === window.location.origin) {
        saveCurrentScroll();
      }
    };

    const markHistoryNavigation = () => {
      saveCurrentScroll();
      isHistoryNavigation.current = true;
      const targetLocation = `${window.location.pathname}${window.location.search}`;
      const savedY = scrollPositions.current.get(targetLocation);
      if (savedY !== undefined) {
        restoreScrollPosition(savedY);
      }
    };

    window.addEventListener("scroll", saveCurrentScroll, { passive: true });
    document.addEventListener("click", saveBeforeInternalNavigation, true);
    document.addEventListener("touchstart", saveBeforeInternalNavigation, { capture: true, passive: true });
    window.addEventListener("popstate", markHistoryNavigation);
    window.addEventListener("beforeunload", saveCurrentScroll);

    return () => {
      window.removeEventListener("scroll", saveCurrentScroll);
      document.removeEventListener("click", saveBeforeInternalNavigation, true);
      document.removeEventListener("touchstart", saveBeforeInternalNavigation, true);
      window.removeEventListener("popstate", markHistoryNavigation);
      window.removeEventListener("beforeunload", saveCurrentScroll);
    };
  }, []);

  useLayoutEffect(() => {
    // On a full page load (refresh), the browser has already restored the
    // scroll position — forcing it to 0 here causes a visible flick to the hero.
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      currentLocation.current = location;
      return;
    }

    const savedY = scrollPositions.current.get(location);
    const targetY = isHistoryNavigation.current && savedY !== undefined ? savedY : 0;
    isHistoryNavigation.current = false;
    currentLocation.current = location;

    // Restore synchronously before paint so the entering page is already at its
    // final scroll position when it fades in — avoids mid-fade scrolling jank.
    window.scrollTo({ top: targetY, left: 0, behavior: "auto" });
    const timeoutIds = [120, 400].map((delay) =>
      window.setTimeout(
        () => window.scrollTo({ top: targetY, left: 0, behavior: "auto" }),
        delay,
      ),
    );

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [location]);

  return (
    <>
      <CampaignMetadata location={location} />
      <AnimatePresence>
        <Switch location={location} key={location}>
          <Route path="/step/sundarbans-natural-honey/thank-you">
            <PageTransition><SundarbansHoneyThankYouPage /></PageTransition>
          </Route>
          <Route path="/step/sundarbans-natural-honey">
            <PageTransition><SundarbansHoneyPage /></PageTransition>
          </Route>
          <Route path="/step/kalojira-mixed/thank-you">
            <PageTransition><KalojiraMixedThankYouPage /></PageTransition>
          </Route>
          <Route path="/step/kalojira-mixed">
            <PageTransition><KalojiraMixedPage /></PageTransition>
          </Route>
          <Route path="/step/honey-nut/thank-you">
            <PageTransition><HoneyNutThankYouPage /></PageTransition>
          </Route>
          <Route path="/step/honey-nut">
            <PageTransition><HoneyNutPage /></PageTransition>
          </Route>
          <Route path="/">
            <PageTransition>
              <Home />
            </PageTransition>
          </Route>
          <Route path="/products">
            <PageTransition>
              <ProductsPage />
            </PageTransition>
          </Route>
          <Route path="/collection/:slug">
            {(params) => (
              <PageTransition key={params.slug}>
                <CollectionPage params={params} />
              </PageTransition>
            )}
          </Route>
          {Object.values(SITE_PAGES).map((page) => (
            <Route key={page.slug} path={`/${page.slug}`}>
              <PageTransition>
                <SiteInformationPage page={page} />
              </PageTransition>
            </Route>
          ))}
          <Route path="/booking">
            <PageTransition>
              <BookingPage />
            </PageTransition>
          </Route>
          <Route path="/product/:id">
            {(params) => (
              <PageTransition key={params.id}>
                <ProductPage params={params} />
              </PageTransition>
            )}
          </Route>
          <Route>
            <PageTransition>
              <NotFound />
            </PageTransition>
          </Route>
        </Switch>
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
