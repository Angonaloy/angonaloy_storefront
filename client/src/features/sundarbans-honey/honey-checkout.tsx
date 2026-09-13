import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { LoaderCircle, MessageCircle, Minus, Phone, Plus } from "lucide-react";
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
  getFirstHoneyInvalidField,
  getHoneyFocusTargetId,
  type HoneyCheckoutStatus,
  type HoneyFieldErrors,
} from "./honey-checkout-state";
import {
  HONEY_DELIVERY_CHARGE,
  buildHoneyAddress,
  buildHoneyOrderConfirmation,
  buildHoneyOrderPayload,
  calculateHoneyOrder,
  getHoneyPackOptions,
  writeHoneyOrderConfirmation,
  type HoneyOrderPayload,
  type HoneyPackOption,
} from "./order";
import { trackHoneyCampaignEvent } from "./tracking";

const PHONE_NUMBER = "01301636461";
const PHONE_HREF = "tel:+8801301636461";
const WHATSAPP_HREF = `https://wa.me/8801301636461?text=${encodeURIComponent("সুন্দরবনের প্রাকৃতিক মধু অর্ডার করতে চাই।")}`;
const AVAILABILITY_ERROR = "এই প্যাকটি এখন অর্ডারের জন্য পাওয়া যাচ্ছে না। অন্য প্যাক বেছে নিন বা আমাদের কল করুন।";

type RefreshResult<T> = {
  data: T | undefined;
  isError: boolean;
};

type RefreshQuery<T> = {
  refetch: () => Promise<RefreshResult<T>>;
};

type HoneyCheckoutProps = {
  product: StorefrontProduct | null;
  status: HoneyCheckoutStatus;
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

function getFieldErrors(fields: CheckoutFields, packs: HoneyPackOption[]): HoneyFieldErrors {
  const errors: HoneyFieldErrors = {};

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

function SupportActions({ placement }: { placement: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={PHONE_HREF}
        onClick={() => trackHoneyCampaignEvent("phone_click", { placement })}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#285240] bg-white px-4 py-2 font-semibold text-[#19382d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19382d]"
      >
        <Phone className="size-4" aria-hidden="true" />
        কল করুন: {PHONE_NUMBER}
      </a>
      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackHoneyCampaignEvent("whatsapp_click", { placement })}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#187d48] px-4 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b4c2a]"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        WhatsApp
      </a>
    </div>
  );
}

export function HoneyCheckout({ product, status, productQuery, inventoryQuery, onRetry }: HoneyCheckoutProps) {
  const [, setLocation] = useLocation();
  const capture = useAbandonedCartCapture("sundarbans_honey");
  const livePacks = useMemo(() => product ? getHoneyPackOptions(product) : [], [product]);
  const lastPacksRef = useRef(livePacks);
  if (status === "ready" && livePacks.length) lastPacksRef.current = livePacks;
  const packs = status === "ready" ? livePacks : lastPacksRef.current;
  const [selectedVariantId, setSelectedVariantId] = useState(() => packs[0]?.variantId ?? "");
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<HoneyFieldErrors>({});
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
    ? calculateHoneyOrder(
        presentedPack.unitPrice,
        Number.isSafeInteger(quantity) && quantity > 0 && quantity <= 100 ? quantity : 1,
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

  const analyticsItem = (pack: HoneyPackOption, itemQuantity: number) => toGoogleAnalyticsItem({
    id: pack.variantId,
    name: product?.name ?? "",
    variant: pack.label,
    price: pack.unitPrice,
    quantity: itemQuantity,
  });

  const trackCheckoutError = (type: "validation" | "availability" | "network") => {
    trackHoneyCampaignEvent("checkout_error", { error_type: type });
  };

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
    fieldErrors: HoneyFieldErrors,
    renderedPacks = packs,
  ) => {
    const fieldId = getHoneyFocusTargetId(
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
      const firstInvalidField = getFirstHoneyInvalidField(nextErrors);
      const firstError = (firstInvalidField ? nextErrors[firstInvalidField] : null) ?? "অর্ডারের তথ্য আবার দেখুন।";
      setAnnouncement(firstError);
      focusFirstInvalidField(nextErrors);
      trackCheckoutError("validation");
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
      const freshPacks = refreshedProduct ? getHoneyPackOptions(refreshedProduct) : [];
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
        trackCheckoutError("availability");
        return;
      }

      const combinedAddress = buildHoneyAddress(address);
      const payload: HoneyOrderPayload & { draftKey?: string; items: Array<{ productId: string; variantId: string; quantity: number }>; shippingZoneId?: string; website: string; turnstileToken: string; clientSessionId: string; checkoutStartedAt: string } = {
        ...buildHoneyOrderPayload({
          productName: refreshedProduct.name,
          pack: freshPack,
          quantity,
          customerName: name,
          phone,
          address: combinedAddress,
        }),
        deliveryCharge: HONEY_DELIVERY_CHARGE,
        paymentMethod: "cash_on_delivery" as const,
        trackingMode: "google_only" as const,
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
      const confirmation = buildHoneyOrderConfirmation(result.orderRef, payload);
      writeHoneyOrderConfirmation(window.sessionStorage, confirmation);
      setLocation("/step/sundarbans-natural-honey/thank-you");
    } catch (error) {
      if (error instanceof OrderProtectionError) {
        setProtectionDecision("block");
        setRequestError(false);
        setAnnouncement(error.message);
        return;
      }
      setRequestError(true);
      setAnnouncement("অর্ডারটি পাঠানো যায়নি। আপনার তথ্য ঠিক আছে—আবার চেষ্টা করুন বা আমাদের সঙ্গে যোগাযোগ করুন।");
      trackCheckoutError("network");
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
    <section className="rounded-2xl border border-[#d4c39c] bg-[#fffdf7] p-4 sm:p-6" aria-labelledby="honey-checkout-heading">
      <div className="max-w-2xl">
        <h2 id="honey-checkout-heading" className="text-2xl font-bold text-[#19382d]" tabIndex={-1}>
          ক্যাশ অন ডেলিভারিতে অর্ডার করুন
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#654b2f]">পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন। সারা দেশে ডেলিভারি চার্জ ৳{HONEY_DELIVERY_CHARGE}।</p>
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
            <div id="honey-pack" tabIndex={-1} className="grid gap-3 sm:grid-cols-2" {...fieldErrorProps("honey-pack", errors.pack)}>
              {packs.map((pack) => (
                <label
                  key={pack.variantId}
                    className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#c8b98f] bg-white px-4 py-3 has-[:checked]:border-[#285240] has-[:checked]:ring-2 has-[:checked]:ring-[#285240]/20"
                >
                  <span className="flex items-center gap-3">
                    <input
                      id={`honey-pack-${pack.variantId}`}
                      type="radio"
                      name="pack"
                      value={pack.variantId}
                      checked={selectedVariantId === pack.variantId}
                      disabled={status !== "ready"}
                      {...fieldErrorProps("honey-pack", packError)}
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
                    <span className="font-semibold text-[#19382d]">{pack.label}</span>
                  </span>
                  {status === "ready" ? (
                    <span className="font-bold text-[#6f4b0f]">৳{pack.unitPrice.toLocaleString("en-US")}</span>
                  ) : null}
                </label>
              ))}
            </div>
            <InlineError id="honey-pack" error={packError} />
            {showAvailabilityRecovery ? (
              <div className="space-y-4 rounded-xl border border-[#b8872c] bg-[#fff7df] p-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onRetry}
                    className="min-h-11 rounded-full bg-[#19382d] px-5 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    আবার চেষ্টা করুন
                  </button>
                  <SupportActions placement="checkout_availability_error" />
                </div>
              </div>
            ) : null}
          </fieldset>

          <div className="space-y-2">
            <label htmlFor="honey-quantity" className="block font-semibold text-[#19382d]">পরিমাণ</label>
            <div className="flex w-fit items-center overflow-hidden rounded-xl border border-[#c8b98f] bg-white">
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
                id="honey-quantity"
                name="quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                step={1}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="min-h-11 w-16 border-x border-[#c8b98f] bg-white text-center text-base font-bold text-[#19382d] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#285240]"
                {...fieldErrorProps("honey-quantity", errors.quantity)}
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
            <InlineError id="honey-quantity" error={errors.quantity} />
          </div>

          <div className="space-y-2">
            <label htmlFor="honey-name" className="block font-semibold text-[#19382d]">পুরো নাম</label>
            <input
              id="honey-name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-[#c8b98f] bg-white px-4 text-base text-[#19382d] outline-none focus-visible:ring-2 focus-visible:ring-[#285240]"
              {...fieldErrorProps("honey-name", errors.name)}
            />
            <InlineError id="honey-name" error={errors.name} />
          </div>

          <div className="space-y-2">
            <label htmlFor="honey-phone" className="block font-semibold text-[#19382d]">মোবাইল নম্বর</label>
            <input
              id="honey-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={11}
              pattern="[0-9]{11}"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-[#c8b98f] bg-white px-4 text-base text-[#19382d] outline-none placeholder:text-[#897963] focus-visible:ring-2 focus-visible:ring-[#285240]"
              {...fieldErrorProps("honey-phone", errors.phone)}
            />
            <InlineError id="honey-phone" error={errors.phone} />
          </div>

          <div className="space-y-2">
            <label htmlFor="honey-address" className="block font-semibold text-[#19382d]">বাড়ি, সড়ক ও এলাকার বিস্তারিত ঠিকানা</label>
            <textarea
              id="honey-address"
              name="address"
              autoComplete="street-address"
              rows={3}
              maxLength={300}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="min-h-24 w-full rounded-xl border border-[#c8b98f] bg-white px-4 py-3 text-base text-[#19382d] outline-none focus-visible:ring-2 focus-visible:ring-[#285240]"
              {...fieldErrorProps("honey-address", errors.address)}
            />
            <InlineError id="honey-address" error={errors.address} />
          </div>
          <p className="text-sm leading-6 text-[#654b2f]">
            অসম্পূর্ণ চেকআউটের তথ্য সর্বোচ্চ ৩০ দিন রাখা হতে পারে, যাতে প্রয়োজনে আমাদের টিম সাহায্য করতে পারে। কোনো স্বয়ংক্রিয় বার্তা পাঠানো হয় না।
          </p>
          <TurnstileChallenge onToken={setTurnstileToken} />
        </div>

        <aside className="h-fit rounded-[1.25rem] border border-[#cbdccf] bg-[#e8f5ed] p-4 text-[#19382d] lg:sticky lg:top-6 sm:p-5">
          <h3 className="text-xl font-bold">অর্ডার সারাংশ</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt>প্যাক</dt><dd className="font-semibold">{presentedPack?.label ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt>পরিমাণ</dt><dd className="font-semibold">{quantity}</dd></div>
            <div className="flex justify-between gap-4"><dt>পণ্যের মূল্য</dt><dd className="font-semibold">৳{totals?.subtotal.toLocaleString("en-US") ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt>ডেলিভারি</dt><dd className="font-semibold">৳{HONEY_DELIVERY_CHARGE}</dd></div>
            <div className="flex justify-between gap-4 border-t border-[#19382d]/15 pt-4 text-lg"><dt className="font-bold">সর্বমোট</dt><dd className="font-bold text-[#187d48]">৳{totals?.total.toLocaleString("en-US") ?? "—"}</dd></div>
          </dl>
          <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-sm leading-6">পেমেন্ট: ক্যাশ অন ডেলিভারি</p>

          <div className="mt-5 min-h-6 text-sm" aria-live="polite" aria-atomic="true">
            {announcement}
          </div>

          {protectionDecision ? <div className="mt-4"><OrderProtectionMessage decision={protectionDecision} /></div> : null}

          {requestError ? (
            <div className="mt-4 space-y-4 rounded-xl border border-[#b8872c]/50 bg-white/70 p-4">
              <p className="text-sm leading-6">আপনার লেখা তথ্য রাখা হয়েছে। নিচের বোতামে আবার চেষ্টা করুন অথবা যোগাযোগ করুন।</p>
              <SupportActions placement="checkout_network_error" />
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
