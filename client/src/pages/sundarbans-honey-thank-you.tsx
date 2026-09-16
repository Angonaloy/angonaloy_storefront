import { useEffect, useState } from "react";
import { CircleCheck, MessageCircle, Phone } from "lucide-react";
import { Link } from "wouter";

import {
  clearHoneyOrderConfirmation,
  readHoneyOrderConfirmation,
} from "@/features/sundarbans-honey/order";
import { markPurchaseTracked } from "@/features/sundarbans-honey/tracking";
import {
  toGoogleAnalyticsItem,
  trackGoogleEcommerceEvent,
} from "@/lib/google-analytics";

const WHATSAPP_HREF = `https://wa.me/8801819502705?text=${encodeURIComponent("সুন্দরবনের প্রাকৃতিক মধুর অর্ডার সম্পর্কে জানতে চাই।")}`;

function getSessionStorage() {
  if (typeof window === "undefined") return undefined;
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function SupportActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <a
        href="tel:+8801819502705"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#285240] bg-white px-5 py-3 font-semibold text-[#19382d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19382d]"
      >
        <Phone className="size-4" aria-hidden="true" />
        কল করুন: 01819502705
      </a>
      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#187d48] px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b4c2a]"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        WhatsApp
      </a>
    </div>
  );
}

function Money({ value }: { value: number }) {
  return <>৳{value.toLocaleString("en-US")}</>;
}

export default function SundarbansHoneyThankYouPage() {
  const [confirmation] = useState(() => readHoneyOrderConfirmation(getSessionStorage()));

  useEffect(() => {
    if (!confirmation) return;

    const storage = getSessionStorage();
    clearHoneyOrderConfirmation(storage);
    if (!markPurchaseTracked(storage, confirmation.orderRef)) return;

    trackGoogleEcommerceEvent("purchase", {
      pageType: "thank_you",
      transactionId: confirmation.orderRef,
      value: confirmation.total,
      affiliation: "",
      tax: 0,
      shipping: confirmation.deliveryCharge,
      coupon: "",
      customer: {
        name: confirmation.customerName,
        phone: confirmation.phone,
        address: confirmation.address,
      },
      items: [toGoogleAnalyticsItem({
        id: confirmation.productName,
        name: confirmation.productName,
        variant: confirmation.variantLabel,
        price: confirmation.unitPrice,
        quantity: confirmation.quantity,
      })],
    });
  }, [confirmation]);

  if (!confirmation) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4ecd9] px-4 py-10 sm:px-6" aria-labelledby="sundarbans-honey-thank-you-title">
        <section className="w-full max-w-xl rounded-3xl border border-[#d4c39c] bg-[#fffaf0] p-6 text-center shadow-[0_24px_70px_rgba(50,35,16,0.10)] sm:p-10">
          <h1 id="sundarbans-honey-thank-you-title" className="text-3xl font-bold text-[#19382d]">
            অর্ডারের তথ্য পাওয়া যায়নি
          </h1>
          <p className="mt-4 leading-7 text-[#654b2f]">কোনো সাম্প্রতিক অর্ডারের তথ্য পাওয়া যায়নি।</p>
          <Link href="/step/sundarbans-natural-honey" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#19382d] px-6 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19382d]">
            মধুর অর্ডার পেজে ফিরে যান
          </Link>
          <div className="mt-8 border-t border-[#dfd2b5] pt-6">
            <p className="mb-4 text-sm font-semibold text-[#654b2f]">সহায়তা দরকার?</p>
            <SupportActions />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4ecd9] px-4 py-10 sm:px-6" aria-labelledby="sundarbans-honey-thank-you-title">
      <section className="w-full max-w-xl rounded-3xl border border-[#d4c39c] bg-[#fffaf0] p-6 shadow-[0_24px_70px_rgba(50,35,16,0.10)] sm:p-10">
        <div className="text-center">
          <CircleCheck className="mx-auto size-14 text-[#187d48]" strokeWidth={1.75} aria-hidden="true" />
          <h1 id="sundarbans-honey-thank-you-title" className="mt-4 text-3xl font-bold text-[#19382d]">
            আপনার অর্ডারটি গ্রহণ করা হয়েছে
          </h1>
          <p className="mt-3 font-semibold text-[#6f4b0f]">অর্ডার নম্বর: {confirmation.orderRef}</p>
          <p className="mt-3 leading-7 text-[#654b2f]">অর্ডার নিশ্চিত করতে আমাদের টিম আপনাকে ফোন করতে পারে।</p>
        </div>

        <dl className="mt-8 overflow-hidden rounded-2xl border border-[#dfd2b5] bg-white px-5 text-[#19382d]">
          <div className="flex items-center justify-between gap-4 border-b border-[#eee4cf] py-4">
            <dt className="text-[#654b2f]">প্যাক</dt>
            <dd className="text-right font-semibold">{confirmation.variantLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-[#eee4cf] py-4">
            <dt className="text-[#654b2f]">পরিমাণ</dt>
            <dd className="font-semibold">{confirmation.quantity}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-[#eee4cf] py-4">
            <dt className="text-[#654b2f]">সাবটোটাল</dt>
            <dd className="font-semibold"><Money value={confirmation.subtotal} /></dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-[#eee4cf] py-4">
            <dt className="text-[#654b2f]">ডেলিভারি</dt>
            <dd className="font-semibold"><Money value={confirmation.deliveryCharge} /></dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-4 text-lg">
            <dt className="font-bold">মোট</dt>
            <dd className="font-bold text-[#6f4b0f]"><Money value={confirmation.total} /></dd>
          </div>
        </dl>

        <div className="mt-8 border-t border-[#dfd2b5] pt-6 text-center">
          <p className="mb-4 text-sm font-semibold text-[#654b2f]">অর্ডার নিয়ে সহায়তা দরকার?</p>
          <SupportActions />
        </div>
      </section>
    </main>
  );
}
