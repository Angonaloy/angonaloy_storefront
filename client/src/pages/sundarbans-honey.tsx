import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  CampaignFooter,
  CampaignHeader,
} from "@/features/sundarbans-honey/campaign-layout";
import { DocumentarySections } from "@/features/sundarbans-honey/documentary-sections";
import {
  HoneyCheckout,
} from "@/features/sundarbans-honey/honey-checkout";
import { resolveHoneyCheckoutStatus } from "@/features/sundarbans-honey/honey-checkout-state";
import { MobileOrderBar } from "@/features/sundarbans-honey/mobile-order-bar";
import { getHoneyPackOptions } from "@/features/sundarbans-honey/order";
import { generatedStorefrontProducts } from "@/lib/generated-storefront-products";
import {
  STOREFRONT_POLL_INTERVAL_MS,
  fetchStorefrontProduct,
  fetchStorefrontProductInventory,
  findGeneratedStorefrontProduct,
  mergeInventory,
} from "@/lib/storefront-products";

export default function SundarbansHoneyPage() {
  const slug = "sundarbans-natural-honey";
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
  const checkoutStatus = resolveHoneyCheckoutStatus({
    hasProduct: Boolean(product),
    hasOrderablePacks: product ? getHoneyPackOptions(product).length > 0 : false,
    productIsPending: productQuery.isPending,
    productIsError: productQuery.isError,
    inventoryIsError: inventoryQuery.isError,
    inventoryIsFetched: inventoryQuery.isFetched,
    hasInventory: Boolean(inventoryQuery.data?.inventory),
  });

  const handleOrderClick = useCallback((placement: string) => {
    const target = document.getElementById("honey-checkout");
    const heading = document.getElementById("honey-checkout-heading");
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => heading?.focus({ preventScroll: true }), reduceMotion ? 0 : 450);
  }, []);

  return (
    <div className="sundarbans-honey-page min-h-screen bg-[#f4ecd9]">
      <CampaignHeader />
      <main aria-labelledby="sundarbans-honey-title">
        <h1 id="sundarbans-honey-title" className="sr-only">
          সুন্দরবনের প্রাকৃতিক মধু
        </h1>
        <DocumentarySections
          onOrderClick={handleOrderClick}
        />
        <div className="mx-auto max-w-5xl px-4 pb-8 sm:px-6 sm:pb-10">
          <section id="honey-checkout" aria-label="ক্যাশ অন ডেলিভারি অর্ডার" className="scroll-mt-20 pt-2">
            <HoneyCheckout
              product={product}
              status={checkoutStatus}
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
