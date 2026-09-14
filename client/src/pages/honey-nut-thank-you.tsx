import { useEffect, useState } from "react";
import { CircleCheck, MessageCircle, Phone } from "lucide-react";
import { Link } from "wouter";

import { clearHoneyNutOrderConfirmation, readHoneyNutOrderConfirmation } from "@/features/honey-nut/order";
import { HONEY_NUT_CAMPAIGN_PHONE_HREF, HONEY_NUT_CAMPAIGN_PHONE_NUMBER, HONEY_NUT_CAMPAIGN_WHATSAPP_HREF } from "@/features/honey-nut/content";
import { markHoneyNutPurchaseTracked } from "@/features/honey-nut/tracking";
import { toGoogleAnalyticsItem, trackGoogleEcommerceEvent } from "@/lib/google-analytics";

function getSessionStorage() {
  if (typeof window === "undefined") return undefined;
  try { return window.sessionStorage; } catch { return undefined; }
}

function SupportActions() {
  return <div className="flex flex-col gap-3 sm:flex-row sm:justify-center"><a href={HONEY_NUT_CAMPAIGN_PHONE_HREF} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#5b793e] bg-white px-5 py-3 font-semibold text-[#3d211a] focus-visible:outline-2 focus-visible:outline-offset-2"><Phone className="size-4" aria-hidden="true" />কল করুন: {HONEY_NUT_CAMPAIGN_PHONE_NUMBER}</a><a href={HONEY_NUT_CAMPAIGN_WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#187d48] px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"><MessageCircle className="size-4" aria-hidden="true" />WhatsApp</a></div>;
}

function Money({ value }: { value: number }) { return <>৳{value.toLocaleString("en-US")}</>; }

export default function HoneyNutThankYouPage() {
  const [confirmation] = useState(() => readHoneyNutOrderConfirmation(getSessionStorage()));
  useEffect(() => {
    if (!confirmation) return;
    const storage = getSessionStorage();
    clearHoneyNutOrderConfirmation(storage);
    if (!markHoneyNutPurchaseTracked(storage, confirmation.orderRef)) return;
    trackGoogleEcommerceEvent("purchase", { pageType: "thank_you", transactionId: confirmation.orderRef, value: confirmation.total, affiliation: "", tax: 0, shipping: confirmation.deliveryCharge, coupon: "", customer: { name: confirmation.customerName, phone: confirmation.phone, address: confirmation.address }, items: [toGoogleAnalyticsItem({ id: confirmation.productName, name: confirmation.productName, variant: confirmation.variantLabel, price: confirmation.unitPrice, quantity: confirmation.quantity })] });
  }, [confirmation]);
  if (!confirmation) return <main className="grid min-h-screen place-items-center bg-[#f7efe2] px-4 py-10 sm:px-6" aria-labelledby="honey-nut-thank-you-title"><section className="w-full max-w-xl rounded-3xl border border-[#d8bd7c] bg-[#fffaf0] p-6 text-center sm:p-10"><h1 id="honey-nut-thank-you-title" className="honey-nut-heading text-3xl text-[#3d211a]">অর্ডারের তথ্য পাওয়া যায়নি</h1><p className="mt-4 leading-7 text-[#654b2f]">কোনো সাম্প্রতিক অর্ডারের তথ্য পাওয়া যায়নি।</p><Link href="/step/honey-nut" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#3d211a] px-6 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2">Honey Nut অর্ডার পেজে ফিরে যান</Link><div className="mt-8 border-t border-[#dfd2b5] pt-6"><p className="mb-4 text-sm font-semibold text-[#654b2f]">সহায়তা দরকার?</p><SupportActions /></div></section></main>;
  return <main className="grid min-h-screen place-items-center bg-[#f7efe2] px-4 py-10 sm:px-6" aria-labelledby="honey-nut-thank-you-title"><section className="w-full max-w-xl rounded-3xl border border-[#d8bd7c] bg-[#fffaf0] p-6 sm:p-10"><div className="text-center"><CircleCheck className="mx-auto size-14 text-[#187d48]" strokeWidth={1.75} aria-hidden="true" /><h1 id="honey-nut-thank-you-title" className="honey-nut-heading mt-4 text-3xl text-[#3d211a]">আপনার অর্ডারটি গ্রহণ করা হয়েছে</h1><p className="mt-3 font-semibold text-[#8c5a11]">অর্ডার নম্বর: {confirmation.orderRef}</p><p className="mt-3 leading-7 text-[#654b2f]">অর্ডার নিশ্চিত করতে আমাদের টিম আপনাকে ফোন করতে পারে।</p></div><dl className="mt-8 overflow-hidden rounded-2xl border border-[#dfd2b5] bg-white px-5 text-[#3d211a]"><div className="flex items-center justify-between gap-4 border-b border-[#eee4cf] py-4"><dt>প্যাক</dt><dd className="font-semibold">{confirmation.variantLabel}</dd></div><div className="flex items-center justify-between gap-4 border-b border-[#eee4cf] py-4"><dt>পরিমাণ</dt><dd className="font-semibold">{confirmation.quantity}</dd></div><div className="flex items-center justify-between gap-4 border-b border-[#eee4cf] py-4"><dt>সাবটোটাল</dt><dd className="font-semibold"><Money value={confirmation.subtotal} /></dd></div><div className="flex items-center justify-between gap-4 border-b border-[#eee4cf] py-4"><dt>ডেলিভারি</dt><dd className="font-semibold"><Money value={confirmation.deliveryCharge} /></dd></div><div className="flex items-center justify-between gap-4 py-4 text-lg"><dt className="font-bold">মোট</dt><dd className="font-bold text-[#187d48]"><Money value={confirmation.total} /></dd></div></dl><div className="mt-8 border-t border-[#dfd2b5] pt-6 text-center"><p className="mb-4 text-sm font-semibold text-[#654b2f]">অর্ডার নিয়ে সহায়তা দরকার?</p><SupportActions /></div></section></main>;
}
