import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import StorefrontProductCard from "@/components/storefront-product-card";
import RecentlyViewed from "@/components/recently-viewed";
import { useLocation } from "wouter";
import {
  fetchStorefrontProducts,
  searchStorefrontProducts,
  STOREFRONT_CATALOG_QUERY_OPTIONS,
  STOREFRONT_POLL_INTERVAL_MS,
  type StorefrontProduct,
} from "@/lib/storefront-products";
import { generatedStorefrontProducts } from "@/lib/generated-storefront-products";

export default function ProductsPage() {
  const [location] = useLocation();
  const searchQuery = new URLSearchParams(location.split("?")[1] ?? "").get("search") ?? "";
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["merchant-suite-products-listing"],
    queryFn: fetchStorefrontProducts,
    ...STOREFRONT_CATALOG_QUERY_OPTIONS,
    initialData: generatedStorefrontProducts,
    initialDataUpdatedAt: 0,
    refetchInterval: STOREFRONT_POLL_INTERVAL_MS,
  });
  const filteredProducts = products ? searchStorefrontProducts(products, searchQuery) : products;

  return (
    <Layout>
      <div className="mx-auto max-w-[1500px] px-4 py-10 md:px-8 md:py-16 xl:px-12">
        <header className="mb-10 md:mb-16">
          <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-black/50">Shop</p>
          <h1 className="mt-3 text-[clamp(2.2rem,6vw,3.4rem)] font-bold leading-none tracking-[-0.04em] text-black">
            All Products-<span className="font-display italic">সকল পণ্য</span>
          </h1>
        </header>

        {isLoading && (
          <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-[#ededed]" />
            ))}
          </div>
        )}

        {isError && !filteredProducts?.length && (
          <div className="border border-black/10 bg-white px-6 py-10 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-black/60">Could not load products right now.</p>
            <p className="mt-2 text-xs text-black/40">Please try again shortly.</p>
          </div>
        )}

        {filteredProducts && filteredProducts.length === 0 && (
          <div className="border border-black/10 bg-white px-6 py-10 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-black/60">{searchQuery ? `No products found for "${searchQuery}".` : "No products published yet."}</p>
          </div>
        )}

        {filteredProducts && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
            {filteredProducts.map((product: StorefrontProduct, index: number) => (
              <StorefrontProductCard key={product.slug} product={product} index={index} />
            ))}
          </div>
        )}

        <RecentlyViewed products={products ?? generatedStorefrontProducts} />
      </div>
    </Layout>
  );
}
