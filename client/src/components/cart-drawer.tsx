import { useCart } from "@/contexts/cart-context";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import OrderDialog, { type OrderDialogBundle } from "@/components/order-dialog";
import HomeProductCard from "@/components/home-product-card";
import { parseCurrencyAmount, toGoogleAnalyticsItem } from "@/lib/google-analytics";
import {
    fetchStorefrontProducts,
    getProductNumericId,
    STOREFRONT_CATALOG_QUERY_OPTIONS,
} from "@/lib/storefront-products";
import { generatedStorefrontProducts } from "@/lib/generated-storefront-products";

const cartEase = [0.22, 1, 0.36, 1] as const;

const cartPanelVariants: Variants = {
    closed: { opacity: 0 },
    open: {
        opacity: 1,
        transition: {
            duration: 0.58,
            ease: cartEase,
            staggerChildren: 0.07,
            delayChildren: 0.08,
        },
    },
};

const cartSectionVariants: Variants = {
    closed: { opacity: 0, y: 16 },
    open: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: cartEase },
    },
};

function formatTaka(amount: number) {
    return `৳${amount.toLocaleString("en-US")}`;
}

function cartUnitPrice(price: string) {
    const amount = parseFloat(price.replace(/[^0-9]/g, ''));
    return Number.isNaN(amount) ? 0 : amount;
}

// Bloop drawer close glyph, kept smaller than its 44px touch target.
function CartCloseIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
            <path d="M20.707 4.70697L19.293 3.29297L12 10.586L4.707 3.29297L3.293 4.70697L10.586 12L3.293 19.293L4.707 20.707L12 13.414L19.293 20.707L20.707 19.293L13.414 12L20.707 4.70697Z" />
        </svg>
    );
}

function CartInnerContent({ items, isOpen, setIsOpen, removeFromCart, updateQuantity, itemCount, subtotal, openCheckout, recommendations }: any) {
    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden">
            <motion.div
                variants={cartPanelVariants}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                className="flex flex-col h-full relative z-10"
            >
                {/* Header */}
                <motion.div variants={cartSectionVariants} className="shrink-0 pl-6 pr-4 pt-4">
                    <div className="flex items-center justify-between">
                        <span className="font-bloop text-[13px] font-bold uppercase tracking-[0.015em] text-[#333333]">
                            {itemCount} {itemCount === 1 ? 'Product' : 'Products'}
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close cart"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#333333] text-white transition-opacity hover:opacity-85"
                        >
                            <CartCloseIcon />
                        </button>
                    </div>
                    {items.length > 0 && (
                        <div className="mr-2 mt-3 flex items-center justify-between border-b border-[#333333]/15 pb-4 font-bloop-body text-[13px] uppercase text-[#333333]/80">
                            <span>Product</span>
                            <span>Total</span>
                        </div>
                    )}
                </motion.div>

                {/* Cart Items */}
                <motion.div variants={cartSectionVariants} className="min-h-0 flex-grow overflow-y-auto overscroll-contain">
                    <AnimatePresence mode="popLayout">
                        {items.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -18, scale: 0.98 }}
                                transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col items-center justify-center h-full px-8 py-12 text-center space-y-7"
                            >
                                <div className="space-y-3">
                                    <h3 className="font-bloop text-[28px] font-bold leading-[1.1] tracking-[-0.015em] text-[#DB2828]">
                                        Your cart is empty
                                    </h3>
                                    <p className="mx-auto max-w-[260px] font-bloop-body text-[15px] leading-6 text-[#333333]/70">
                                        Discover our curated collection
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-[#DB2828] px-8 font-bloop text-[16px] font-bold text-white transition-colors hover:bg-[#B40000]"
                                >
                                    Continue Shopping
                                </button>
                            </motion.div>
                        ) : (
                            <div className="px-6">
                                <div className="divide-y divide-[#333333]/15 border-b border-[#333333]/15">
                                {items.map((item: any, index: number) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{
                                            duration: 0.52,
                                            delay: index * 0.055,
                                            ease: [0.22, 1, 0.36, 1]
                                        }}
                                        className="py-4"
                                    >
                                        <div className="flex gap-4">
                                            {/* Product Image */}
                                            <div className="h-[125px] w-[100px] shrink-0 overflow-hidden rounded-[12px] bg-bloop-card">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>

                                            {/* Product Details */}
                                            <div className="min-w-0 flex-1 text-[#333333]">
                                                <div className="flex items-start justify-between gap-3">
                                                    <h3 className="font-bloop text-[17px] font-bold leading-[1.3]">
                                                        {item.title}
                                                    </h3>
                                                    <span className="shrink-0 font-bloop text-[16px] font-bold leading-[1.4]">
                                                        {formatTaka(cartUnitPrice(item.price) * item.quantity)}
                                                    </span>
                                                </div>
                                                <p className="mt-1 font-bloop-body text-[14px]">Size: {item.size}</p>
                                                <p className="mt-1 font-bloop text-[16px] font-bold">{item.price}</p>

                                                {/* Quantity Controls */}
                                                <div className="mt-3 flex items-center gap-4">
                                                    <div className="flex h-11 w-[124px] items-center justify-between rounded-[12px] border-2 border-[#333333]">
                                                        <button
                                                            type="button"
                                                            aria-label={`Decrease quantity of ${item.title}`}
                                                            onClick={() => updateQuantity(item.id, item.quantity - (item.quantityStep ?? 1))}
                                                            className="flex h-full w-10 items-center justify-center transition-opacity hover:opacity-60"
                                                        >
                                                            <Minus className="h-4 w-4" strokeWidth={2} />
                                                        </button>
                                                        <span className="font-bloop-body text-[15px]">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            aria-label={`Increase quantity of ${item.title}`}
                                                            onClick={() => updateQuantity(item.id, item.quantity + (item.quantityStep ?? 1))}
                                                            className="flex h-full w-10 items-center justify-center transition-opacity hover:opacity-60"
                                                        >
                                                            <Plus className="h-4 w-4" strokeWidth={2} />
                                                        </button>
                                                    </div>

                                                    {/* Remove Button */}
                                                    <button
                                                        type="button"
                                                        aria-label={`Remove ${item.title}`}
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="flex h-11 w-8 items-center justify-center transition-colors hover:text-[#DB2828]"
                                                    >
                                                        <Trash2 className="h-6 w-6" strokeWidth={1.75} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                </div>

                                {/* You may also like */}
                                {recommendations.length > 0 && (
                                    <div
                                        className="pb-8 pt-10"
                                        onClick={(event) => {
                                            if ((event.target as HTMLElement).closest("a")) setIsOpen(false);
                                        }}
                                    >
                                        <h2 className="text-center font-bloop text-[26px] font-bold leading-[1.15] tracking-[-0.015em] text-[#DB2828]">
                                            You may also like
                                        </h2>
                                        <motion.div initial="visible" animate="visible" className="-mx-6 mt-6 flex snap-x scroll-px-6 gap-4 overflow-x-auto px-6 pb-2">
                                            {recommendations.map((product: any) => (
                                                <HomeProductCard key={product.id || product.slug} product={product} className="w-[calc(50%-8px)] shrink-0 snap-start" />
                                            ))}
                                        </motion.div>
                                    </div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Footer - Subtotal & Checkout */}
                {items.length > 0 && (
                    <motion.div
                        variants={cartSectionVariants}
                        className="shrink-0 border-t border-[#333333]/10 bg-bloop-cream px-6 pb-5 pt-4 text-[#333333] md:pb-6"
                    >
                        {/* Subtotal */}
                        <div className="flex items-center justify-between font-bloop-body text-[13px] uppercase text-[#333333]/80">
                            <span>Bag total</span>
                            <span>{formatTaka(subtotal)}</span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between gap-4">
                            <span className="font-bloop text-[26px] font-bold leading-none tracking-[-0.015em]">
                                Subtotal
                            </span>
                            {subtotal > 0 ? (
                                <span className="font-bloop text-[28px] font-bold leading-none tracking-[-0.015em]">
                                    {formatTaka(subtotal)}
                                </span>
                            ) : (
                                <span className="font-bloop text-[13px] font-bold uppercase text-[#DB2828]">
                                    Select Items
                                </span>
                            )}
                        </div>
                        <p className="mt-2 font-bloop text-[13px] font-bold uppercase leading-[1.25] tracking-[0.015em]">
                            Shipping and taxes calculated at checkout
                        </p>

                        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-3">
                            {/* Checkout Button */}
                            <Button
                                onClick={openCheckout}
                                className="h-11 rounded-full bg-[#DB2828] px-3 font-bloop text-[16px] font-bold text-white shadow-none transition-colors hover:bg-[#B40000] md:text-[17px]"
                            >
                                Checkout
                            </Button>

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="h-11 whitespace-nowrap rounded-full border-2 border-[#DB2828] px-2 font-bloop text-[15px] font-bold text-[#DB2828] transition-colors hover:bg-[#DB2828] hover:text-white md:text-[16px]"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

export default function CartDrawer() {
    const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, clearCart, itemCount } = useCart();
    const [orderOpen, setOrderOpen] = useState(false);
    const [checkoutBundle, setCheckoutBundle] = useState<OrderDialogBundle | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Use a matchMedia listener to detect mobile vs desktop to prevent the desktop Portal from rendering on mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const cartOrder = useMemo<OrderDialogBundle | null>(() => {
        if (items.length === 0) {
            return null;
        }

        const subtotalAmount = items.reduce((total, item) => {
            const price = parseFloat(item.price.replace(/[^0-9]/g, ''));
            return total + ((Number.isNaN(price) ? 0 : price) * item.quantity);
        }, 0);

        return {
            title: "Cart Checkout",
            details: items.map((item) => `${item.quantity}x ${item.title}`).join(" + "),
            price: subtotalAmount,
            images: items.slice(0, 2).map((item) => ({
                src: item.image,
                alt: item.title
            })),
            analyticsItems: items.map((item) => item.analyticsItem
                ? { ...item.analyticsItem, quantity: item.quantity }
                : toGoogleAnalyticsItem({
                    id: item.productId,
                    name: item.title,
                    variant: item.size,
                    price: parseCurrencyAmount(item.price),
                    quantity: item.quantity,
                })),
            captureItems: items.map((item) => ({
                productName: item.title,
                variantName: item.size,
                quantity: item.quantity,
                unitPrice: parseCurrencyAmount(item.price),
            })),
            items: items.every((item) => item.productUuid && item.variantId)
                ? items.map((item) => ({
                    productId: item.productUuid!,
                    variantId: item.variantId!,
                    quantity: item.quantity,
                    ...(item.offerId ? { offerId: item.offerId } : {}),
                }))
                : undefined,
        };
    }, [items]);

    const openCheckout = () => {
        setCheckoutBundle(cartOrder);
        setIsOpen(false);
        setOrderOpen(true);
    };

    const updateOrderOpen = (nextOpen: boolean) => {
        setOrderOpen(nextOpen);
        if (!nextOpen) {
            setCheckoutBundle(null);
        }
    };

    // Calculate subtotal
    const subtotal = items.reduce((total, item) => {
        const price = parseFloat(item.price.replace(/[^0-9]/g, ''));
        return total + ((Number.isNaN(price) ? 0 : price) * item.quantity);
    }, 0);

    const { data: catalogProducts = [] } = useQuery({
        queryKey: ["merchant-suite-products-listing"],
        queryFn: fetchStorefrontProducts,
        ...STOREFRONT_CATALOG_QUERY_OPTIONS,
        initialData: generatedStorefrontProducts,
        initialDataUpdatedAt: 0,
        enabled: isOpen,
    });
    const recommendations = catalogProducts
        .filter((product) => product.available !== false && !items.some((item) => item.productUuid === product.id || item.productId === getProductNumericId(product)))
        .slice(0, 4);

    const innerProps = { items, isOpen, setIsOpen, removeFromCart, updateQuantity, clearCart, itemCount, openCheckout, subtotal, recommendations };

    return (
        <>
            {/* Desktop Drawer - Visible only on md and up */}
            {!isMobile && (
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetContent
                        side="right"
                        className="top-0 bottom-0 w-full h-[100dvh] supports-[height:100dvh]:h-dvh max-h-screen overflow-hidden [&>button]:hidden bg-bloop-cream text-[#333333] border-l border-black/5 md:w-[500px] p-0"
                    >
                        <CartInnerContent {...innerProps} />
                    </SheetContent>
                </Sheet>
            )}

            {/* Mobile Modal - Visible only on max-md */}
            {isMobile && (
                <AnimatePresence initial={true}>
                    {isOpen && (
                        <motion.div
                                 className="fixed inset-0 z-[100] w-full h-[100dvh] supports-[height:100dvh]:h-dvh p-3 sm:p-4 pointer-events-none"
                        >
                            <motion.div 
                                className="absolute inset-0 bg-black/10 pointer-events-auto"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, transition: { duration: 0.3 } }}
                                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                onClick={() => setIsOpen(false)}
                            />
                            
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } }}
                                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } }}
                                 className="relative w-full h-full flex flex-col pointer-events-auto rounded-[12px] bg-bloop-cream text-[#333333] shadow-2xl overflow-hidden"
                            >
                                <CartInnerContent {...innerProps} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            <OrderDialog
                open={orderOpen}
                onOpenChange={updateOrderOpen}
                bundle={checkoutBundle}
                onSuccess={clearCart}
            />
        </>
    );
}
