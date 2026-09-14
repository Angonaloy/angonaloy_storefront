import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { generatedStorefrontProducts } from "@/lib/generated-storefront-products";
import { STOREFRONT_POLL_INTERVAL_MS, fetchStorefrontProduct, fetchStorefrontProductInventory, findGeneratedStorefrontProduct, mergeInventory } from "@/lib/storefront-products";

import { CampaignFooter, CampaignHeader } from "@/features/honey-nut/campaign-layout";
import { DocumentarySections, ProductGallery } from "@/features/honey-nut/documentary-sections";
import { HoneyNutCheckout } from "@/features/honey-nut/honey-nut-checkout";
import { MobileOrderBar } from "@/features/honey-nut/mobile-order-bar";
import { resolveHoneyNutCheckoutStatus } from "@/features/honey-nut/checkout-state";
import { getHoneyNutPackOptions } from "@/features/honey-nut/order";
import "@/features/honey-nut/campaign.css";

export default function HoneyNutPage() {
  const slug = "honey-nut";
  const generatedProduct = findGeneratedStorefrontProduct(generatedStorefrontProducts, slug);
  const productQuery = useQuery({ queryKey: ["merchant-suite-product", slug], queryFn: () => fetchStorefrontProduct(slug), initialData: generatedProduct ?? undefined, refetchInterval: STOREFRONT_POLL_INTERVAL_MS });
  const inventoryQuery = useQuery({ queryKey: ["merchant-suite-inventory", slug], queryFn: () => fetchStorefrontProductInventory(slug), refetchInterval: STOREFRONT_POLL_INTERVAL_MS });
  const product = mergeInventory(productQuery.data, inventoryQuery.data?.inventory);
  const status = resolveHoneyNutCheckoutStatus({ hasProduct: Boolean(product), hasOrderablePacks: product ? getHoneyNutPackOptions(product).length > 0 : false, productIsPending: productQuery.isPending, productIsError: productQuery.isError, inventoryIsError: inventoryQuery.isError, inventoryIsFetched: inventoryQuery.isFetched, hasInventory: Boolean(inventoryQuery.data?.inventory) });
  const handleOrderClick = useCallback((placement: string) => {
    const target = document.getElementById("honey-nut-checkout");
    const heading = document.getElementById("honey-nut-checkout-heading");
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => heading?.focus({ preventScroll: true }), reduceMotion ? 0 : 450);
  }, []);

  return <div className="honey-nut-page min-h-screen bg-[#fff8ee]"><CampaignHeader /><main aria-labelledby="honey-nut-hero-heading"><DocumentarySections onOrderClick={handleOrderClick} /><ProductGallery /><div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-14"><section id="honey-nut-checkout" aria-label="ক্যাশ অন ডেলিভারি অর্ডার" className="scroll-mt-24 pt-2"><HoneyNutCheckout product={product} status={status} productQuery={productQuery} inventoryQuery={inventoryQuery} onRetry={() => void Promise.all([productQuery.refetch(), inventoryQuery.refetch()])} /></section></div></main><CampaignFooter /><MobileOrderBar onOrderClick={() => handleOrderClick("sticky_bar")} /></div>;
}
