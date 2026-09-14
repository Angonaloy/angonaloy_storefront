import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { CampaignFooter, CampaignHeader } from "@/features/kalojira-mixed/campaign-layout";
import { DocumentarySections, ProductGallery } from "@/features/kalojira-mixed/documentary-sections";
import { KalojiraCheckout } from "@/features/kalojira-mixed/kalojira-checkout";
import { resolveKalojiraCheckoutStatus } from "@/features/kalojira-mixed/checkout-state";
import { getKalojiraPackOptions } from "@/features/kalojira-mixed/order";
import { MobileOrderBar } from "@/features/kalojira-mixed/mobile-order-bar";
import "@/features/kalojira-mixed/campaign.css";
import { generatedStorefrontProducts } from "@/lib/generated-storefront-products";
import {
  STOREFRONT_POLL_INTERVAL_MS,
  fetchStorefrontProduct,
  fetchStorefrontProductInventory,
  findGeneratedStorefrontProduct,
  mergeInventory,
} from "@/lib/storefront-products";

export default function KalojiraMixedPage() {
  const slug = "kalojira-mixed";
  const generatedProduct = findGeneratedStorefrontProduct(generatedStorefrontProducts, slug);
  const productQuery = useQuery({
    queryKey: ["merchant-suite-product", slug],
    queryFn: () => fetchStorefrontProduct(slug),
    initialData: generatedProduct ?? undefined,
    refetchInterval: STOREFRONT_POLL_INTERVAL_MS,
  });
  const inventoryQuery = useQuery({
    queryKey: ["merchant-suite-inventory", slug],
    queryFn: () => fetchStorefrontProductInventory(slug),
    refetchInterval: STOREFRONT_POLL_INTERVAL_MS,
  });
  const product = mergeInventory(productQuery.data, inventoryQuery.data?.inventory);
  const status = resolveKalojiraCheckoutStatus({
    hasProduct: Boolean(product),
    hasOrderablePacks: product ? getKalojiraPackOptions(product).length > 0 : false,
    productIsPending: productQuery.isPending,
    productIsError: productQuery.isError,
    inventoryIsError: inventoryQuery.isError,
    inventoryIsFetched: inventoryQuery.isFetched,
    hasInventory: Boolean(inventoryQuery.data?.inventory),
  });
  const handleOrderClick = useCallback((placement: string) => {
    const target = document.getElementById("kalojira-checkout");
    const heading = document.getElementById("kalojira-checkout-heading");
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => heading?.focus({ preventScroll: true }), reduceMotion ? 0 : 450);
  }, []);

  return (
    <div className="kalojira-mixed-page min-h-screen bg-[#fff8ee]">
      <CampaignHeader />
      <main aria-labelledby="kalojira-hero-heading">
        <DocumentarySections onOrderClick={handleOrderClick} />
        <ProductGallery />
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-14">
          <section id="kalojira-checkout" aria-label="ক্যাশ অন ডেলিভারি অর্ডার" className="scroll-mt-24 pt-2">
            <KalojiraCheckout
              product={product}
              status={status}
              productQuery={productQuery}
              inventoryQuery={inventoryQuery}
              onRetry={() => void Promise.all([productQuery.refetch(), inventoryQuery.refetch()])}
            />
          </section>
        </div>
      </main>
      <CampaignFooter />
      <MobileOrderBar onOrderClick={handleOrderClick} />
    </div>
  );
}
