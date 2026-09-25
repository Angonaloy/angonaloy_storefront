import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { OrderProtectionError } from "@/lib/order-protection-errors";
import { useCheckoutProtectionSignals } from "@/lib/order-protection";
import { OrderProtectionMessage } from "@/components/order-protection-message";
import { TurnstileChallenge } from "@/components/turnstile-challenge";
import { readAbandonedCartCampaign, type AbandonedCartItem } from "@/lib/abandoned-cart-capture";
import { useAbandonedCartCapture } from "@/hooks/use-abandoned-cart-capture";
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
  { label: "Inside Dhaka", bn: "ঢাকার ভিতরে", charge: 80 },
  { label: "Outside Dhaka", bn: "ঢাকার বাইরে", charge: 120 },
];

const freeDeliveryThreshold = 2600;

const addressWordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

// Bloop checkout pieces: Bricolage uppercase labels, cream pill-radius fields, 20px option cards.
const fieldLabelClass = "font-bloop text-[13px] font-bold uppercase tracking-[0.015em] text-[#333333]";
const fieldLabelBanglaClass = "font-bangla text-[15px] font-semibold normal-case tracking-normal";
const fieldInputClass = "w-full rounded-[14px] border-2 border-[#333333]/20 bg-bloop-cream px-4 font-bloop-body text-[16px] text-[#333333] outline-none transition-colors placeholder:text-[#333333]/40 focus:border-[#333333]";
const optionCardClass = "rounded-[20px] border-2 px-4 py-3 text-left text-[#333333] transition-colors duration-200";
const optionCardSelectedClass = "border-[#DB2828] bg-[#FFF6D6]";
const optionCardIdleClass = "border-[#333333]/15 bg-transparent hover:border-[#333333]/40";

function OptionRadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected ? "border-[#DB2828]" : "border-[#333333]/25"
      }`}
    >
      {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[#DB2828]" /> : null}
    </span>
  );
}

export type OrderDialogBundle = {
  title: string;
  details: string;
  price: number;
  quantity?: number;
  unitPrice?: number;
  images: { src: string; alt: string }[];
  analyticsItems?: GoogleAnalyticsItem[];
  captureItems?: AbandonedCartItem[];
  items?: Array<{ productId: string; variantId: string; quantity: number; offerId?: string }>;
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
  const [deliveryCharge, setDeliveryCharge] = useState<number | null>(null);
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
    setDeliveryCharge(null);
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
        affiliation: "",
        tax: 0,
        shipping: selectedDeliveryCharge,
        coupon: "",
        customer: { name, phone, address },
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
          className="max-md:fixed max-md:inset-0 max-md:!left-0 max-md:!top-0 max-md:!translate-x-0 max-md:!translate-y-0 max-md:w-full max-md:h-auto max-md:max-h-none overflow-hidden rounded-none border-none !bg-transparent p-3 sm:p-4 shadow-none data-[state=open]:animate-none data-[state=closed]:animate-none md:bottom-auto md:top-[50%] md:h-auto md:max-h-[92dvh] md:translate-y-[-50%] md:max-w-[760px] md:p-0 md:bg-bloop-cream md:shadow-[0_80px_180px_rgba(0,0,0,0.28)] [&>button]:hidden flex flex-col z-[100]"
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
                className={`relative flex w-full h-full md:h-auto max-md:rounded-[12px] bg-bloop-cream text-[#333333] max-md:shadow-2xl overflow-y-auto overflow-x-hidden z-[10] ${
                  orderSubmitted
                    ? "min-h-[calc(100dvh-1.5rem)] flex-col items-center justify-center p-6 md:min-h-[560px] md:p-10"
                    : "flex-col p-6 md:p-10"
                }`}
              >
                <div className="absolute top-4 right-4 z-50 md:top-6 md:right-6">
                  <button type="button" onClick={() => resetDialog(false)} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#333333] text-white transition-opacity hover:opacity-85">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
                      <path d="M20.707 4.70697L19.293 3.29297L12 10.586L4.707 3.29297L3.293 4.70697L10.586 12L3.293 19.293L4.707 20.707L12 13.414L19.293 20.707L20.707 19.293L13.414 12L20.707 4.70697Z" />
                    </svg>
                  </button>
                </div>
              <DialogHeader className={orderSubmitted ? "sr-only" : "items-center space-y-1 px-12 pb-2 pt-1 text-center"}>
                <DialogTitle className="font-bloop text-[28px] font-bold leading-[1.1] tracking-[-0.015em] text-[#DB2828] md:text-[36px]">
                  Place Order
                </DialogTitle>
                <p className="font-bangla text-[16px] font-semibold text-[#333333]/70">অর্ডার করুন</p>
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
                    className="mx-auto mb-7 block h-[3px] w-16 origin-center rounded-full bg-[#F9D05E]"
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
                    className="font-bloop text-[32px] font-bold leading-[1.1] tracking-[-0.015em] text-[#DB2828] md:text-[40px]"
                  >
                    Order Confirmed - <span className="font-bangla">অর্ডার কনফার্ম</span>
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
                    className="mx-auto mt-4 max-w-sm font-bloop-body text-[15px] leading-7 text-[#333333]/70"
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
                      <div className="inline-flex flex-col items-center gap-1 rounded-[20px] bg-bloop-card px-8 py-4">
                        <span className={fieldLabelClass}>
                          Order Number - <span className={fieldLabelBanglaClass}>অর্ডার নম্বর</span>
                        </span>
                        <span className="font-bloop text-[22px] font-bold tracking-[-0.01em] text-[#DB2828]">
                          {orderRef}
                        </span>
                      </div>
                    )}
                    <Button
                      onClick={() => resetDialog(false)}
                      className="h-12 rounded-full bg-[#DB2828] px-10 font-bloop text-[16px] font-bold text-[#FFFDF3] shadow-none transition-colors hover:bg-[#B40000]"
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
                  <div className="flex items-center gap-4 rounded-[20px] bg-bloop-card p-4">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[12px] bg-bloop-cream p-2 md:h-20 md:w-20">
                      <img
                        src={bundle.images[0].src}
                        alt={bundle.images[0].alt}
                        className="h-full w-full object-contain mix-blend-multiply"
                      />
                      <div className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#F9D05E] px-1 font-bloop text-[12px] font-bold leading-none text-[#B40000] ring-2 ring-bloop-card">
                        {bundleQuantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bloop text-[16px] font-bold leading-[1.25] text-[#333333]">
                        {bundle.title}
                      </h3>
                      <p className="mt-1 font-bloop-body text-[13px] text-[#333333]/70">
                        {bundle.details}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-bloop text-[16px] font-bold text-[#333333] md:text-[18px]">
                        ৳{bundle.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className={fieldLabelClass}>
                        Name - <span className={fieldLabelBanglaClass}>নাম</span>
                      </span>
                      <input
                        required
                        name="name"
                        className={`h-[52px] ${fieldInputClass}`}
                        placeholder="Your name"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className={fieldLabelClass}>
                        Phone - <span className={fieldLabelBanglaClass}>ফোন</span>
                      </span>
                      <input
                        required
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{11}"
                        maxLength={11}
                        className={`h-[52px] ${fieldInputClass}`}
                        placeholder="01XXXXXXXXX"
                      />
                    </label>
                  </div>

                  <label className="grid gap-2">
                      <span className={fieldLabelClass}>
                        Address - <span className={fieldLabelBanglaClass}>ঠিকানা</span>
                      </span>
                    <textarea
                      required
                      name="address"
                      rows={2}
                      className={`resize-none py-3 ${fieldInputClass}`}
                        placeholder="House, road, area, city - বাড়ি, রাস্তা, এলাকা, শহর"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-3 md:gap-2">
                  <div className="grid content-start gap-2 md:col-span-2">
                      <span className={fieldLabelClass}>
                        Delivery Charge - <span className={fieldLabelBanglaClass}>ডেলিভারি চার্জ</span>
                      </span>
                    {qualifiesForFreeDelivery ? (
                      <div className={`${optionCardClass} ${optionCardSelectedClass}`}>
                          <span className="flex items-center gap-3 font-bloop text-[13px] font-bold uppercase tracking-[0.015em]">
                            <OptionRadioDot selected />
                            <span>Free Delivery - <span className={fieldLabelBanglaClass}>ফ্রি ডেলিভারি</span></span>
                          </span>
                        <span className="mt-2 block font-bloop text-[24px] font-bold leading-none text-[#DB2828]">
                          ৳0
                        </span>
                        <span className="mt-2 block font-bloop-body text-[12px] leading-5 text-[#333333]/60">
                          Applied automatically for orders over ৳2600
                        </span>
                      </div>
                    ) : (
                        <div className="grid gap-2 max-md:gap-1.5 md:grid-cols-2">
                        {deliveryOptions.map((option) => (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => setDeliveryCharge(option.charge)}
                           className={`${optionCardClass} grid grid-cols-[auto_1fr_auto] items-center gap-x-3 md:h-[108px] md:grid-cols-[auto_1fr] md:content-between ${
                              deliveryCharge === option.charge ? optionCardSelectedClass : optionCardIdleClass
                            }`}
                          >
                            <OptionRadioDot selected={deliveryCharge === option.charge} />
                           <span className="font-bloop text-[13px] font-bold uppercase leading-[1.3] tracking-[0.015em]">
                             {option.label} - <span className={fieldLabelBanglaClass}>{option.bn}</span>
                           </span>
                            <span className="font-bloop text-[24px] font-bold leading-none md:col-span-2">
                              ৳{option.charge}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid content-start gap-2">
                    <span className={fieldLabelClass}>
                        Payment Method - <span className={fieldLabelBanglaClass}>পেমেন্ট পদ্ধতি</span>
                      </span>
                    <div className="grid gap-2 md:h-full">
                      {[
                        { value: "cash_on_delivery" as const, label: "Cash on Delivery", bn: "ক্যাশ অন ডেলিভারি" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setPaymentMethod(option.value)}
                            className={`${optionCardClass} flex items-center gap-3 md:h-[108px] ${
                            paymentMethod === option.value ? optionCardSelectedClass : optionCardIdleClass
                          }`}
                        >
                            <OptionRadioDot selected={paymentMethod === option.value} />
                           <span className="font-bloop text-[13px] font-bold uppercase leading-[1.3] tracking-[0.015em]">
                             {option.label} - <span className={fieldLabelBanglaClass}>{option.bn}</span>
                           </span>
                        </button>
                      ))}
                    </div>

                  </div>

                  </div>

                  {orderError && (
                    <div className="rounded-[14px] border-2 border-[#DB2828] bg-[#DB2828]/5 px-4 py-3 font-bloop-body text-[14px] font-medium leading-5 text-[#DB2828]">
                      {orderError}
                    </div>
                  )}

                  {protectionDecision ? <OrderProtectionMessage decision={protectionDecision} /> : null}
                  <TurnstileChallenge onToken={setTurnstileToken} />

                  <div className="rounded-[20px] bg-bloop-card p-5">
                    <div className="flex justify-between font-bloop-body text-[14px] text-[#333333]/70">
                      <span>Items - <span className="font-bangla">আইটেম</span></span>
                      <span className="font-semibold text-[#333333]">৳{bundle.price.toLocaleString()}</span>
                    </div>
                    <div className="mt-3 flex justify-between font-bloop-body text-[14px] text-[#333333]/70">
                      <span>Delivery - <span className="font-bangla">ডেলিভারি</span></span>
                      <span className="font-semibold text-[#333333]">
                        {deliveryCharge === null ? "Select - সিলেক্ট" : deliveryCharge === 0 ? "Free - ফ্রি" : `৳${deliveryCharge}`}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#333333]/15 pt-4">
                        <span className="shrink-0 whitespace-nowrap font-bloop text-[20px] font-bold text-[#333333]">
                          Total - <span className="font-bangla">মোট</span>
                        </span>
                      {deliveryCharge === null ? (
                        <span className="max-w-[220px] text-right font-bloop-body text-[12px] font-semibold leading-5 text-[#DB2828]">
                          Please select a delivery charge - ডেলিভারি চার্জ সিলেক্ট করুন
                        </span>
                      ) : (
                        <span className="font-bloop text-[20px] font-bold leading-none text-[#DB2828]">
                          ৳{(bundle.price + deliveryCharge).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    disabled={orderSubmitting}
                    className="h-14 w-full rounded-full bg-[#DB2828] font-bloop text-[17px] font-bold text-[#FFFDF3] shadow-none transition-colors hover:bg-[#B40000] disabled:cursor-not-allowed disabled:opacity-60"
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
