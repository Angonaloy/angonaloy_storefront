import { Phone } from "lucide-react";
import { useEffect, useState } from "react";

import { WhatsAppBrandIcon } from "./campaign-layout";
import {
  KALOJIRA_CAMPAIGN_PHONE_HREF,
  KALOJIRA_CAMPAIGN_WHATSAPP_HREF,
} from "./content";
import { trackKalojiraCampaignEvent } from "./tracking";

type MobileOrderBarProps = {
  onOrderClick: (placement: string) => void;
  checkoutId?: string;
  whatsappHref?: string;
};

export function MobileOrderBar({
  onOrderClick,
  checkoutId = "kalojira-checkout",
  whatsappHref = KALOJIRA_CAMPAIGN_WHATSAPP_HREF,
}: MobileOrderBarProps) {
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(checkoutId);
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      setCheckoutVisible(entry.isIntersecting);
    }, { threshold: 0.12 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [checkoutId]);

  return (
    <div
      className="kalojira-order-bar"
      data-hidden={checkoutVisible ? "true" : undefined}
      role="group"
      aria-label="দ্রুত অর্ডার"
    >
      <a
        href={whatsappHref}
        aria-label="WhatsApp-এ অর্ডার করুন"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackKalojiraCampaignEvent("whatsapp_click", { placement: "sticky_bar" })}
        className="flex min-w-[52px] flex-col items-center gap-1 text-[9px] font-medium tracking-[0.04em] text-white/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <WhatsAppBrandIcon className="h-5 w-5" />
        <span>হোয়াটসঅ্যাপ</span>
      </a>
      <button
        type="button"
        aria-label="অর্ডার করুন"
        onClick={() => onOrderClick("sticky_bar")}
        className="h-12 flex-1 rounded-full bg-[#f5c456] px-4 text-lg font-bold text-[#19382d] shadow-[0_4px_16px_rgba(245,196,86,0.4)] transition-colors hover:bg-[#ffd970] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c456]"
      >
        অর্ডার করুন
      </button>
      <a
        href={KALOJIRA_CAMPAIGN_PHONE_HREF}
        aria-label="ফোনে অর্ডার করুন"
        onClick={() => trackKalojiraCampaignEvent("phone_click", { placement: "sticky_bar" })}
        className="flex min-w-[52px] flex-col items-center gap-1 text-[9px] font-medium tracking-[0.04em] text-white/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Phone className="h-5 w-5" aria-hidden="true" />
        <span>কল করুন</span>
      </a>
    </div>
  );
}
