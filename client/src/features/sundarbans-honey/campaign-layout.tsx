import { Copyright, MapPin, MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";

import angonaloyLogo from "@assets/angonaloy-logo.webp";

import {
  HONEY_CAMPAIGN_PHONE_HREF,
  HONEY_CAMPAIGN_PHONE_NUMBER,
  HONEY_CAMPAIGN_WHATSAPP_HREF,
} from "./content";

function ContactLink({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const external = href.startsWith("https://");
  return (
    <a
      href={href}
      aria-label={label}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export function WhatsAppBrandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function CampaignHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#19382d]/10 bg-[#faf3e6]">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        <a
          href="/step/sundarbans-natural-honey"
          aria-label="আঙ্গনালয় সুন্দরবন মধু পেজ"
          className="flex min-h-11 min-w-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c456]"
        >
          <img
            src={angonaloyLogo}
            alt="আঙ্গনালয়"
            className="h-8 w-auto sm:h-9"
            decoding="async"
          />
        </a>
        <nav aria-label="যোগাযোগ" className="flex shrink-0 items-center gap-2">
          <ContactLink
            href={HONEY_CAMPAIGN_PHONE_HREF}
            label="ফোনে অর্ডার করুন"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-[#eab308] px-3.5 py-2 text-[#19382d] transition-colors hover:bg-[#f5c456] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eab308]"
          >
            <Phone className="size-4" strokeWidth={2.5} aria-hidden="true" />
            <span className="hidden text-[12px] font-bold uppercase tracking-[0.1em] min-[380px]:inline">
              কল করুন
            </span>
          </ContactLink>
          <ContactLink
            href={HONEY_CAMPAIGN_WHATSAPP_HREF}
            label="WhatsApp-এ অর্ডার করুন"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-[#25d366] px-3.5 py-2 text-[#06351d] transition-colors hover:bg-[#4be07f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25d366]"
          >
            <WhatsAppBrandIcon className="size-4" />
            <span className="hidden text-[12px] font-bold uppercase tracking-[0.1em] min-[420px]:inline">
              WhatsApp
            </span>
          </ContactLink>
        </nav>
      </div>
    </header>
  );
}

export function CampaignFooter() {
  return (
    <footer className="border-t border-[#19382d]/20 bg-[#eab308] text-[#19382d]">
      <div className="mx-auto max-w-5xl px-4 py-7 text-center sm:px-6 sm:py-9">
        <h2
          className="mx-auto max-w-full text-[clamp(1.15rem,5.65vw,2.25rem)] font-semibold leading-tight tracking-[-0.03em]"
          style={{ fontFamily: "'KaiumSimanto', serif" }}
        >
          <span className="block sm:inline">কোনো কিছু জানতে কিংবা</span>
          <span className="block sm:inline"> সরাসরি অর্ডার করতে যোগাযোগ করুন</span>
        </h2>

        <nav aria-label="সামাজিক যোগাযোগ ও অর্ডার" className="mt-5 flex flex-wrap justify-center gap-3">
          <a
            href="https://www.facebook.com/angonaloyofficial"
            aria-label="Facebook পেজ"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex size-12 items-center justify-center rounded-full border border-[#19382d]/15 bg-[#fffaf0]/70 text-[#19382d] shadow-[0_2px_8px_rgba(25,56,45,0.1)] backdrop-blur-sm transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-px hover:bg-[#fffaf0] hover:shadow-[0_5px_14px_rgba(25,56,45,0.14)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19382d]"
          >
            <span aria-hidden="true" className="font-sans text-[22px] font-semibold leading-none">f</span>
          </a>
          <ContactLink
            href={HONEY_CAMPAIGN_PHONE_HREF}
            label="ফোনে অর্ডার করুন"
            className="inline-flex size-12 items-center justify-center rounded-full border border-[#19382d]/15 bg-[#fffaf0]/70 text-[#19382d] shadow-[0_2px_8px_rgba(25,56,45,0.1)] backdrop-blur-sm transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-px hover:bg-[#fffaf0] hover:shadow-[0_5px_14px_rgba(25,56,45,0.14)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19382d]"
          >
            <Phone className="size-5" strokeWidth={2} aria-hidden="true" />
          </ContactLink>
          <ContactLink
            href={HONEY_CAMPAIGN_WHATSAPP_HREF}
            label="WhatsApp-এ অর্ডার করুন"
            className="inline-flex size-12 items-center justify-center rounded-full border border-[#19382d]/15 bg-[#fffaf0]/70 text-[#19382d] shadow-[0_2px_8px_rgba(25,56,45,0.1)] backdrop-blur-sm transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-px hover:bg-[#fffaf0] hover:shadow-[0_5px_14px_rgba(25,56,45,0.14)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19382d]"
          >
            <WhatsAppBrandIcon className="size-5" />
          </ContactLink>
        </nav>

        <div className="mt-5 flex flex-col items-center gap-2 text-sm font-semibold text-[#19382d]/80 sm:flex-row sm:justify-center sm:gap-6">
          <p className="inline-flex items-center gap-2">
            <Copyright className="size-4 text-[#19382d]" aria-hidden="true" />
            ২০২৬ আঙ্গনালয় — সর্বস্বত্ব সংরক্ষিত
          </p>
          <p className="inline-flex items-center gap-2">
            <MapPin className="size-4 text-[#19382d]" aria-hidden="true" />
            ঢাকা, বাংলাদেশ
          </p>
        </div>
      </div>

      <nav aria-label="নীতিমালা" className="no-scrollbar overflow-x-auto bg-[#0f241c] px-3 py-4 text-[11px] font-semibold text-[#fffaf0] sm:px-4 sm:text-xs">
        <div className="mx-auto flex w-max items-center gap-x-2 whitespace-nowrap sm:gap-x-4">
          <span>Privacy Policy</span>
          <span aria-hidden="true">*</span>
          <span>Refund and Return Policy</span>
          <span aria-hidden="true">*</span>
          <span>Terms and Conditions</span>
        </div>
      </nav>
    </footer>
  );
}
