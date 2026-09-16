const storefrontEnv = import.meta.env ?? {};

export const STOREFRONT_ID = storefrontEnv.VITE_STOREFRONT_ID ?? "2a155750-b11a-4ff2-a7ff-4e26daac46ef";
const PRODUCTION_MERCHANT_SUITE_URL = "https://admin.mangolover.com.bd";
const configuredMerchantSuiteUrl = (storefrontEnv.VITE_MERCHANT_SUITE_URL ?? "").replace(/\/$/, "");
const MERCHANT_SUITE_URL = configuredMerchantSuiteUrl
  || (storefrontEnv.PROD ? PRODUCTION_MERCHANT_SUITE_URL : "");
export const STOREFRONT_API_BASE = `${MERCHANT_SUITE_URL}/api/public/v1/storefronts/${STOREFRONT_ID}`;
const PRODUCT_CACHE_PREFIX = "merchant-suite-product:";

// How often the storefront re-checks the Suite for stock/image/price changes.
// The Suite's inventory feed purges its cache the moment stock changes, so a
// fresh poll reflects an edit within roughly this window — Shopify-like sync.
export const STOREFRONT_POLL_INTERVAL_MS = 8000;
export const STOREFRONT_CATALOG_QUERY_OPTIONS = {
  staleTime: 0,
  refetchOnMount: "always" as const,
};

export { isProductOrderable } from "./storefront-product-orderability.ts";

type StorefrontProductStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type ProductImage = string | {
  id?: string | number;
  url?: string;
  src?: string;
  image_url?: string;
  alt_text?: string | null;
  sort_order?: number;
  is_primary?: boolean;
  sources?: Partial<Record<"320" | "640" | "960", string>>;
};

export type StorefrontVariant = {
  id?: string | number;
  name?: string;
  title?: string;
  option?: string;
  price?: string | number;
  available?: boolean;
  stock_quantity?: number;
  attributes?: Record<string, string | number | boolean | null>;
};

export type StorefrontProduct = {
  id?: string | number;
  name: string;
  slug: string;
  description?: string | null;
  url?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  images?: ProductImage[] | null;
  price?: string | number | null;
  compare_at_price?: string | number | null;
  available?: boolean;
  stock_quantity?: number | null;
  variants?: StorefrontVariant[] | null;
};

export function getProductGallery(product: Pick<StorefrontProduct, "image_urls" | "images" | "image_url">) {
  if (product.image_urls?.length) {
    return product.image_urls.filter(Boolean);
  }

  const images = product.images
    ?.map((image) => {
      if (typeof image === "string") {
        return image;
      }

      return image.url || image.src || image.image_url || "";
    })
    .filter(Boolean);

  if (images?.length) {
    return images;
  }

  return [product.image_url].filter(Boolean) as string[];
}

export function getProductImage(product: Pick<StorefrontProduct, "image_urls" | "images" | "image_url">) {
  const [firstImage] = getProductGallery(product);

  return firstImage || "";
}

export function hasPublishedProducts(products: StorefrontProduct[]) {
  return products.length > 0;
}

export function searchStorefrontProducts(products: StorefrontProduct[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) return products;
  return products.filter((product) => product.name.toLocaleLowerCase().includes(normalizedQuery));
}

export function findGeneratedStorefrontProduct(products: StorefrontProduct[], slug: string) {
  return products.find((product) => product.slug === slug) || null;
}

export function getCachedStorefrontProduct(storage: StorefrontProductStorage | undefined, slug: string) {
  if (!storage) {
    return null;
  }

  try {
    const cached = storage.getItem(`${PRODUCT_CACHE_PREFIX}${slug}`);
    if (!cached) {
      return null;
    }

    const product = JSON.parse(cached) as StorefrontProduct;
    return product?.slug === slug ? product : null;
  } catch {
    return null;
  }
}

export function setCachedStorefrontProduct(storage: StorefrontProductStorage | undefined, product: StorefrontProduct) {
  if (!storage) {
    return;
  }

  storage.setItem(`${PRODUCT_CACHE_PREFIX}${product.slug}`, JSON.stringify(product));
}

export function removeCachedStorefrontProduct(storage: StorefrontProductStorage | undefined, slug: string) {
  storage?.removeItem(`${PRODUCT_CACHE_PREFIX}${slug}`);
}

export function formatProductPrice(price: StorefrontProduct["price"]) {
  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return "৳ 0.00";
  }

  return `৳ ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatProductPriceRange(product: StorefrontProduct): string {
  const prices: number[] = [];

  if (product.variants && product.variants.length) {
    for (const variant of product.variants) {
      const amount = Number(variant.price);
      if (Number.isFinite(amount)) prices.push(amount);
    }
  }

  if (prices.length === 0) {
    const amount = Number(product.price);
    if (Number.isFinite(amount)) prices.push(amount);
  }

  if (prices.length === 0) return "৳ 0.00";

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return formatProductPrice(min);

  return `${formatProductPrice(min)} – ${formatProductPrice(max)}`;
}

export function getProductAmount(price: StorefrontProduct["price"]) {
  const amount = Number(price);
  return Number.isFinite(amount) ? Math.round(amount) : 0;
}

export function getProductNumericId(product: Pick<StorefrontProduct, "id" | "slug">) {
  const numericId = Number(product.id);

  if (Number.isInteger(numericId) && numericId > 0) {
    return numericId;
  }

  return Array.from(product.slug).reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

// Free ngrok tunnels return an HTML "visit site" interstitial to browser
// requests, which breaks JSON parsing. This header skips that interstitial so
// the storefront can read the Suite's API. Harmless once the Suite is on a
// real domain.
const STOREFRONT_FETCH_HEADERS: Record<string, string> = {
  "ngrok-skip-browser-warning": "true",
};

export async function fetchStorefrontProducts() {
  const res = await fetch(`${STOREFRONT_API_BASE}/products`, {
    headers: STOREFRONT_FETCH_HEADERS,
  });

  if (!res.ok) {
    throw new Error("Could not load products.");
  }

  const data = await res.json();
  return (data.products || []) as StorefrontProduct[];
}

function isStorefrontProductPayload(value: unknown, slug: string): value is StorefrontProduct {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const product = value as Record<string, unknown>;
  return typeof product.name === "string" && product.name.trim().length > 0
    && typeof product.slug === "string" && product.slug === slug;
}

export async function fetchStorefrontProduct(slug: string) {
  const res = await fetch(`${STOREFRONT_API_BASE}/products/${encodeURIComponent(slug)}`, {
    headers: STOREFRONT_FETCH_HEADERS,
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Could not load product.");
  }

  const data = await res.json() as { product?: unknown } | null;
  if (!isStorefrontProductPayload(data?.product, slug)) {
    throw new Error("Could not load product.");
  }

  return data.product;
}

export type StorefrontInventoryVariant = {
  available: boolean;
  stock_quantity: number;
};

export type StorefrontInventoryEntry = {
  available: boolean;
  stock_quantity: number;
  variants: Record<string, StorefrontInventoryVariant>;
};

export type StorefrontProductInventory = {
  inventory: StorefrontInventoryEntry | null;
  as_of: string;
};

export async function fetchStorefrontProductInventory(slug: string) {
  const res = await fetch(`${STOREFRONT_API_BASE}/products/${encodeURIComponent(slug)}/inventory`, {
    headers: STOREFRONT_FETCH_HEADERS,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Could not load inventory.");
  }

  const data = (await res.json()) as StorefrontProductInventory;
  return data;
}

// Overlay the Suite's real-time stock truth (from the inventory feed) onto a
// catalog product. Variant stock is keyed by variant id. Safe to call with nulls.
export function mergeInventory(
  product: StorefrontProduct | null | undefined,
  entry: StorefrontInventoryEntry | null | undefined,
): StorefrontProduct | null {
  if (!product) return null;
  if (!entry) return product;

  const mergedVariants = product.variants?.map((variant) => {
    const inv = entry.variants[String(variant.id)];
    if (!inv) return variant;
    return { ...variant, available: inv.available, stock_quantity: inv.stock_quantity };
  });

  return {
    ...product,
    available: entry.available,
    stock_quantity: entry.stock_quantity,
    variants: mergedVariants ?? product.variants,
  };
}
