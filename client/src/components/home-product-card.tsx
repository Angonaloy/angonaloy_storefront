import { motion } from "framer-motion";
import { Link } from "wouter";
import { BagIcon } from "@/components/bag-icon";

import { useCart } from "@/contexts/cart-context";
import { toGoogleAnalyticsItem } from "@/lib/google-analytics";
import {
  getProductImage,
  getProductNumericId,
  type StorefrontProduct,
} from "@/lib/storefront-products";

type HomeProductCardProps = {
  product: StorefrontProduct;
  className?: string;
};

const transition = { duration: 1, ease: [0.25, 0.1, 0.25, 1] as const };
const reveal = {
  hidden: { filter: "blur(2px)", transform: "translateY(20%)", opacity: 0 },
  visible: { filter: "blur(0)", transform: "translateY(0)", opacity: 1 },
};

function formatCardAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `৳${amount.toLocaleString("en-US")}` : "৳0";
}

export default function HomeProductCard({ product, className = "" }: HomeProductCardProps) {
  const { addToCart } = useCart();
  const image = getProductImage(product);
  const firstVariant = product.variants?.[0];
  const currentPrice = Number(firstVariant?.price ?? product.price);
  const compareAtPrice = Number(product.compare_at_price);
  const hasDiscount = Number.isFinite(currentPrice) && Number.isFinite(compareAtPrice) && compareAtPrice > currentPrice;

  return (
    <motion.article
      variants={reveal}
      transition={transition}
      className={`group flex min-w-0 flex-col ${className}`}
    >
      <Link href={`/product/${product.slug}`} className="block flex-1">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-bloop-card">
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.3em] text-bloop-ink/30">
              No image
            </div>
          )}
          {hasDiscount && product.available !== false ? (
            <span className="absolute left-3 top-3 rounded-full bg-bloop-red px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white md:text-[10px]">
              Sale
            </span>
          ) : null}
          {product.available === false && (
            <span className="absolute left-3 top-3 rounded-full bg-bloop-cream/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-bloop-ink md:text-[10px]">
              Sold out
            </span>
          )}
        </div>

        <div className="flex flex-col items-center px-1 pb-3 pt-3 text-center md:pb-4">
          <h3 className="line-clamp-2 min-h-[2.6em] text-[14px] font-semibold leading-[1.3] text-bloop-ink md:text-[15px]">
            {product.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-2">
            <span className={`text-[15px] font-bold md:text-[17px] ${hasDiscount ? "text-bloop-red" : "text-bloop-ink"}`}>
              {formatCardAmount(currentPrice)}
            </span>
            {hasDiscount ? (
              <span className="text-[13px] text-bloop-ink/45 line-through md:text-[14px]">
                {formatCardAmount(compareAtPrice)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      <button
        type="button"
        disabled={product.available === false}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          addToCart(
            {
              id: getProductNumericId(product),
              title: product.name,
              price: formatCardAmount(currentPrice),
              image,
              analyticsItem: toGoogleAnalyticsItem({
                id: product.id ?? product.slug,
                name: product.name,
                variant: "Default",
                price: currentPrice,
                quantity: 1,
              }),
            },
            "Default",
          );
        }}
        className="add-to-cart-button mt-auto flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-bloop-red px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-bloop-red md:text-[14px]"
      >
        <BagIcon className="add-to-cart-icon h-4 w-4 text-white" />
        Add to cart
      </button>
    </motion.article>
  );
}
