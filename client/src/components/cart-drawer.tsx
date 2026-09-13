import { useCart } from "@/contexts/cart-context";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X, ShoppingBag, ArrowDownRight } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import OrderDialog, { type OrderDialogBundle } from "@/components/order-dialog";
import { parseCurrencyAmount, toGoogleAnalyticsItem } from "@/lib/google-analytics";

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

function CartInnerContent({ items, isOpen, setIsOpen, removeFromCart, updateQuantity, itemCount, subtotal, openCheckout }: any) {
    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden">
            <motion.div
                variants={cartPanelVariants}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                className="flex flex-col h-full relative z-10"
            >
                {/* Header */}
                    <motion.div variants={cartSectionVariants} className="border-b border-black/5 p-5 md:p-8">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-black block">
                                Your Cart
                            </span>
                            <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-black">
                                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="h-10 w-10 rounded-[8px] border-none transition-all hover:bg-black hover:text-white md:border-solid md:border md:border-black/5"
                        >
                            <X className="w-4 h-4 max-md:w-5 max-md:h-5" />
                        </Button>
                    </div>
                </motion.div>

                {/* Cart Items */}
                <motion.div variants={cartSectionVariants} className="min-h-0 flex-grow overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                        {items.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -18, scale: 0.98 }}
                                transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col items-center justify-center h-full p-12 text-center space-y-7"
                            >
                                <div className="space-y-3">
                                        <h3 className="text-sm font-sans font-medium uppercase tracking-[0.2em] text-black">
                                        Your cart is empty
                                    </h3>
                                    <p className="mx-auto max-w-[220px] text-[10px] uppercase tracking-[0.28em] leading-6 font-medium text-black/35">
                                        Discover our curated collection
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsOpen(false)}
                                    className="h-auto whitespace-nowrap rounded-none border-0 border-b border-black bg-transparent px-0 py-2 text-[10px] uppercase font-bold tracking-[0.35em] text-black shadow-none hover:bg-transparent hover:border-brand-gold hover:text-brand-gold"
                                >
                                    Continue Shopping
                                </Button>
                            </motion.div>
                        ) : (
                            <div className="divide-y divide-black/5">
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
                                        className="p-4 transition-colors group hover:bg-black/[0.01] md:p-7"
                                    >
                                        <div className="flex gap-4 md:gap-6">
                                            {/* Product Image */}
                                            <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-[8px] bg-neutral-100 md:h-36 md:w-28 md:rounded-none">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover transition-all duration-700"
                                                />
                                                <div className="absolute inset-0 rounded-[8px] border border-black/5 md:rounded-none" />
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-grow space-y-3 md:space-y-4">
                                                <div className="space-y-1.5 md:space-y-2">
                                                     <h3 className="text-base font-sans font-medium uppercase tracking-wide text-black md:text-lg">
                                                        {item.title}
                                                    </h3>
                                                     <div className="flex items-center gap-4 text-[9px] font-medium uppercase tracking-[0.3em] text-black/40">
                                                        <span>Size: {item.size}</span>
                                                    </div>
                                                     <span className="text-sm font-sans font-medium text-black">
                                                        {item.price}
                                                    </span>
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center justify-between">
                                                     <div className="flex items-center overflow-hidden rounded-[8px] border border-black/10">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                         className="flex h-9 w-9 items-center justify-center transition-all hover:bg-black hover:text-white md:h-10 md:w-10"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                         <span className="flex h-9 w-10 items-center justify-center border-x border-black/10 text-[10px] font-bold md:h-10 md:w-12">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                             className="flex h-9 w-9 items-center justify-center transition-all hover:bg-black hover:text-white md:h-10 md:w-10"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    {/* Remove Button */}
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                         className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-black transition-colors hover:text-red-600"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Footer - Subtotal & Checkout */}
                {items.length > 0 && (
                    <motion.div
                        variants={cartSectionVariants}
                        className="shrink-0 space-y-3 border-t border-black/5 bg-white p-4 md:space-y-5 md:p-8"
                    >
                        {/* Subtotal */}
                        <div className="space-y-2 md:space-y-3">
                            <div className="flex items-baseline justify-between border-b border-black/5 pb-2 md:pb-3">
                                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/40 md:text-[10px] md:tracking-[0.4em]">
                                    Subtotal
                                </span>
                                {subtotal > 0 ? (
                                    <span className="font-garet text-xl font-bold text-black md:text-2xl">
                                        BDT {subtotal.toLocaleString()}
                                    </span>
                                ) : (
                                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-gold">
                                        Select Items
                                    </span>
                                )}
                            </div>
                            <p className="text-center text-[8px] font-medium uppercase tracking-[0.22em] text-black/30 md:text-[9px] md:tracking-[0.3em]">
                                Shipping and taxes calculated at checkout
                            </p>
                        </div>

                        {/* Checkout Button */}
                        <Button
                            onClick={openCheckout}
                            className="group flex h-12 w-full items-center justify-center gap-3 rounded-[8px] bg-black text-[9px] font-bold uppercase tracking-[0.26em] text-white transition-all hover:bg-brand-gold md:h-14 md:text-[10px] md:tracking-[0.4em]"
                        >
                            Proceed to Checkout
                            <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5 stroke-[1px] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </Button>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.28em] text-black/40 transition-colors hover:text-black md:text-[9px] md:tracking-[0.4em]"
                        >
                            Continue Shopping
                        </button>
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
                ? items.map((item) => ({ productId: item.productUuid!, variantId: item.variantId!, quantity: item.quantity }))
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

    const innerProps = { items, isOpen, setIsOpen, removeFromCart, updateQuantity, clearCart, itemCount, openCheckout, subtotal };

    return (
        <>
            {/* Desktop Drawer - Visible only on md and up */}
            {!isMobile && (
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetContent
                        side="right"
                        className="top-0 bottom-0 w-full h-[100dvh] supports-[height:100dvh]:h-dvh max-h-screen overflow-hidden [&>button]:hidden bg-brand-ivory border-l border-black/5 md:w-[500px] p-0"
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
                                 className="relative w-full h-full flex flex-col pointer-events-auto rounded-[12px] bg-white text-black shadow-2xl overflow-hidden md:bg-neutral-500/60 md:text-white md:backdrop-blur-md"
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
