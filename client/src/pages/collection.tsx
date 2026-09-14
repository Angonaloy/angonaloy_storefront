import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import StorefrontProductCard from "@/components/storefront-product-card";
import NotFound from "@/pages/not-found";
import { generatedStorefrontProducts } from "@/lib/generated-storefront-products";
import {
  getCollection,
  getTopSellingProducts,
  getProductsForCollection,
} from "@/lib/featured-collections";
import {
  fetchStorefrontProducts,
  STOREFRONT_CATALOG_QUERY_OPTIONS,
  STOREFRONT_POLL_INTERVAL_MS,
} from "@/lib/storefront-products";

export default function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = getCollection(params.slug);
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["merchant-suite-products-listing"],
    queryFn: fetchStorefrontProducts,
    ...STOREFRONT_CATALOG_QUERY_OPTIONS,
    initialData: generatedStorefrontProducts,
    initialDataUpdatedAt: 0,
    refetchInterval: STOREFRONT_POLL_INTERVAL_MS,
  });

  if (!collection) {
    return <NotFound />;
  }

  const filteredProducts = collection.slug === "top-selling-products"
    ? getTopSellingProducts(products ?? [])
    : getProductsForCollection(products ?? [], collection);
  const [englishName, bengaliName] = collection.label.split("-");

  return (
    <Layout>
      <div className="mx-auto max-w-[1500px] px-4 py-10 md:px-8 md:py-16 xl:px-12">
        <header className="mb-10 md:mb-16">
          <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-black/50">Collection</p>
          <h1 className="mt-3 text-[clamp(2.2rem,6vw,3.4rem)] font-bold leading-none tracking-[-0.04em] text-black">
            {englishName} <span className="font-display italic">{bengaliName}</span>
          </h1>
        </header>

        {isLoading && (
          <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-[3/4] animate-pulse bg-[#ededed]" />
            ))}
          </div>
        )}

        {isError && !filteredProducts.length && (
          <div className="border border-black/10 bg-white px-6 py-10 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-black/60">Could not load products right now.</p>
            <p className="mt-2 text-xs text-black/40">Please try again shortly.</p>
          </div>
        )}

        {!isLoading && !isError && filteredProducts.length === 0 && (
          <div className="border border-black/10 bg-white px-6 py-10 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-black/60">No product found</p>
          </div>
        )}

        {filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <StorefrontProductCard key={product.slug} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
