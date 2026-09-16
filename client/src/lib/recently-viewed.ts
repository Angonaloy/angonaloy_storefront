import { useEffect, useState } from "react";

import type { StorefrontProduct } from "./storefront-products";

export const RECENTLY_VIEWED_STORAGE_KEY = "angonaloy-recently-viewed-v1";
export const MAX_RECENTLY_VIEWED = 8;
const RECENTLY_VIEWED_EVENT = "recently-viewed-products:changed";

type ReadStorage = Pick<Storage, "getItem">;
type WriteStorage = Pick<Storage, "getItem" | "setItem">;

function parseSlugs(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return Array.from(
      new Set(parsed.filter((slug): slug is string => typeof slug === "string" && slug.trim().length > 0)),
    );
  } catch {
    return [];
  }
}

export function readRecentlyViewedSlugs(storage?: ReadStorage): string[] {
  if (!storage) return [];

  try {
    return parseSlugs(storage.getItem(RECENTLY_VIEWED_STORAGE_KEY)).slice(0, MAX_RECENTLY_VIEWED);
  } catch {
    return [];
  }
}

export function recordRecentlyViewedSlug(storage: WriteStorage | undefined, slug: string): string[] {
  const normalizedSlug = slug.trim();
  if (!storage || !normalizedSlug) return readRecentlyViewedSlugs(storage);

  const current = readRecentlyViewedSlugs(storage);
  const next = [normalizedSlug, ...current.filter((storedSlug) => storedSlug !== normalizedSlug)].slice(0, MAX_RECENTLY_VIEWED);

  try {
    storage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(next));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
    }
  } catch {
    return current;
  }

  return next;
}

export function getRecentlyViewedProducts(
  products: StorefrontProduct[],
  slugs: string[],
  excludeSlug?: string,
): StorefrontProduct[] {
  const productsBySlug = new Map(products.map((product) => [product.slug, product]));

  return slugs.reduce<StorefrontProduct[]>((recentProducts, slug) => {
    if (slug === excludeSlug) return recentProducts;

    const product = productsBySlug.get(slug);
    if (product) recentProducts.push(product);
    return recentProducts;
  }, []);
}

export function useRecentlyViewedSlugs() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const read = () => setSlugs(readRecentlyViewedSlugs(window.localStorage));
    read();
    window.addEventListener(RECENTLY_VIEWED_EVENT, read);
    window.addEventListener("storage", read);

    return () => {
      window.removeEventListener(RECENTLY_VIEWED_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return slugs;
}
