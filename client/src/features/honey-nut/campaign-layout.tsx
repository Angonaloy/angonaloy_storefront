import { Copyright, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";

import mangoLoverLogo from "@assets/mango-lover-logo.avif";
import { WhatsAppBrandIcon } from "@/features/kalojira-mixed/campaign-layout";

import {
  HONEY_NUT_CAMPAIGN_PHONE_HREF,
  HONEY_NUT_CAMPAIGN_WHATSAPP_HREF,
} from "./content";

export { WhatsAppBrandIcon };

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

export function CampaignHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#19382d]/10 bg-[#faf3e6]">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        <Link
          href="/step/honey-nut"
          aria-label="ম্যাংগো লাভার হানি নাট পেজ"
          className="flex min-h-11 min-w-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c456]"
        >
          <img src={mangoLoverLogo} alt="ম্যাংগো লাভার" className="h-8 w-auto sm:h-9" decoding="async" />
        </Link>
        <nav aria-label="যোগাযোগ" className="flex shrink-0 items-center gap-2">
          <ContactLink
            href={HONEY_NUT_CAMPAIGN_PHONE_HREF}
            label="ফোনে অর্ডার করুন"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-[#eab308] px-3.5 py-2 text-[#19382d] transition-colors hover:bg-[#f5c456] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eab308]"
          >
            <Phone className="size-4" strokeWidth={2.5} aria-hidden="true" />
            <span className="hidden text-[12px] font-bold uppercase tracking-[0.1em] min-[380px]:inline">কল করুন</span>
          </ContactLink>
          <ContactLink
            href={HONEY_NUT_CAMPAIGN_WHATSAPP_HREF}
            label="WhatsApp-এ অর্ডার করুন"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-[#25d366] px-3.5 py-2 text-[#06351d] transition-colors hover:bg-[#4be07f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25d366]"
          >
            <WhatsAppBrandIcon className="size-4" />
            <span className="hidden text-[12px] font-bold uppercase tracking-[0.1em] min-[420px]:inline">WhatsApp</span>
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
        <h2 className="mx-auto max-w-full text-[clamp(1.15rem,5.65vw,2.25rem)] font-extrabold leading-tight tracking-[-0.03em]" style={{ fontFamily: "'KaiumSimanto', serif" }}>
          <span className="block sm:inline">কোনো কিছু জানতে কিংবা</span>
          <span className="block sm:inline"> সরাসরি অর্ডার করতে যোগাযোগ করুন</span>
        </h2>

        <nav aria-label="সামাজিক যোগাযোগ ও অর্ডার" className="mt-5 flex flex-wrap justify-center gap-3">
          <a
            href="https://www.facebook.com/WeAreMangoLover"
            aria-label="Facebook পেজ"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex size-12 items-center justify-center rounded-full border border-[#19382d]/15 bg-[#fffaf0]/70 text-[#19382d] shadow-[0_2px_8px_rgba(25,56,45,0.1)] backdrop-blur-sm transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-px hover:bg-[#fffaf0] hover:shadow-[0_5px_14px_rgba(25,56,45,0.14)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19382d]"
          >
            <span aria-hidden="true" className="font-sans text-[22px] font-semibold leading-none">f</span>
          </a>
          <ContactLink
            href={HONEY_NUT_CAMPAIGN_PHONE_HREF}
            label="ফোনে অর্ডার করুন"
            className="inline-flex size-12 items-center justify-center rounded-full border border-[#19382d]/15 bg-[#fffaf0]/70 text-[#19382d] shadow-[0_2px_8px_rgba(25,56,45,0.1)] backdrop-blur-sm transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-px hover:bg-[#fffaf0] hover:shadow-[0_5px_14px_rgba(25,56,45,0.14)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19382d]"
          >
            <Phone className="size-5" strokeWidth={2} aria-hidden="true" />
          </ContactLink>
          <ContactLink
            href={HONEY_NUT_CAMPAIGN_WHATSAPP_HREF}
            label="WhatsApp-এ অর্ডার করুন"
            className="inline-flex size-12 items-center justify-center rounded-full border border-[#19382d]/15 bg-[#fffaf0]/70 text-[#19382d] shadow-[0_2px_8px_rgba(25,56,45,0.1)] backdrop-blur-sm transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-px hover:bg-[#fffaf0] hover:shadow-[0_5px_14px_rgba(25,56,45,0.14)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19382d]"
          >
            <WhatsAppBrandIcon className="size-5" />
          </ContactLink>
        </nav>

        <div className="mt-5 flex flex-col items-center gap-2 text-sm font-semibold text-[#19382d]/80 sm:flex-row sm:justify-center sm:gap-6">
          <p className="inline-flex items-center gap-2">
            <Copyright className="size-4 text-[#19382d]" aria-hidden="true" />
            ২০২৬ ম্যাংগো লাভার — সর্বস্বত্ব সংরক্ষিত
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
