import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { OrderProtectionError } from "@/lib/order-protection-errors";
import { useCheckoutProtectionSignals } from "@/lib/order-protection";
import { OrderProtectionMessage } from "@/components/order-protection-message";
import { TurnstileChallenge } from "@/components/turnstile-challenge";
import { readAbandonedCartCampaign, type AbandonedCartItem } from "@/lib/abandoned-cart-capture";
import { useAbandonedCartCapture } from "@/hooks/use-abandoned-cart-capture";
import { createEventId, trackMetaEvent } from "@/lib/meta";
import { trackMerchantSuiteEvent } from "@/lib/merchant-suite";
import { toGoogleAnalyticsItem, trackGoogleEcommerceEvent, type GoogleAnalyticsItem } from "@/lib/google-analytics";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

const deliveryOptions = [
  { label: "Standard Delivery", bn: "সাধারণ ডেলিভারি", charge: 100 }
];

const freeDeliveryThreshold = 2600;

const addressWordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

export type OrderDialogBundle = {
  title: string;
  details: string;
  price: number;
  quantity?: number;
  unitPrice?: number;
  images: { src: string; alt: string }[];
  analyticsItems?: GoogleAnalyticsItem[];
  captureItems?: AbandonedCartItem[];
  items?: Array<{ productId: string; variantId: string; quantity: number }>;
};

function getBundleAnalyticsItems(bundle: OrderDialogBundle) {
  if (bundle.analyticsItems?.length) {
    return bundle.analyticsItems;
  }

  return [toGoogleAnalyticsItem({
    id: bundle.title,
    name: bundle.title,
    variant: bundle.details,
    price: bundle.unitPrice ?? bundle.price / (bundle.quantity ?? 1),
    quantity: bundle.quantity ?? 1,
  })];
}

export default function OrderDialog({
  open,
  onOpenChange,
  bundle,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle: OrderDialogBundle | null;
  onSuccess?: () => void;
}) {
  const [openInstance, setOpenInstance] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number | null>(100);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [orderClosing, setOrderClosing] = useState(false);
  const [protectionDecision, setProtectionDecision] = useState<"review" | "block" | null>(null);
  const { clientSessionId, checkoutStartedAt, turnstileToken, setTurnstileToken } = useCheckoutProtectionSignals();
  const [paymentMethod, setPaymentMethod] = useState<"cash_on_delivery" | null>("cash_on_delivery");
  const previousOpen = useRef(open);
  const formRef = useRef<HTMLFormElement>(null);
  const capture = useAbandonedCartCapture("storefront");
  const bundleQuantity = bundle?.quantity ?? 1;
  const bundleUnitPrice = bundle?.unitPrice ?? ((bundle?.price ?? 0) / bundleQuantity);
  const qualifiesForFreeDelivery = (bundle?.price ?? 0) >= freeDeliveryThreshold;

  const getCaptureSnapshot = (form: HTMLFormElement | null = formRef.current) => {
    if (!bundle || deliveryCharge === null) return null;
    const formData = form ? new FormData(form) : null;
    return {
      customerName: String(formData?.get("name") || ""),
      phone: String(formData?.get("phone") || ""),
      address: String(formData?.get("address") || ""),
      items: bundle.captureItems?.length
        ? bundle.captureItems
        : [{
          productName: bundle.title,
          variantName: bundle.details,
          quantity: bundleQuantity,
          unitPrice: bundleUnitPrice,
        }],
      subtotal: bundle.price,
      deliveryRate: deliveryCharge,
      total: bundle.price + deliveryCharge,
      campaign: typeof window === "undefined" ? {} : readAbandonedCartCampaign(window.location.search),
    };
  };

  const updateCapture = (form?: HTMLFormElement | null) => {
    const snapshot = getCaptureSnapshot(form);
    return snapshot ? capture.capture(snapshot) : null;
  };

  const flushCapture = (form?: HTMLFormElement | null) => {
    const snapshot = getCaptureSnapshot(form);
    if (snapshot) void capture.flush(snapshot);
  };

  useEffect(() => {
    if (!previousOpen.current && open) {
      setOpenInstance((current) => current + 1);
      trackMerchantSuiteEvent("checkout");
      if (bundle) {
        trackGoogleEcommerceEvent("begin_checkout", {
          pageType: "checkout",
          value: bundle.price,
          items: getBundleAnalyticsItems(bundle),
        });
      }

      const eventId = createEventId();
      trackMetaEvent({
        eventName: "InitiateCheckout",
        eventId,
        capi: true,
        customData: {
          currency: "BDT",
          value: bundle?.price ?? 0,
          content_type: "product",
          contents: bundle
            ? [{ id: bundle.title, quantity: bundleQuantity, item_price: bundleUnitPrice }]
            : [],
        },
      });
    }
    previousOpen.current = open;
  }, [open, bundle, bundleQuantity, bundleUnitPrice]);

  useEffect(() => {
    if (open && qualifiesForFreeDelivery) {
      setDeliveryCharge(0);
    }
  }, [open, qualifiesForFreeDelivery]);

  useEffect(() => {
    if (open) updateCapture();
  }, [open, bundle, bundleQuantity, bundleUnitPrice, deliveryCharge]);

  useEffect(() => {
    if (orderSubmitted) {
      trackMerchantSuiteEvent("purchased");
    }
  }, [orderSubmitted]);

  const resetDialog = (nextOpen: boolean) => {
    if (!nextOpen) {
      void capture.finalize();
      setOrderClosing(true);
      onOpenChange(false);
      return;
    }

    setOrderClosing(false);
    onOpenChange(nextOpen);
    setDeliveryCharge(100);
    setOrderSubmitted(false);
    setOrderSubmitting(false);
    setOrderError("");
    setOrderRef("");
    setProtectionDecision(null);
    setPaymentMethod(null);
  };

  const placeOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!bundle) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const eventId = createEventId();

    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const address = String(formData.get("address") || "").trim();

    if (!name) {
      setOrderError("Please enter your full name.");
      return;
    }
    if (!phone) {
      setOrderError("Please enter your phone number.");
      return;
    }
    if (!/^\d{11}$/.test(phone)) {
      setOrderError("ফোন নম্বরটি ইংরেজিতে লিখুন।");
      return;
    }
    if (!address) {
      setOrderError("Please enter your delivery address.");
      return;
    }
    if (addressWordCount(address) < 3) {
      setOrderError("ডেলিভারি ঠিকানা কমপক্ষে ৩ শব্দে লিখুন।");
      return;
    }

    if (deliveryCharge === null) {
      setOrderError("Please select a delivery charge before placing your order.");
      return;
    }
    if (paymentMethod === null) {
      setOrderError("Please select a payment method before placing your order.");
      return;
    }

    const selectedDeliveryCharge = deliveryCharge;
    const selectedPaymentMethod = paymentMethod;
    const draftKey = updateCapture(event.currentTarget);
    flushCapture(event.currentTarget);
    setOrderSubmitting(true);
    setOrderError("");
    setProtectionDecision(null);

    try {
      const response = await apiRequest("POST", "/api/orders", {
        bundleTitle: bundle.title,
        bundleDetails: bundle.details,
        bundlePrice: bundle.price,
        quantity: bundleQuantity,
        deliveryCharge: selectedDeliveryCharge,
        customerName: String(formData.get("name") || ""),
         phone,
         address,
        paymentMethod: selectedPaymentMethod,
        metaEventId: eventId,
        items: bundle.items,
        website: String(formData.get("website") || ""),
        turnstileToken,
        clientSessionId,
        checkoutStartedAt,
        ...(draftKey ? { draftKey } : {}),
      });
      const result = await response.json() as { orderRef?: unknown; decision?: unknown; reviewId?: unknown };
      if (response.status === 202 && result.decision === "review") {
        setProtectionDecision("review");
        setOrderError("");
        capture.clear();
        return;
      }
      if (typeof result.orderRef !== "string" || !result.orderRef.trim()) {
        throw new Error("Could not confirm order. Please try again.");
      }
      capture.clear();
      setOrderRef(result.orderRef);
      setOrderSubmitted(true);
      onSuccess?.();
      trackGoogleEcommerceEvent("purchase", {
        pageType: "thank_you",
        value: bundle.price + selectedDeliveryCharge,
        items: getBundleAnalyticsItems(bundle),
        transactionId: result.orderRef,
        tax: 0,
        shipping: selectedDeliveryCharge,
        coupon: "",
      });

      trackMetaEvent({
        eventName: "Purchase",
        eventId,
        capi: false, // Purchase is sent server-side from /api/orders (for dedup)
        customData: {
          currency: "BDT",
          value: bundle.price + selectedDeliveryCharge,
          content_type: "product",
          contents: [{ id: bundle.title, quantity: bundleQuantity, item_price: bundleUnitPrice }],
        },
      });
    } catch (error) {
      if (error instanceof OrderProtectionError) {
        setProtectionDecision("block");
        setOrderError("");
        return;
      }
      setOrderError(
        error instanceof Error
          ? error.message
          : "Could not place your order. Please try again.",
      );
    } finally {
      setOrderSubmitting(false);
    }
  };

  return (
    <Dialog open={open || orderClosing} onOpenChange={resetDialog}>
      {(open || orderClosing) && bundle && (
        <DialogContent
          forceMount
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="max-md:fixed max-md:inset-0 max-md:!left-0 max-md:!top-0 max-md:!translate-x-0 max-md:!translate-y-0 max-md:w-full max-md:h-auto max-md:max-h-none overflow-hidden rounded-none border-none !bg-transparent p-3 sm:p-4 shadow-none data-[state=open]:animate-none data-[state=closed]:animate-none md:bottom-auto md:top-[50%] md:h-auto md:max-h-[92dvh] md:translate-y-[-50%] md:max-w-[760px] md:p-0 md:bg-[#f6f6f6] md:shadow-[0_80px_180px_rgba(0,0,0,0.28)] [&>button]:hidden md:[&>button]:flex md:[&>button]:rounded-[8px] flex flex-col z-[100]"
        >
          <AnimatePresence
            initial={true}
            onExitComplete={() => setOrderClosing(false)}
          >
            {open && (
              <motion.div
                key={openInstance}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.96,
                  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                }}
                className={`relative flex w-full h-full md:h-auto max-md:rounded-[12px] bg-white md:bg-[#f6f6f6] max-md:shadow-2xl overflow-y-auto overflow-x-hidden z-[10] ${
                  orderSubmitted
                    ? "min-h-[calc(100dvh-1.5rem)] flex-col items-center justify-center p-6 md:min-h-[560px] md:p-10"
                    : "flex-col p-6 md:p-10"
                }`}
              >
                <div className="absolute top-4 right-4 z-50 md:hidden">
                  <Button variant="ghost" size="icon" onClick={() => resetDialog(false)} className="rounded-full hover:bg-black/5 text-black border-none h-10 w-10">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              <DialogHeader className={orderSubmitted ? "sr-only" : "items-center pb-2 text-center"}>
                <DialogTitle className="text-3xl md:text-4xl font-semibold tracking-tight leading-none text-black">
                  Place Order
                </DialogTitle>
              </DialogHeader>

              {orderSubmitted ? (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.09, delayChildren: 0.05 },
                    },
                  }}
                  className="flex w-full flex-1 flex-col items-center justify-center px-2 py-12 text-center font-sans md:py-16"
                >
                  <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
                  <motion.span
                    variants={{
                      hidden: { opacity: 0, scaleX: 0 },
                      visible: {
                        opacity: 1,
                        scaleX: 1,
                        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                      },
                    }}
                    className="mx-auto mb-7 block h-px w-16 origin-center bg-black/15"
                  />
                  <motion.h3
                    variants={{
                      hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
                      visible: {
                        opacity: 1,
                        y: 0,
                        filter: "blur(0px)",
                        transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] },
                      },
                    }}
                    className="font-sans text-3xl font-semibold tracking-[-0.04em] text-black md:text-4xl"
                  >
                    Order Confirmed - অর্ডার কনফার্ম
                  </motion.h3>
                  <motion.p
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
                      },
                    }}
                    className="mx-auto mt-4 max-w-sm text-[15px] font-medium leading-7 tracking-[-0.02em] text-black/55"
                  >
                    Our studio team will contact you shortly to confirm delivery and payment. - আমাদের টিম শীঘ্রই ডেলিভারি ও পেমেন্ট কনফার্ম করতে যোগাযোগ করবে।
                  </motion.p>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 16, scale: 0.97 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
                      },
                    }}
                    className="mt-7 flex flex-col items-center gap-6"
                  >
                    {orderRef && (
                      <div className="inline-flex flex-col items-center gap-1 rounded-[8px] border border-black/10 bg-black/[0.03] px-6 py-3">
                        <span className="text-[11px] font-medium tracking-[-0.01em] text-black/45">
                          Order Number - অর্ডার নম্বর
                        </span>
                        <span className="font-sans text-sm font-semibold tracking-[-0.02em] text-black">
                          {orderRef}
                        </span>
                      </div>
                    )}
                    <Button
                      onClick={() => resetDialog(false)}
                      className="h-auto rounded-[8px] bg-black px-7 py-3 text-[13px] font-semibold tracking-[-0.02em] text-white shadow-none hover:bg-black/80"
                    >
                      Close - বন্ধ
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <form
                  ref={formRef}
                  onSubmit={placeOrder}
                  onInput={() => { updateCapture(); }}
                  onBlurCapture={() => { flushCapture(); }}
                  className="mt-6 space-y-6"
                  noValidate
                >
                  <div className="bg-black/5 rounded-[12px] p-4 flex items-center gap-4">
                    <div className="relative shrink-0 w-16 h-16 md:w-20 md:h-20 bg-[#ebe8e4] rounded-[8px] p-2 flex items-center justify-center">
                      <img
                        src={bundle.images[0].src}
                        alt={bundle.images[0].alt}
                        className="h-full w-full object-contain mix-blend-multiply"
                      />
                      <div className="absolute -top-2 -right-2 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-sm">
                        {bundleQuantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] md:text-[15px] font-semibold text-black leading-tight">
                        {bundle.title}
                      </h3>
                      <p className="mt-1 text-[11px] md:text-[12px] text-black/60">
                        {bundle.details}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[14px] md:text-[15px] font-bold text-black block">
                        ৳{bundle.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-[13px] md:text-[14px] font-semibold text-black">
                        Name - নাম
                      </span>
                      <input
                        required
                        name="name"
                        className="h-12 w-full rounded-[8px] border border-black/15 bg-white/70 px-4 text-[16px] font-normal outline-none transition-colors focus:border-black max-md:rounded-[8px]"
                        placeholder="Your name"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[13px] md:text-[14px] font-semibold text-black">
                        Phone - ফোন
                      </span>
                      <input
                        required
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{11}"
                        maxLength={11}
                        className="h-12 w-full rounded-[8px] border border-black/15 bg-white/70 px-4 text-[16px] font-normal outline-none transition-colors focus:border-black max-md:rounded-[8px]"
                        placeholder="01XXXXXXXXX"
                      />
                    </label>
                  </div>

                  <label className="block space-y-2">
                      <span className="text-[13px] md:text-[14px] font-semibold text-black">
                        Address - ঠিকানা
                      </span>
                    <textarea
                      required
                      name="address"
                      rows={2}
                      className="w-full resize-none rounded-[8px] border border-black/15 bg-white/70 px-4 py-3 text-[16px] font-normal max-md:text-[13px] outline-none transition-colors focus:border-black max-md:rounded-[8px]"
                        placeholder="House, road, area, city - বাড়ি, রাস্তা, এলাকা, শহর"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid content-start gap-2">
                      <span className="text-[13px] md:text-[14px] font-semibold text-black">
                        Delivery Charge - ডেলিভারি চার্জ
                      </span>
                    {qualifiesForFreeDelivery ? (
                      <div className="border border-brand-gold/40 bg-white max-md:bg-white/10 p-4">
                          <span className="block text-[10px] font-bold text-black">
                            Free Delivery - ফ্রি ডেলিভারি
                          </span>
                        <span className="mt-2 block font-garet text-2xl font-bold text-brand-gold">
                          ৳0
                        </span>
                        <span className="mt-3 block text-[9px] leading-5 text-black/45">
                          Applied automatically for orders over ৳2600
                        </span>
                      </div>
                    ) : (
                       <div className="grid gap-2 max-md:gap-1.5">
                        {deliveryOptions.map((option) => (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => setDeliveryCharge(option.charge)}
                           className={`border px-3 py-2 text-left max-md:px-2.5 max-md:py-1.5 transition-all md:h-[88px] ${
                              deliveryCharge === option.charge
                                ? "border-brand-gold border-[1.5px] bg-brand-gold/5 rounded-[8px]"
                                : "border-black/15 bg-transparent hover:border-black/30 rounded-[8px]"
                            }`}
                          >
                           <span className="block text-[10px] font-bold max-md:text-[9px]">
                             {option.label} - {option.bn}
                           </span>
                            <span className="mt-2 block font-garet text-2xl font-bold max-md:mt-1 max-md:text-xl">
                              ৳{option.charge}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid content-start gap-2">
                    <span className="text-[13px] md:text-[14px] font-semibold text-black">
                      Payment Method - পেমেন্ট পদ্ধতি
                    </span>
                    <div className="grid gap-2 md:h-full">
                      {[
                        { value: "cash_on_delivery" as const, label: "Cash on Delivery", bn: "ক্যাশ অন ডেলিভারি" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setPaymentMethod(option.value)}
                            className={`border px-3 py-2 text-left max-md:px-2.5 max-md:py-1.5 transition-all md:h-[88px] ${
                            paymentMethod === option.value
                              ? "border-brand-gold border-[1.5px] bg-brand-gold/5 rounded-[8px]"
                              : "border-black/15 bg-transparent hover:border-black/30 rounded-[8px]"
                          }`}
                        >
                           <span className="flex min-h-9 items-center justify-center text-center text-[10px] font-bold">
                             {option.label} - {option.bn}
                           </span>
                        </button>
                      ))}
                    </div>

                  </div>

                  </div>

                  {orderError && (
                    <div className="border border-red-500/30 bg-red-50 px-4 py-3 text-[10px] leading-5 text-black">
                      {orderError}
                    </div>
                  )}

                  {protectionDecision ? <OrderProtectionMessage decision={protectionDecision} /> : null}
                  <TurnstileChallenge onToken={setTurnstileToken} />

                  <div className="bg-black/5 rounded-[12px] p-5">
                    <div className="flex justify-between text-[11px] text-black/60 font-medium">
                      <span>Items - আইটেম</span>
                      <span className="font-semibold text-black">৳{bundle.price.toLocaleString()}</span>
                    </div>
                    <div className="mt-4 flex justify-between text-[11px] text-black/60 font-medium">
                      <span>Delivery - ডেলিভারি</span>
                      <span className="font-semibold text-black">
                        {deliveryCharge === null ? "Select - সিলেক্ট" : deliveryCharge === 0 ? "Free - ফ্রি" : `৳${deliveryCharge}`}
                      </span>
                    </div>
                    <div className="mt-5 flex items-end justify-between gap-4 border-t border-black/10 pt-5">
                        <span className="text-[12px] font-bold text-black">
                          Total - মোট
                        </span>
                      {deliveryCharge === null ? (
                        <span className="max-w-[220px] text-right text-[10px] leading-5 font-semibold text-red-600">
                          Please select a delivery charge - ডেলিভারি চার্জ সিলেক্ট করুন
                        </span>
                      ) : (
                        <span className="text-4xl font-semibold tracking-tight text-black leading-none">
                          ৳{(bundle.price + deliveryCharge).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    disabled={orderSubmitting}
                    className="h-14 w-full rounded-[8px] bg-[#FBBB14] text-black text-[13px] font-bold hover:bg-[#e5a80f] transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {orderSubmitting ? "Placing Order... - অর্ডার হচ্ছে..." : "Place Order - অর্ডার করুন"}
                  </Button>
                </form>
              )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      )}
    </Dialog>
  );
}
