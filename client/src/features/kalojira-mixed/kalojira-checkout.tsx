import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { LoaderCircle, Minus, Phone, Plus } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { OrderProtectionError } from "@/lib/order-protection-errors";
import { useCheckoutProtectionSignals } from "@/lib/order-protection";
import { OrderProtectionMessage } from "@/components/order-protection-message";
import { TurnstileChallenge } from "@/components/turnstile-challenge";
import { readAbandonedCartCampaign } from "@/lib/abandoned-cart-capture";
import { useAbandonedCartCapture } from "@/hooks/use-abandoned-cart-capture";
import {
  mergeInventory,
  type StorefrontProduct,
  type StorefrontProductInventory,
} from "@/lib/storefront-products";
import {
  toGoogleAnalyticsItem,
  trackGoogleEcommerceEvent,
} from "@/lib/google-analytics";
import {
  KALOJIRA_CAMPAIGN_PHONE_HREF,
  KALOJIRA_CAMPAIGN_PHONE_NUMBER,
  KALOJIRA_CAMPAIGN_WHATSAPP_HREF,
} from "./content";
import { KATIMON_CAMPAIGN_WHATSAPP_HREF } from "./katimon-content";

import {
  getFirstKalojiraInvalidField,
  getKalojiraFocusTargetId,
  type KalojiraCheckoutStatus,
  type KalojiraFieldErrors,
} from "./checkout-state";
import {
  KALOJIRA_DELIVERY_CHARGE,
  buildKalojiraAddress,
  buildKalojiraOrderConfirmation,
  buildKalojiraOrderPayload,
  calculateKalojiraOrder,
  getKalojiraPackOptions,
  writeKalojiraOrderConfirmation,
  type KalojiraOrderPayload,
  type KalojiraPackOption,
} from "./order";
import { WhatsAppBrandIcon } from "./campaign-layout";

const PHONE_NUMBER = KALOJIRA_CAMPAIGN_PHONE_NUMBER;
const PHONE_HREF = KALOJIRA_CAMPAIGN_PHONE_HREF;
const WHATSAPP_HREF = KALOJIRA_CAMPAIGN_WHATSAPP_HREF;
const AVAILABILITY_ERROR = "এই প্যাকটি এখন অর্ডারের জন্য পাওয়া যাচ্ছে না। অন্য প্যাক বেছে নিন বা আমাদের কল করুন।";

type RefreshResult<T> = {
  data: T | undefined;
  isError: boolean;
};

type RefreshQuery<T> = {
  refetch: () => Promise<RefreshResult<T>>;
};

type KalojiraCheckoutProps = {
  product: StorefrontProduct | null;
  status: KalojiraCheckoutStatus;
  productQuery: RefreshQuery<StorefrontProduct | null>;
  inventoryQuery: RefreshQuery<StorefrontProductInventory>;
  onRetry: () => void;
};

type CheckoutFields = {
  name: string;
  phone: string;
  address: string;
  selectedVariantId: string;
  quantity: number;
};

function getFieldErrors(fields: CheckoutFields, packs: KalojiraPackOption[]): KalojiraFieldErrors {
  const errors: KalojiraFieldErrors = {};

  if (fields.name.trim().length < 2 || fields.name.trim().length > 120) {
    errors.name = "আপনার পুরো নাম কমপক্ষে ২ অক্ষরে লিখুন।";
  }
  if (!/^\d{11}$/.test(fields.phone.trim())) {
    errors.phone = "ফোন নম্বরটি ঠিক ১১টি ইংরেজি সংখ্যায় লিখুন।";
  }
  if (fields.address.trim().split(/\s+/).filter(Boolean).length < 3 || fields.address.trim().length > 300) {
    errors.address = "ডেলিভারি ঠিকানা কমপক্ষে ৩ শব্দে লিখুন।";
  }
  if (!packs.some(({ variantId }) => variantId === fields.selectedVariantId)) {
    errors.pack = "অর্ডারের জন্য একটি পাওয়া যাচ্ছে এমন প্যাক বেছে নিন।";
  }
  if (!Number.isSafeInteger(fields.quantity) || fields.quantity < 1 || fields.quantity > 100) {
    errors.quantity = "পরিমাণ ১ থেকে ১০০-এর মধ্যে পূর্ণ সংখ্যায় লিখুন।";
  }

  return errors;
}

function fieldErrorProps(id: string, error: string | undefined) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
}

function InlineError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={`${id}-error`} className="text-sm text-red-700">
      {error}
    </p>
  ) : null;
}

function SupportActions({ whatsappHref }: { whatsappHref: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={PHONE_HREF}
        className="inline-flex min-h-11 items-center gap-2 rounded-[4px] border border-[#285240] bg-white px-4 py-2 font-semibold text-[#19382d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19382d]"
      >
        <Phone className="size-4" aria-hidden="true" />
        কল করুন: {PHONE_NUMBER}
      </a>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-[4px] bg-[#187d48] px-4 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b4c2a]"
      >
        <WhatsAppBrandIcon className="size-4" />
        WhatsApp
      </a>
    </div>
  );
}

export function KalojiraCheckout({ product, status, productQuery, inventoryQuery, onRetry, deliveryCharge = KALOJIRA_DELIVERY_CHARGE }: KalojiraCheckoutProps & { deliveryCharge?: number }) {
  const [, setLocation] = useLocation();
  const whatsappHref = product?.slug === "katimon-mango" ? KATIMON_CAMPAIGN_WHATSAPP_HREF : WHATSAPP_HREF;
  const capture = useAbandonedCartCapture("kalojira_mixed");
  const livePacks = useMemo(() => product ? getKalojiraPackOptions(product) : [], [product]);
  const lastPacksRef = useRef(livePacks);
  if (status === "ready" && livePacks.length) lastPacksRef.current = livePacks;
  const packs = status === "ready" ? livePacks : lastPacksRef.current;
  const [selectedVariantId, setSelectedVariantId] = useState(() => packs[0]?.variantId ?? "");
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<KalojiraFieldErrors>({});
  const [announcement, setAnnouncement] = useState("");
  const [requestError, setRequestError] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [protectionDecision, setProtectionDecision] = useState<"review" | "block" | null>(null);
  const { clientSessionId, checkoutStartedAt, turnstileToken, setTurnstileToken } = useCheckoutProtectionSignals();
  const submittingRef = useRef(false);
  const viewedItemRef = useRef(false);
  const beganCheckoutRef = useRef(false);
  const selectedPack = packs.find(({ variantId }) => variantId === selectedVariantId);
  const presentedPack = status === "ready" ? selectedPack : null;
  const totals = presentedPack
    ? calculateKalojiraOrder(
        presentedPack.unitPrice,
        Number.isSafeInteger(quantity) && quantity > 0 && quantity <= 100 ? quantity : 1,
        deliveryCharge,
      )
    : null;

  const getCaptureSnapshot = () => {
    if (!product || !presentedPack || !totals) return null;
    return {
      customerName: name,
      phone,
      address,
      items: [{
        productName: product.name,
        variantName: presentedPack.label,
        quantity: totals.quantity,
        unitPrice: presentedPack.unitPrice,
      }],
      subtotal: totals.subtotal,
      deliveryRate: totals.deliveryCharge,
      total: totals.total,
      campaign: readAbandonedCartCampaign(window.location.search),
    };
  };

  const updateCapture = () => {
    const snapshot = getCaptureSnapshot();
    return snapshot ? capture.capture(snapshot) : null;
  };

  const flushCapture = () => {
    const snapshot = getCaptureSnapshot();
    if (snapshot) void capture.flush(snapshot);
  };

  const analyticsItem = (pack: KalojiraPackOption, itemQuantity: number) => toGoogleAnalyticsItem({
    id: pack.variantId,
    name: product?.name ?? "",
    variant: pack.label,
    price: pack.unitPrice,
    quantity: itemQuantity,
  });

  const beginCheckout = () => {
    if (beganCheckoutRef.current || status !== "ready" || !selectedPack || !product) return;
    beganCheckoutRef.current = true;
    trackGoogleEcommerceEvent("begin_checkout", {
      pageType: "checkout",
      value: selectedPack.unitPrice * quantity,
      items: [analyticsItem(selectedPack, quantity)],
    });
  };

  useEffect(() => {
    if (!packs[0]
      || (selectedVariantId
        && packs.some(({ variantId }) => variantId === selectedVariantId))
      || beganCheckoutRef.current) return;
    setSelectedVariantId(packs[0].variantId);
  }, [packs, selectedVariantId]);

  useEffect(() => {
    const initialPack = packs.find(({ variantId }) => variantId === selectedVariantId);
    if (viewedItemRef.current || status !== "ready" || !initialPack || !product) return;
    viewedItemRef.current = true;
    trackGoogleEcommerceEvent("view_item", {
      pageType: "product",
      value: initialPack.unitPrice,
      items: [analyticsItem(initialPack, 1)],
    });
  }, [packs, product, selectedVariantId, status]);

  useEffect(() => {
    const selectionIsCurrent = livePacks.some(({ variantId }) => variantId === selectedVariantId);
    if (status !== "ready" || (selectedVariantId && !selectionIsCurrent && beganCheckoutRef.current)) {
      setErrors((current) => ({ ...current, pack: AVAILABILITY_ERROR }));
      setAnnouncement(AVAILABILITY_ERROR);
      return;
    }
    setErrors((current) => current.pack === AVAILABILITY_ERROR
      ? { ...current, pack: undefined }
      : current);
    setAnnouncement((current) => current === AVAILABILITY_ERROR ? "" : current);
  }, [livePacks, selectedVariantId, status]);

  useEffect(() => {
    updateCapture();
  }, [address, name, phone, product, quantity, selectedVariantId, status]);

  const focusFirstInvalidField = (
    fieldErrors: KalojiraFieldErrors,
    renderedPacks = packs,
  ) => {
    const fieldId = getKalojiraFocusTargetId(
      fieldErrors,
      selectedVariantId,
      renderedPacks.map(({ variantId }) => variantId),
    );
    if (fieldId) requestAnimationFrame(() => document.getElementById(fieldId)?.focus());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const draftKey = updateCapture();
    flushCapture();
    const fields = { name, phone, address, selectedVariantId, quantity };
    const nextErrors = getFieldErrors(fields, packs);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setRequestError(false);
      const firstInvalidField = getFirstKalojiraInvalidField(nextErrors);
      const firstError = (firstInvalidField ? nextErrors[firstInvalidField] : null) ?? "অর্ডারের তথ্য আবার দেখুন।";
      setAnnouncement(firstError);
      focusFirstInvalidField(nextErrors);
      return;
    }

    submittingRef.current = true;
    setIsPending(true);
    setProtectionDecision(null);
    const protectionFormData = new FormData(event.currentTarget);
    const website = String(protectionFormData.get("website") || "");
    setErrors({});
    setRequestError(false);
    setAnnouncement("প্যাকের সর্বশেষ মূল্য ও স্টক যাচাই করা হচ্ছে।");

    try {
      const [productRefresh, inventoryRefresh] = await Promise.all([
        productQuery.refetch(),
        inventoryQuery.refetch(),
      ]);
      if (productRefresh.isError || inventoryRefresh.isError) {
        throw new Error("refresh-failed");
      }

      const refreshedProduct = mergeInventory(productRefresh.data, inventoryRefresh.data?.inventory);
      const freshPacks = refreshedProduct ? getKalojiraPackOptions(refreshedProduct) : [];
      const freshPack = freshPacks.find(({ variantId }) => variantId === selectedVariantId);
      const freshVariant = refreshedProduct?.variants?.find(
        (variant) => String(variant.id) === selectedVariantId,
      );
      const freshInventoryVariant = inventoryRefresh.data?.inventory?.variants[selectedVariantId];
      if (!refreshedProduct
        || !inventoryRefresh.data?.inventory
        || !freshPack
        || !freshVariant
        || !freshInventoryVariant
        || freshVariant.available === false
        || freshInventoryVariant.available === false
        || freshInventoryVariant.stock_quantity <= 0) {
        const availabilityErrors = { pack: AVAILABILITY_ERROR };
        setErrors(availabilityErrors);
        setAnnouncement(AVAILABILITY_ERROR);
        focusFirstInvalidField(availabilityErrors, freshPacks);
        return;
      }

      const combinedAddress = buildKalojiraAddress(address);
      const payload: KalojiraOrderPayload & { draftKey?: string; items: Array<{ productId: string; variantId: string; quantity: number }>; shippingZoneId?: string; website: string; turnstileToken: string; clientSessionId: string; checkoutStartedAt: string } = {
        ...buildKalojiraOrderPayload({
          productName: refreshedProduct.name,
          pack: freshPack,
          quantity,
          customerName: name,
          phone,
          address: combinedAddress,
          deliveryCharge,
        }),
        deliveryCharge,
        paymentMethod: "cash_on_delivery" as const,
        items: [{ productId: String(refreshedProduct.id ?? ""), variantId: freshPack.variantId, quantity }],
        website,
        turnstileToken,
        clientSessionId,
        checkoutStartedAt,
        ...(draftKey ? { draftKey } : {}),
      };
      const response = await apiRequest("POST", "/api/orders", payload);
      const result = await response.json() as { orderRef?: unknown; decision?: unknown; reviewId?: unknown };
      if (response.status === 202 && result.decision === "review") {
        setProtectionDecision("review");
        setAnnouncement("আপনার অর্ডারের তথ্য পাওয়া গেছে। আমাদের টিম ফোনে নিশ্চিত করবে।");
        capture.clear();
        return;
      }
      if (response.status !== 201) throw new Error("unexpected-order-response");
      if (typeof result.orderRef !== "string" || !result.orderRef.trim()) {
        throw new Error("missing-order-reference");
      }
      capture.clear();
      const confirmation = buildKalojiraOrderConfirmation(result.orderRef, payload);
      writeKalojiraOrderConfirmation(window.sessionStorage, confirmation);
      setLocation("/step/kalojira-mixed/thank-you");
    } catch (error) {
      if (error instanceof OrderProtectionError) {
        setProtectionDecision("block");
        setRequestError(false);
        setAnnouncement(error.message);
        return;
      }
      setRequestError(true);
      setAnnouncement("অর্ডারটি পাঠানো যায়নি। আপনার তথ্য ঠিক আছে—আবার চেষ্টা করুন বা আমাদের সঙ্গে যোগাযোগ করুন।");
    } finally {
      submittingRef.current = false;
      setIsPending(false);
    }
  };

  if (status === "loading") {
    return (
      <section className="rounded-2xl border border-[#d4c39c] bg-[#fffdf7] p-4 sm:p-6" aria-label="অর্ডারের তথ্য লোড হচ্ছে">
        <div className="h-6 w-36 animate-pulse rounded bg-[#dfd2b5] motion-reduce:animate-none" />
        <div className="mt-4 h-12 w-full animate-pulse rounded-xl bg-[#ebe0c8] motion-reduce:animate-none" />
        <span className="sr-only">অর্ডারের তথ্য লোড হচ্ছে…</span>
      </section>
    );
  }

  const showAvailabilityRecovery = status !== "ready" || errors.pack === AVAILABILITY_ERROR;
  const packError = showAvailabilityRecovery ? AVAILABILITY_ERROR : errors.pack;

  return (
    <section className="rounded-2xl border border-[#d4c39c] bg-[#fffdf7] p-4 sm:p-6" aria-labelledby="kalojira-checkout-heading">
      <div className="max-w-2xl">
        <h2 id="kalojira-checkout-heading" className="whitespace-nowrap text-center text-xl font-extrabold text-[#19382d] focus:outline-none sm:text-2xl sm:text-left" tabIndex={-1}>
          ক্যাশ অন ডেলিভারিতে অর্ডার করুন
        </h2>
        <p className="mt-2 whitespace-nowrap text-center text-sm leading-6 text-[#654b2f] sm:text-left">পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।</p>
      </div>

      <form
        className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]"
        onSubmit={handleSubmit}
        onFocusCapture={beginCheckout}
        onInput={updateCapture}
        onBlurCapture={flushCapture}
        noValidate
      >
        <div className="space-y-5">
          <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
          <fieldset className="space-y-3">
            <legend className="font-semibold text-[#19382d]">প্যাক সাইজ বেছে নিন</legend>
            <div id="kalojira-pack" tabIndex={-1} className="grid gap-3 sm:grid-cols-2" {...fieldErrorProps("kalojira-pack", errors.pack)}>
              {packs.map((pack) => (
                <label
                  key={pack.variantId}
                    className="relative flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[4px] border border-[#c8b98f] bg-white px-4 py-3 has-[:checked]:border-[#285240] has-[:checked]:ring-2 has-[:checked]:ring-[#285240]/20"
                >
                  <span className="flex items-center gap-3">
                    <input
                      id={`kalojira-pack-${pack.variantId}`}
                      type="radio"
                      name="pack"
                      value={pack.variantId}
                      checked={selectedVariantId === pack.variantId}
                      disabled={status !== "ready"}
                      {...fieldErrorProps("kalojira-pack", packError)}
                      onChange={() => {
                        beginCheckout();
                        setSelectedVariantId(pack.variantId);
                        setErrors((current) => ({ ...current, pack: undefined }));
                        trackGoogleEcommerceEvent("select_item", {
                          pageType: "product",
                          value: pack.unitPrice,
                          items: [analyticsItem(pack, quantity)],
                        });
                      }}
                      className="size-5 accent-[#285240]"
                    />
                    <bdi dir="ltr" className="whitespace-nowrap text-lg font-bold leading-tight tracking-normal text-[#19382d]">{pack.label}</bdi>
                  </span>
                  {status === "ready" ? (
                    <span className="flex flex-col items-end gap-1.5">
                      <span className="font-bold text-[#6f4b0f]">৳{pack.unitPrice.toLocaleString("en-US")}</span>
                      {pack.label.includes("কেজি") ? (
                        <span className="rounded-full bg-[#e5672e] px-3 py-1 text-sm font-extrabold text-white">Save ৳460</span>
                      ) : null}
                      <span className="flex items-center gap-1.5">
                        <span className="rounded-[4px] bg-[#fcc435] px-2.5 py-0.5 text-[11px] font-bold text-black">{deliveryCharge ? `ডেলিভারি ৳${deliveryCharge}` : "ডেলিভারি ফ্রি"}</span>
                        {pack.label.includes("10") ? <span className="whitespace-nowrap rounded-[4px] border border-[#b98500]/35 bg-gradient-to-r from-[#fcc435] to-[#ffd968] px-2.5 py-0.5 text-[11px] font-bold tracking-[0.02em] text-black shadow-[0_2px_6px_rgba(185,133,0,0.18)]">গ্রাহকের পছন্দ</span> : null}
                      </span>
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
            <InlineError id="kalojira-pack" error={packError} />
            {showAvailabilityRecovery ? (
              <div className="space-y-4 rounded-xl border border-[#b8872c] bg-[#fff7df] p-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onRetry}
                    className="min-h-11 rounded-[4px] bg-[#19382d] px-5 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    আবার চেষ্টা করুন
                  </button>
                  <SupportActions whatsappHref={whatsappHref} />
                </div>
              </div>
            ) : null}
          </fieldset>

          <div className="space-y-2">
            <label htmlFor="kalojira-quantity" className="block font-semibold text-[#19382d]">পরিমাণ</label>
            <div className="flex w-fit items-center overflow-hidden rounded-[4px] border border-[#c8b98f] bg-white">
              <button
                type="button"
                className="grid min-h-11 min-w-11 place-items-center text-[#19382d] focus-visible:outline-2 focus-visible:outline-offset-[-3px]"
                aria-label="পরিমাণ কমান"
                onClick={() => {
                  beginCheckout();
                  setQuantity((current) => Math.max(1, current - 1));
                }}
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <input
                id="kalojira-quantity"
                name="quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                step={1}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="min-h-11 w-16 border-x border-[#c8b98f] bg-white text-center text-base font-bold text-[#19382d] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#285240]"
                {...fieldErrorProps("kalojira-quantity", errors.quantity)}
              />
              <button
                type="button"
                className="grid min-h-11 min-w-11 place-items-center text-[#19382d] focus-visible:outline-2 focus-visible:outline-offset-[-3px]"
                aria-label="পরিমাণ বাড়ান"
                onClick={() => {
                  beginCheckout();
                  setQuantity((current) => Math.min(100, current + 1));
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </div>
            <InlineError id="kalojira-quantity" error={errors.quantity} />
          </div>

          <div className="space-y-2">
            <label htmlFor="kalojira-name" className="block font-semibold text-[#19382d]">পুরো নাম</label>
            <input
              id="kalojira-name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-11 w-full rounded-[4px] border border-[#c8b98f] bg-white px-4 text-base text-[#19382d] outline-none focus-visible:ring-2 focus-visible:ring-[#285240]"
              {...fieldErrorProps("kalojira-name", errors.name)}
            />
            <InlineError id="kalojira-name" error={errors.name} />
          </div>

          <div className="space-y-2">
            <label htmlFor="kalojira-phone" className="block font-semibold text-[#19382d]">মোবাইল নম্বর</label>
            <input
              id="kalojira-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={11}
              pattern="[0-9]{11}"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="min-h-11 w-full rounded-[4px] border border-[#c8b98f] bg-white px-4 text-base text-[#19382d] outline-none placeholder:text-[#897963] focus-visible:ring-2 focus-visible:ring-[#285240]"
              {...fieldErrorProps("kalojira-phone", errors.phone)}
            />
            <InlineError id="kalojira-phone" error={errors.phone} />
          </div>

          <div className="space-y-2">
            <label htmlFor="kalojira-address" className="block font-semibold text-[#19382d]">বাড়ি, সড়ক ও এলাকার বিস্তারিত ঠিকানা</label>
            <textarea
              id="kalojira-address"
              name="address"
              autoComplete="street-address"
              rows={3}
              maxLength={300}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="min-h-24 w-full rounded-[4px] border border-[#c8b98f] bg-white px-4 py-3 text-base text-[#19382d] outline-none focus-visible:ring-2 focus-visible:ring-[#285240]"
              {...fieldErrorProps("kalojira-address", errors.address)}
            />
            <InlineError id="kalojira-address" error={errors.address} />
          </div>
          <TurnstileChallenge onToken={setTurnstileToken} />
        </div>

        <aside className="h-fit rounded-[1.25rem] border border-[#cbdccf] bg-[#e8f5ed] p-4 text-[#19382d] lg:sticky lg:top-6 sm:p-5">
          <h3 className="text-xl font-extrabold">অর্ডার সারাংশ</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt>প্যাক</dt><dd className="font-semibold">{presentedPack?.label ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt>পরিমাণ</dt><dd className="font-semibold">{quantity}</dd></div>
            <div className="flex justify-between gap-4"><dt>পণ্যের মূল্য</dt><dd className="font-semibold">৳{totals?.subtotal.toLocaleString("en-US") ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt>ডেলিভারি</dt><dd className="rounded-full bg-[#187d48]/10 px-3 py-0.5 font-bold text-[#187d48]">{deliveryCharge ? `৳${deliveryCharge}` : "ফ্রি"}</dd></div>
            <div className="flex justify-between gap-4 border-t border-[#19382d]/15 pt-4 text-lg"><dt className="font-bold">সর্বমোট</dt><dd className="font-bold text-[#187d48]">৳{totals?.total.toLocaleString("en-US") ?? "—"}</dd></div>
          </dl>
          <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-center text-sm font-bold leading-6 sm:text-left">পেমেন্ট: ক্যাশ অন ডেলিভারি</p>

          <div className="mt-5 min-h-6 text-center text-sm sm:text-left" aria-live="polite" aria-atomic="true">
            {announcement}
          </div>

          {protectionDecision ? <div className="mt-4"><OrderProtectionMessage decision={protectionDecision} /></div> : null}

          {requestError ? (
            <div className="mt-4 space-y-4 rounded-xl border border-[#b8872c]/50 bg-white/70 p-4">
              <p className="text-sm leading-6">আপনার লেখা তথ্য রাখা হয়েছে। নিচের বোতামে আবার চেষ্টা করুন অথবা যোগাযোগ করুন।</p>
              <SupportActions whatsappHref={whatsappHref} />
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isPending || status !== "ready"}
            className="mt-4 min-h-12 w-full rounded-xl border border-black bg-[#f5c456] text-base font-bold text-[#19382d] hover:bg-[#ffd675] focus-visible:ring-[#19382d] disabled:opacity-70"
          >
            {isPending ? (
              <><LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> অর্ডার পাঠানো হচ্ছে…</>
            ) : requestError ? "আবার অর্ডার চেষ্টা করুন" : "অর্ডার নিশ্চিত করুন"}
          </Button>
        </aside>
      </form>
    </section>
  );
}
