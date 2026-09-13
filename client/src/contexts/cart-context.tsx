import React, { createContext, useContext, useState, useEffect } from 'react';
import { createEventId, trackMetaEvent } from "@/lib/meta";
import { trackMerchantSuiteEvent } from "@/lib/merchant-suite";
import { trackGoogleEcommerceEvent, type GoogleAnalyticsItem } from "@/lib/google-analytics";

export interface CartItem {
    id: string;
    productId: number;
    productUuid?: string;
    variantId?: string;
    title: string;
    price: string;
    image: string;
    size: string;
    quantity: number;
    analyticsItem?: GoogleAnalyticsItem;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: { id: number; title: string; price: string; image: string; analyticsItem?: GoogleAnalyticsItem; productUuid?: string; variantId?: string }, size: string, quantity?: number) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Load cart from localStorage on mount (migrates legacy stepprs-cart key)
    useEffect(() => {
        const savedCart = localStorage.getItem('mango-lover-cart') ?? localStorage.getItem('stepprs-cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart from localStorage', e);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('mango-lover-cart', JSON.stringify(items));
        localStorage.removeItem('stepprs-cart');
    }, [items]);

    const addToCart = (
        product: { id: number; title: string; price: string; image: string; analyticsItem?: GoogleAnalyticsItem; productUuid?: string; variantId?: string },
        size: string,
        quantity: number = 1
    ) => {
        const itemId = `${product.id}-${size}`;

        setItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === itemId);

            if (existingItem) {
                // Update quantity if item already exists
                return prevItems.map(item =>
                    item.id === itemId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item
                return [
                    ...prevItems,
                    {
                        id: itemId,
                        productId: product.id,
                        title: product.title,
                        price: product.price,
                        image: product.image,
                        size,
                        quantity,
                        analyticsItem: product.analyticsItem
                    }
                ];
            }
        });

        // Open cart drawer after adding
        setIsOpen(true);
        trackMerchantSuiteEvent("cart");

        const value = Number(String(product.price).replace(/[^0-9.]/g, "")) || 0;
        const eventId = createEventId();
        trackMetaEvent({
          eventName: "AddToCart",
          eventId,
          capi: true,
          customData: {
            currency: "BDT",
            value,
            content_type: "product",
            content_ids: [String(product.id)],
            contents: [{ id: String(product.id), quantity, item_price: value }],
          },
        });
        trackGoogleEcommerceEvent("add_to_cart", {
          pageType: "product",
          value,
          items: [
            product.analyticsItem
              ? { ...product.analyticsItem, quantity }
              : {
                  item_id: String(product.id),
                  item_name: product.title,
                  item_brand: "Mango Lover BD",
                  item_variant: size,
                  price: value,
                  quantity,
                },
          ],
        });
    };

    const removeFromCart = (itemId: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        setItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const itemCount = items.reduce((total, item) => total + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                isOpen,
                setIsOpen,
                itemCount
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
