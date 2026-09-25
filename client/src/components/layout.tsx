import { Link, useLocation } from "wouter";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";

import { BagIcon } from "@/components/bag-icon";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useCart } from "@/contexts/cart-context";
import CartDrawer from "@/components/cart-drawer";
import {
  fetchStorefrontProducts,
  getProductImage,
  searchStorefrontProducts,
  STOREFRONT_CATALOG_QUERY_OPTIONS,
} from "@/lib/storefront-products";
import { generatedStorefrontProducts } from "@/lib/generated-storefront-products";
import { getVisibleFeaturedCollections } from "@/lib/featured-collections";

// Bloop header glyphs (24×24, filled).
function HeaderMenuIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4 8V10H20V8H4ZM4 16H20V14H4V16Z" />
    </svg>
  );
}

function HeaderSearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22.2069 20.7929L16.3141 14.8999C17.5655 13.2888 18.1557 11.2614 17.9647 9.23038C17.7737 7.19937 16.8158 5.31752 15.286 3.96799C13.7562 2.61845 11.7696 1.90269 9.73062 1.96645C7.69165 2.0302 5.75363 2.86868 4.31115 4.31115C2.86868 5.75363 2.0302 7.69165 1.96645 9.73062C1.90269 11.7696 2.61845 13.7562 3.96799 15.286C5.31752 16.8158 7.19937 17.7737 9.23038 17.9647C11.2614 18.1557 13.2888 17.5655 14.8999 16.3141L20.7929 22.2069L22.2069 20.7929ZM9.99994 15.9999C8.81325 15.9999 7.65322 15.648 6.66652 14.9888C5.67983 14.3295 4.91079 13.3924 4.45667 12.296C4.00254 11.1997 3.88372 9.99329 4.11523 8.8294C4.34674 7.66551 4.91819 6.59642 5.7573 5.7573C6.59642 4.91819 7.66551 4.34674 8.8294 4.11523C9.99329 3.88372 11.1997 4.00254 12.296 4.45667C13.3924 4.91079 14.3295 5.67983 14.9888 6.66652C15.648 7.65322 15.9999 8.81325 15.9999 9.99994C15.9981 11.5907 15.3654 13.1158 14.2406 14.2406C13.1158 15.3654 11.5907 15.9981 9.99994 15.9999Z" />
    </svg>
  );
}

// Mobile dock home glyph, coloured through currentColor.
function DockHomeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* Home icon from Remix Icon by Remix Design (https://github.com/cyberalien/RemixIcon/blob/master/License). */}
      <path fill="currentColor" d="M21 20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.49a1 1 0 0 1 .386-.79l8-6.223a1 1 0 0 1 1.228 0l8 6.223a1 1 0 0 1 .386.79zm-2-1V9.978l-7-5.444l-7 5.444V19zM7 15h10v2H7z" />
    </svg>
  );
}

function DockProductsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* Product icon from Huge Icons by Hugeicons, supplied by the user. */}
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={1.5}>
        <path strokeLinejoin="round" d="M11 22c-.818 0-1.6-.33-3.163-.99C3.946 19.366 2 18.543 2 17.16V7m9 15V11.355M11 22c.725 0 1.293-.26 2.5-.777M20 7v4" />
        <path d="M15 17.5h7M18.5 21v-7" />
        <path strokeLinejoin="round" d="M7.326 9.691L4.405 8.278C2.802 7.502 2 7.114 2 6.5s.802-1.002 2.405-1.778l2.92-1.413C9.13 2.436 10.03 2 11 2s1.871.436 3.674 1.309l2.921 1.413C19.198 5.498 20 5.886 20 6.5s-.802 1.002-2.405 1.778l-2.92 1.413C12.87 10.564 11.97 11 11 11s-1.871-.436-3.674-1.309M5 12l2 1m9-9L6 9" />
      </g>
    </svg>
  );
}

// Bloop-style footer socials: a filled 40×40 circle with the brand glyph knocked out.
function FooterFacebookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="currentColor" className="h-6 w-6" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M20 0C8.95 0 0 8.95 0 20s8.95 20 20 20 20-8.95 20-20S31.05 0 20 0ZM16.842 21.776V30.5H21.6V21.776h3.548l0.738-4.011H21.6V16.346c0-2.121 0.833-2.933 2.982-2.933c0.669 0 1.206 0.016 1.518 0.049V9.824C25.512 9.656 24.061 9.5 23.207 9.5C18.823 9.5 16.842 11.571 16.842 16.038v1.727H14.135v4.011H16.842Z" />
    </svg>
  );
}

function FooterInstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="currentColor" className="h-6 w-6" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M20 0C8.95431 0 0 8.95431 0 20C0 31.0457 8.95431 40 20 40C31.0457 40 40 31.0457 40 20C40 8.95431 31.0457 0 20 0ZM15.0476 8.07144C16.3286 8.01429 16.7381 8 19.9952 8C23.2524 8 23.6619 8.01429 24.9476 8.06668C26.2286 8.12383 27.1 8.32864 27.8619 8.62393C28.6476 8.93352 29.319 9.34312 29.9857 10.0099C30.6524 10.6767 31.0667 11.3435 31.3714 12.1342C31.6667 12.901 31.8714 13.7726 31.9286 15.049C31.9857 16.3302 32 16.7351 32 19.9976C32 23.2602 31.9857 23.665 31.9286 24.9462C31.8714 26.2274 31.6667 27.099 31.3714 27.8611C31.0619 28.647 30.6524 29.3185 29.9857 29.9853C29.319 30.6521 28.6524 31.0665 27.8619 31.3713C27.0952 31.6666 26.2238 31.8714 24.9476 31.9286C23.6667 31.9857 23.2619 32 20 32C16.7381 32 16.3333 31.9857 15.0524 31.9286C13.7714 31.8714 12.9 31.6666 12.1381 31.3713C11.3524 31.0617 10.681 30.6521 10.0143 29.9853C9.34762 29.3185 8.93333 28.6517 8.62857 27.8611C8.33333 27.0943 8.12857 26.2227 8.07143 24.9462C8.01429 23.665 8 23.2554 8 19.9976C8 16.7398 8.01429 16.3302 8.07143 15.0538C8.12857 13.7726 8.33333 12.901 8.62857 12.1389C8.9381 11.353 9.34762 10.6815 10.0143 10.0147C10.681 9.34789 11.3476 8.93352 12.1381 8.6287C12.9 8.3334 13.7714 8.1286 15.0476 8.07144Z" />
      <path d="M20 14C16.6893 14 14 16.6847 14 20C14 23.3153 16.6847 26 20 26C23.3153 26 26 23.3153 26 20C26 16.6847 23.3153 14 20 14ZM20 23.8903C17.8485 23.8903 16.1051 22.1468 16.1051 19.9954C16.1051 17.8439 17.8485 16.1005 20 16.1005C22.1515 16.1005 23.8949 17.8439 23.8949 19.9954C23.8949 22.1468 22.1515 23.8903 20 23.8903Z" />
      <circle cx="26.5" cy="13.5" r="1.5" />
    </svg>
  );
}

function FooterWhatsAppIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="currentColor" className="h-6 w-6" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M20 0C8.95 0 0 8.95 0 20s8.95 20 20 20 20-8.95 20-20S31.05 0 20 0ZM27.705 12.197C25.647 10.134 22.907 9 19.995 9c-6.011 0-10.902 4.891-10.902 10.902 0 1.92 0.501 3.796 1.454 5.451L9 31l5.78-1.517c1.591 0.869 3.383 1.326 5.21 1.326h0.005c6.006 0 11.005-4.891 11.005-10.902 0-2.912-1.238-5.647-3.295-7.71zm-7.71 16.775c-1.63 0-3.226-0.437-4.616-1.262l-0.329-0.196-3.428 0.899L12.536 25.068l-0.216-0.344c-0.908-1.444-1.385-3.108-1.385-4.822 0-4.994 4.066-9.06 9.065-9.06 2.421 0 4.695 0.943 6.404 2.657 1.709 1.714 2.76 3.988 2.755 6.408 0 4.999-4.169 9.065-9.163 9.065zm4.97-6.787c-0.27-0.137-1.611-0.796-1.861-0.884-0.25-0.093-0.432-0.137-0.614 0.137-0.182 0.275-0.702 0.884-0.864 1.071-0.157 0.182-0.319 0.206-0.589 0.069-1.601-0.8-2.652-1.429-3.708-3.241-0.28-0.481 0.28-0.447 0.8-1.488 0.088-0.182 0.044-0.339-0.025-0.476-0.069-0.137-0.614-1.478-0.84-2.023-0.221-0.53-0.447-0.457-0.614-0.467-0.157-0.01-0.339-0.01-0.521-0.01-0.182 0-0.476 0.069-0.727 0.339-0.25 0.275-0.953 0.933-0.953 2.274 0 1.341 0.977 2.637 1.11 2.819 0.137 0.182 1.92 2.932 4.655 4.115 1.729 0.746 2.406 0.81 3.271 0.683 0.525-0.079 1.611-0.658 1.837-1.296 0.226-0.638 0.226-1.183 0.157-1.296-0.064-0.123-0.246-0.192-0.516-0.324Z" />
    </svg>
  );
}

const MENU_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Top Selling Products - সেরা বিক্রিত পণ্য", href: "/collection/top-selling-products" },
  { label: "Track Order", href: "/track-order" },
  { label: "Contact Us", href: "/contact-us" },
] as const;

// Bloop menu drawer: small link columns (routes shared with the footer).
const MENU_LINK_COLUMNS = [
  { heading: "Help", links: [{ label: "Track Order", href: "/track-order" }, { label: "How to Order", href: "/how-to-order" }, { label: "FAQ", href: "/faq" }, { label: "Contact", href: "/contact-us" }] },
  { heading: "Info", links: [{ label: "About Us", href: "/about-us" }, { label: "Privacy Policy", href: "/privacy-policy" }, { label: "Refund & Exchange", href: "/refund-return-exchange" }] },
] as const;

const MENU_SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/angonaloyofficial", Icon: FooterFacebookIcon },
  { label: "Instagram", href: "https://www.instagram.com/angonaloyofficial/", Icon: FooterInstagramIcon },
  { label: "WhatsApp", href: "https://api.whatsapp.com/send/?phone=8801819502705", Icon: FooterWhatsAppIcon },
] as const;

// Bloop drawer close glyph (24×24, filled).
function DrawerCloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
      <path d="M20.707 4.70697L19.293 3.29297L12 10.586L4.707 3.29297L3.293 4.70697L10.586 12L3.293 19.293L4.707 20.707L12 13.414L19.293 20.707L20.707 19.293L13.414 12L20.707 4.70697Z" />
    </svg>
  );
}

function BrandTagline() {
  return (
    <>
      "আঙ্গনালয়" অর্থ আপনার ঘর ও জীবনযাত্রার জন্য একটি সম্পূর্ণ <span className="whitespace-nowrap">সমাধান ।</span> আপনার আঙ্গন থেকে রান্নাঘর – সবকিছুর জন্য আঙ্গনালয়!
    </>
  );
}

const INFORMATION_LINKS = [
  ["About Us", "/about-us"],
  ["Contact", "/contact-us"],
  ["Terms & Conditions", "/terms-and-conditions"],
  ["Privacy Policy", "/privacy-policy"],
  ["Refund & Exchange", "/refund-return-exchange"],
] as const;

const SUPPORT_LINKS = [
  ["How to Order", "/how-to-order"],
  ["Order Tracking", "/track-order"],
  ["Payment & Shipping", "/shipping-policy"],
  ["FAQ", "/faq"],
] as const;

function AnnouncementClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path fill="currentColor" d="M12 2C10.0222 2 8.08879 2.58649 6.4443 3.6853C4.79981 4.78412 3.51809 6.3459 2.76121 8.17317C2.00433 10.0004 1.8063 12.0111 2.19215 13.9509C2.578 15.8907 3.53041 17.6725 4.92894 19.0711C6.32746 20.4696 8.10929 21.422 10.0491 21.8079C11.9889 22.1937 13.9996 21.9957 15.8268 21.2388C17.6541 20.4819 19.2159 19.2002 20.3147 17.5557C21.4135 15.9112 22 13.9778 22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7363 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.7612C14.6136 2.25866 13.3132 2 12 2ZM12 20C10.4178 20 8.87104 19.5308 7.55544 18.6518C6.23985 17.7727 5.21447 16.5233 4.60897 15.0615C4.00347 13.5997 3.84504 11.9911 4.15372 10.4393C4.4624 8.88743 5.22433 7.46197 6.34315 6.34315C7.46197 5.22433 8.88743 4.4624 10.4393 4.15372C11.9911 3.84504 13.5997 4.00346 15.0615 4.60896C16.5233 5.21447 17.7727 6.23984 18.6518 7.55544C19.5308 8.87103 20 10.4177 20 12C19.9976 14.121 19.154 16.1544 17.6542 17.6542C16.1544 19.154 14.121 19.9976 12 20ZM12.6665 6.2915H10.6665V13.2915H16.667V11.2915H12.6665V6.2915Z" />
    </svg>
  );
}

function AnnouncementSmileyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path fill="currentColor" d="M15 8.65C14.733 8.65 14.472 8.72918 14.25 8.87752C14.028 9.02586 13.8549 9.2367 13.7528 9.48338C13.6506 9.73006 13.6239 10.0015 13.6759 10.2634C13.728 10.5252 13.8566 10.7658 14.0454 10.9546C14.2342 11.1434 14.4748 11.272 14.7366 11.3241C14.9985 11.3762 15.2699 11.3494 15.5166 11.2472C15.7633 11.1451 15.9741 10.972 16.1225 10.75C16.2708 10.528 16.35 10.267 16.35 10C16.35 9.64196 16.2078 9.29858 15.9546 9.04541C15.7014 8.79223 15.358 8.65 15 8.65ZM9 11.35C9.26701 11.35 9.52802 11.2708 9.75002 11.1225C9.97203 10.9741 10.1451 10.7633 10.2472 10.5166C10.3494 10.2699 10.3762 9.9985 10.3241 9.73663C10.272 9.47475 10.1434 9.23421 9.9546 9.04541C9.7658 8.8566 9.52525 8.72803 9.26338 8.67594C9.0015 8.62385 8.73006 8.65058 8.48338 8.75276C8.2367 8.85494 8.02586 9.02797 7.87752 9.24998C7.72918 9.47199 7.65 9.733 7.65 10C7.65 10.358 7.79224 10.7014 8.04541 10.9546C8.29858 11.2078 8.64196 11.35 9 11.35ZM9.1714 13.8286L7.7573 15.2427C8.31446 15.7999 8.9759 16.2418 9.70386 16.5434C10.4318 16.8449 11.2121 17.0001 12 17.0001C12.788 17.0001 13.5682 16.8449 14.2961 16.5434C15.0241 16.2418 15.6856 15.7999 16.2427 15.2427L14.8286 13.8286C14.0665 14.5559 13.0535 14.9617 12 14.9617C10.9465 14.9617 9.93353 14.5559 9.1714 13.8286ZM12 2C10.0222 2 8.08879 2.58649 6.4443 3.6853C4.79981 4.78412 3.51809 6.3459 2.76121 8.17317C2.00433 10.0004 1.8063 12.0111 2.19215 13.9509C2.578 15.8907 3.53041 17.6725 4.92894 19.0711C6.32746 20.4696 8.10929 21.422 10.0491 21.8079C11.9889 22.1937 13.9996 21.9957 15.8268 21.2388C17.6541 20.4819 19.2159 19.2002 20.3147 17.5557C21.4135 15.9112 22 13.9778 22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7363 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.7612C14.6136 2.25866 13.3132 2 12 2ZM12 20C10.4178 20 8.87104 19.5308 7.55544 18.6518C6.23985 17.7727 5.21447 16.5233 4.60897 15.0615C4.00347 13.5997 3.84504 11.9911 4.15372 10.4393C4.4624 8.88743 5.22433 7.46197 6.34315 6.34315C7.46197 5.22433 8.88743 4.4624 10.4393 4.15372C11.9911 3.84504 13.5997 4.00346 15.0615 4.60896C16.5233 5.21447 17.7727 6.23984 18.6518 7.55544C19.5308 8.87103 20 10.4177 20 12C19.9976 14.121 19.154 16.1544 17.6542 17.6542C16.1544 19.154 14.121 19.9976 12 20Z" />
    </svg>
  );
}

function AnnouncementChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="7" height="10" viewBox="0 0 7 10" fill="currentColor" aria-hidden="true">
      <path fill="currentColor" d="M0.885652 5.00067L5.59899 9.71484L6.77734 8.53651L3.24232 5.00067L6.77734 1.46483L5.59899 0.286502L0.885652 5.00067Z" />
    </svg>
  );
}

function AnnouncementChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="7" height="10" viewBox="0 0 7 10" fill="currentColor" aria-hidden="true">
      <path fill="currentColor" d="M6.77841 5.00067L2.06508 9.71484L0.886719 8.53651L4.42174 5.00067L0.886719 1.46483L2.06508 0.286502L6.77841 5.00067Z" />
    </svg>
  );
}

// Same price display as the product cards: first-variant price, compare-at struck through.
function formatSearchAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `৳${amount.toLocaleString("en-US")}` : "৳0";
}

const ANNOUNCEMENT_COUNT = 3;
const ANNOUNCEMENT_INTERVAL_MS = 5000;

function AnnouncementSlide({ index }: { index: number }) {
  const iconClassName = "h-5 w-5 shrink-0 sm:h-6 sm:w-6";
  if (index === 1) {
    return (
      <>
        <AnnouncementClockIcon className={iconClassName} />
        <span className="truncate"><span className="font-bangla">দ্রুত ডেলিভারি</span> — Fast delivery</span>
      </>
    );
  }
  if (index === 2) {
    return (
      <>
        <AnnouncementSmileyIcon className={iconClassName} />
        <span className="truncate"><span className="font-bangla">ক্যাশ অন ডেলিভারি</span> — Cash on delivery</span>
      </>
    );
  }
  return (
    <>
      <AnnouncementSmileyIcon className={iconClassName} />
      <span className="truncate">
        Free shipping <span className="hidden sm:inline">on orders </span>over ৳2600{" "}
        <Link href="/products" className="underline decoration-[#B40000] decoration-2 underline-offset-4 transition-opacity hover:opacity-70">
          Shop now
        </Link>
      </span>
    </>
  );
}

function AnnouncementBar() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion || isPaused) return;
    const timeoutId = setTimeout(() => {
      setActiveIndex((index) => (index + 1) % ANNOUNCEMENT_COUNT);
    }, ANNOUNCEMENT_INTERVAL_MS);
    return () => clearTimeout(timeoutId);
  }, [activeIndex, isPaused, shouldReduceMotion]);

  const showPrevious = () => setActiveIndex((index) => (index - 1 + ANNOUNCEMENT_COUNT) % ANNOUNCEMENT_COUNT);
  const showNext = () => setActiveIndex((index) => (index + 1) % ANNOUNCEMENT_COUNT);

  return (
    <div
      role="region"
      aria-label="Store announcements"
      className="relative flex h-10 items-center overflow-hidden bg-[#F9D05E] px-1 font-bloop text-[12px] font-bold uppercase tracking-[0.015em] text-[#B40000] sm:h-11 sm:px-[30px] sm:text-[13px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <button
        type="button"
        aria-label="Previous announcement"
        onClick={showPrevious}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70"
      >
        <AnnouncementChevronLeftIcon />
      </button>
      <div aria-live="polite" className="flex min-w-0 flex-1 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeIndex}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeOut" }}
            className="flex min-w-0 items-center justify-center gap-2.5 whitespace-nowrap"
          >
            <AnnouncementSlide index={activeIndex} />
          </motion.div>
        </AnimatePresence>
      </div>
      <button
        type="button"
        aria-label="Next announcement"
        onClick={showNext}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70"
      >
        <AnnouncementChevronRightIcon />
      </button>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuPage, setMobileMenuPage] = useState<"main" | "collections">("main");
  const [isAtPageBottom, setIsAtPageBottom] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { setIsOpen: setCartOpen, itemCount } = useCart();
  const { data: searchableProducts = [] } = useQuery({
    queryKey: ["merchant-suite-products-listing"],
    queryFn: fetchStorefrontProducts,
    ...STOREFRONT_CATALOG_QUERY_OPTIONS,
    initialData: generatedStorefrontProducts,
    initialDataUpdatedAt: 0,
    enabled: isSearchOpen || isOpen,
  });
  const visibleCollections = getVisibleFeaturedCollections(searchableProducts);
  // Desktop header links split around the centred logo: the first three sit left, the rest sit right.
  const headerNavLeftCollections = visibleCollections.slice(0, 3);
  const headerNavRightCollections = visibleCollections.slice(3);
  const desktopMenuItems = [
    ...MENU_ITEMS.slice(0, 2),
    ...visibleCollections.map(({ slug, label }) => ({ label, href: `/collection/${slug}` })),
    ...MENU_ITEMS.slice(2),
  ];

  const openSearch = () => setIsSearchOpen(true);
  const openMenu = () => {
    setMobileMenuPage("main");
    setIsOpen(true);
  };
  const goToSearch = () => {
    const query = searchQuery.trim();
    setLocation(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
  };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearch();
    setIsSearchOpen(false);
  };
  const submitMenuSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearch();
    setIsOpen(false);
  };
  const suggestions = searchStorefrontProducts(searchableProducts, searchQuery).slice(0, 5);

  // Bloop mobile dock: 56px tap targets, 24px glyph over an 11px Bricolage label.
  const dockItemClass = "flex h-14 min-w-[56px] flex-col items-center justify-center gap-0.5 whitespace-nowrap font-bloop text-[11px] font-bold leading-[13px] transition-opacity hover:opacity-70";
  // Bloop menu drawer pieces shared by the mobile card and the desktop panel.
  const menuLabelClass = "font-bloop text-[13px] font-bold uppercase tracking-[0.015em] text-[#333333]";
  const menuBanglaClass = "font-bangla text-[20px] font-semibold";
  const mobileMenuLinkClass = "flex min-h-[49px] w-full items-center justify-between gap-4 py-1 text-left font-bloop text-[24px] font-bold leading-[1.15] tracking-[-0.01em] text-[#DB2828] transition-opacity hover:opacity-70";
  const menuCloseButton = (
    <button type="button" onClick={() => setIsOpen(false)} aria-label="Close menu" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#333333] text-white transition-opacity hover:opacity-85">
      <DrawerCloseIcon />
    </button>
  );
  const menuSearchForm = (
    <form onSubmit={submitMenuSearch} role="search" className="flex items-center gap-3 border-b-2 border-[#333333] pb-2">
      <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search" aria-label="Search products" className="min-w-0 flex-1 bg-transparent py-1 text-left font-bloop-body text-[16px] text-[#333333] outline-none placeholder:text-[#333333]/55" />
      <button type="submit" aria-label="Submit search" className="flex h-6 w-6 shrink-0 items-center justify-center text-[#333333] transition-opacity hover:opacity-70">
        <HeaderSearchIcon className="h-6 w-6" />
      </button>
    </form>
  );
  const menuLinkColumns = (showInfo: boolean) => (
    <div className={showInfo ? "grid grid-cols-2 gap-x-4" : "grid grid-cols-1"}>
      {MENU_LINK_COLUMNS.filter(({ heading }) => showInfo || heading !== "Info").map(({ heading, links }) => (
        <div key={heading}>
          <h2 className={menuLabelClass}>{heading}</h2>
          <ul className="mt-4 font-bloop text-[15px] font-bold leading-[32px] tracking-[0.005em] text-[#333333]">
            {links.map(({ label, href }) => (
              <li key={label}>
                <Link asChild href={href} onClick={() => setIsOpen(false)}>
                  <a className="transition-opacity hover:opacity-70">{label}</a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
  const menuBrandBlock = (showContact: boolean) => (
    <div className="text-[#333333]">
      <div className="h-px bg-[#333333]/15" />
      <h2 className={`mt-10 ${menuLabelClass}`}>Angonaloy</h2>
      <p className="mt-4 font-bangla text-[17px] font-bold leading-[1.4]">
        <BrandTagline />
      </p>
      <div className="-ml-[10px] mt-4 flex items-center">
        {MENU_SOCIAL_LINKS.map(({ label, href, Icon }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-11 w-11 items-center justify-center transition-opacity hover:opacity-70">
            <Icon />
          </a>
        ))}
      </div>
      {showContact ? (
        <>
          <h2 className={`mt-8 ${menuLabelClass}`}>Contact</h2>
          <a href="tel:+8801819502705" aria-label="Call Angonaloy Team" className="mt-4 block font-bloop text-[17px] font-bold transition-opacity hover:opacity-70">
            +880 1819-502705
          </a>
        </>
      ) : null}
      <p className="mt-6 font-bloop-body text-[12px] text-[#333333]/60">© 2026 Angonaloy-আঙ্গনালয়</p>
    </div>
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const updatePageBottom = () => {
      const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      setIsAtPageBottom(window.innerHeight + window.scrollY >= documentHeight - 24);
    };

    updatePageBottom();
    window.addEventListener("scroll", updatePageBottom, { passive: true });
    window.addEventListener("resize", updatePageBottom);
    return () => {
      window.removeEventListener("scroll", updatePageBottom);
      window.removeEventListener("resize", updatePageBottom);
    };
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col md:bg-brand-ivory text-black selection:bg-brand-gold selection:text-white">
      {/* Announcement Bar */}
      <AnnouncementBar />
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-bloop-cream text-[#DB2828]">
        <div className="relative flex h-14 items-center justify-between px-4 md:h-[82px] md:px-[49px]">
          <div className="flex items-center gap-4 md:gap-10">
            <button type="button" aria-label="Open menu" onClick={openMenu} className="flex h-6 w-6 shrink-0 items-center justify-center transition-opacity hover:opacity-70 xl:hidden">
              <HeaderMenuIcon className="h-6 w-6" />
            </button>
            <button type="button" aria-label="Search" onClick={openSearch} className="flex h-6 w-6 shrink-0 items-center justify-center transition-opacity hover:opacity-70 md:hidden">
              <HeaderSearchIcon className="h-6 w-6" />
            </button>
            <div className="hidden items-center gap-10 font-bloop text-[13px] font-bold tracking-[0.015em] xl:flex">
              {headerNavLeftCollections.map(({ slug, label }) => (
                <Link asChild key={slug} href={`/collection/${slug}`}>
                  <a className="whitespace-nowrap transition-opacity hover:opacity-70">{label}</a>
                </Link>
              ))}
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link asChild href="/">
              <a className="flex items-center" aria-label="Angonaloy home">
                <span
                  className="text-[34px] font-bold leading-none text-[#FF2849] md:text-[44px]"
                  style={{ fontFamily: "'IhtishamDeshlipi', serif" }}
                >
                  আঙ্গনালয়
                </span>
              </a>
            </Link>
          </div>

          <div className="flex items-center gap-5">
            <div className="mr-5 hidden items-center gap-10 font-bloop text-[13px] font-bold tracking-[0.015em] xl:flex">
              {headerNavRightCollections.map(({ slug, label }) => (
                <Link asChild key={slug} href={`/collection/${slug}`}>
                  <a className="whitespace-nowrap transition-opacity hover:opacity-70">{label}</a>
                </Link>
              ))}
            </div>
            <button type="button" aria-label="Search" onClick={openSearch} className="hidden h-6 w-6 shrink-0 items-center justify-center transition-opacity hover:opacity-70 md:flex">
              <HeaderSearchIcon className="h-6 w-6" />
            </button>
            <button type="button" aria-label="Cart" onClick={() => setCartOpen(true)} className="relative flex h-6 w-6 shrink-0 items-center justify-center transition-opacity hover:opacity-70">
              <BagIcon className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#DB2828] text-[8px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <motion.nav
        aria-label="Mobile navigation"
        initial={false}
        animate={{ y: isAtPageBottom ? "calc(100% + 24px)" : 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-3 bottom-3 z-[80] flex h-16 items-center justify-around rounded-full border border-[#333333]/10 bg-bloop-cream px-2 text-[#333333] shadow-[0_8px_24px_rgba(51,51,51,0.12)] md:hidden"
      >
        <Link asChild href="/">
          <a
            aria-label="Home"
            aria-current={location === "/" ? "page" : undefined}
            className={`${dockItemClass} ${location === "/" ? "text-[#DB2828]" : "text-[#333333]"}`}
          >
            <DockHomeIcon className="h-6 w-6" />
            <span className={location === "/" ? undefined : "text-[#333333]/70"}>Home</span>
          </a>
        </Link>
        <Link asChild href="/products">
          <a
            aria-label="Products"
            aria-current={location === "/products" ? "page" : undefined}
            className={`${dockItemClass} ${location === "/products" ? "text-[#DB2828]" : "text-[#333333]"}`}
          >
            <DockProductsIcon className="h-6 w-6" />
            <span className={location === "/products" ? undefined : "text-[#333333]/70"}>Products</span>
          </a>
        </Link>
        <button
          type="button"
          aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
          onClick={() => setCartOpen(true)}
          className="relative flex h-[52px] w-[52px] shrink-0 -translate-y-1.5 items-center justify-center rounded-full bg-[#DB2828] text-[#FFFDF3] transition-transform duration-150 active:scale-[0.94] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <BagIcon className="h-6 w-6 shrink-0" />
          {itemCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F9D05E] px-1 font-bloop text-[11px] font-bold leading-none text-[#B40000] ring-2 ring-[#FFFBF1]" aria-label={`${itemCount} items in cart`}>
              {itemCount}
            </span>
          )}
          <span className="sr-only">Cart</span>
        </button>
        <button type="button" aria-label="Search products" onClick={openSearch} className={`${dockItemClass} text-[#333333]`}>
          <HeaderSearchIcon className="h-6 w-6" />
          <span className="text-[#333333]/70">Search</span>
        </button>
        <button type="button" aria-label="Open menu" onClick={openMenu} className={`${dockItemClass} text-[#333333]`}>
          <HeaderMenuIcon className="h-6 w-6" />
          <span className="text-[#333333]/70">Menu</span>
        </button>
      </motion.nav>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/10 p-3 sm:p-4 md:px-4 md:pt-[16vh] md:backdrop-blur-md"
          >
            <motion.div
            initial={{ opacity: 0, y: -28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 360, damping: 28, mass: 0.7 }}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === "Escape") setIsSearchOpen(false);
              }}
              className="relative h-auto max-h-[70dvh] w-full max-w-none overflow-y-auto rounded-[12px] bg-bloop-cream px-5 pb-5 pt-5 text-[#333333] md:h-auto md:max-h-none md:max-w-xl md:overflow-hidden md:rounded-2xl md:border md:border-black/10 md:p-6 md:shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <form onSubmit={submitSearch} className="flex min-w-0 flex-1 items-center justify-start gap-3 border-b-2 border-[#333333] pb-2" id="site-search-form">
                  <input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search products" aria-label="Search products" className="min-w-0 flex-1 bg-transparent text-left font-bloop text-[20px] font-bold uppercase leading-[1.3] tracking-[0.01em] text-[#333333] outline-none placeholder:text-[#333333]/40 md:text-[24px]" />
                  {searchQuery ? (
                    <button type="button" onClick={() => setSearchQuery("")} className="shrink-0 font-bloop-body text-[13px] uppercase text-[#333333]/80 transition-opacity hover:opacity-70">
                      Clear
                    </button>
                  ) : null}
                  <button type="submit" aria-label="Submit search" className="flex h-6 w-6 shrink-0 items-center justify-center text-[#333333] transition-opacity hover:opacity-70">
                    <HeaderSearchIcon className="h-6 w-6" />
                  </button>
                </form>
                <button type="button" onClick={() => setIsSearchOpen(false)} aria-label="Close search" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#333333] text-white transition-opacity hover:opacity-85">
                  <DrawerCloseIcon />
                </button>
              </div>
              <div className="pt-6">
                <p className="mb-2 font-bloop text-[12px] font-bold uppercase tracking-[0.015em] text-[#333333]/60">
                  {searchQuery ? "Suggestions" : "Popular searches"}
                </p>
                {suggestions.length > 0 ? (
                  <ul className="divide-y divide-[#333333]/15 md:grid md:grid-cols-4 md:gap-4 md:divide-y-0 md:pt-2">
                    {suggestions.map((product) => {
                      const image = getProductImage(product);
                      const currentPrice = Number(product.variants?.[0]?.price ?? product.price);
                      const compareAtPrice = Number(product.compare_at_price);
                      const hasDiscount = Number.isFinite(currentPrice) && Number.isFinite(compareAtPrice) && compareAtPrice > currentPrice;
                      return (
                        <li key={product.slug}>
                          <button
                            type="button"
                            onClick={() => {
                              setLocation(`/product/${product.slug}`);
                              setIsSearchOpen(false);
                            }}
                            className="flex w-full items-center gap-4 py-4 text-left transition-opacity hover:opacity-80 md:flex-col md:items-stretch md:gap-3 md:py-0 md:text-center"
                          >
                            <span className="h-[100px] w-[100px] shrink-0 overflow-hidden rounded-[20px] bg-bloop-card md:aspect-square md:h-auto md:w-full">
                              {image ? (
                                <img src={image} alt="" className="h-full w-full object-cover" />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-2 font-bloop text-[16px] font-bold leading-[1.3] text-[#333333] md:text-[14px]">{product.name}</span>
                              <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2 md:justify-center">
                                <span className={`font-bloop text-[16px] font-bold md:text-[15px] ${hasDiscount ? "text-[#DB2828]" : "text-[#333333]"}`}>
                                  {formatSearchAmount(currentPrice)}
                                </span>
                                {hasDiscount ? (
                                  <span className="font-bloop text-[14px] font-bold text-[#333333] line-through md:text-[13px]">
                                    {formatSearchAmount(compareAtPrice)}
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="py-6 font-bloop-body text-[15px] text-[#333333]/60">No matching products.</p>
                )}
                <div className="sticky bottom-0 flex justify-center pt-4">
                  <button type="submit" form="site-search-form" className="h-12 rounded-full bg-[#DB2828] px-8 font-bloop text-[16px] font-bold text-[#FFFDF3] shadow-[0_8px_24px_rgba(51,51,51,0.12)] transition-colors hover:bg-[#B40000]">
                    View all results
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={true}>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] w-full h-[100dvh] supports-[height:100dvh]:h-dvh p-3 sm:p-4 pointer-events-none"
          >
            <motion.div
              className="absolute inset-0 bg-black/10 pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3 } }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } }}
              className="relative w-full h-full flex flex-col pointer-events-auto rounded-[12px] bg-bloop-cream text-[#333333] shadow-2xl overflow-hidden"
            >
              <div className="flex h-full flex-col overflow-y-auto overscroll-contain px-6 pb-8 pt-4 md:hidden">
                <div className="flex items-center justify-between">
                  {mobileMenuPage === "main" ? (
                    <span className={menuLabelClass}>Menu</span>
                  ) : (
                    <button type="button" onClick={() => setMobileMenuPage("main")} className={`flex items-center gap-3 transition-opacity hover:opacity-70 ${menuLabelClass}`}>
                      <ArrowLeft className="h-6 w-6" strokeWidth={1.75} /> Menu
                    </button>
                  )}
                  {menuCloseButton}
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={mobileMenuPage}
                    initial={{ opacity: 0, y: 4, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.99 }}
                    transition={{ duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }}
                    className="flex min-h-0 flex-1 flex-col"
                  >
                  {mobileMenuPage === "main" ? (
                  <>
                  <div className="mt-8">{menuSearchForm}</div>
                  <nav aria-label="Mobile menu" className="mt-6">
                    <Link asChild href="/" onClick={() => setIsOpen(false)}>
                      <a className={mobileMenuLinkClass}><span>Home <span className={menuBanglaClass}>/ হোম</span></span></a>
                    </Link>
                    <Link asChild href="/products" onClick={() => setIsOpen(false)}>
                      <a className={mobileMenuLinkClass}><span>Products <span className={menuBanglaClass}>/ পণ্যসমূহ</span></span></a>
                    </Link>
                    <Link asChild href="/collection/top-selling-products" onClick={() => setIsOpen(false)}>
                      <a className={mobileMenuLinkClass}><span>Top Selling Products <span className={menuBanglaClass}>/ সেরা বিক্রিত পণ্য</span></span></a>
                    </Link>
                    <button type="button" onClick={() => setMobileMenuPage("collections")} className={mobileMenuLinkClass}><span>Collections <span className={menuBanglaClass}>/ ক্যাটাগরিসমূহ</span></span><AnnouncementChevronRightIcon /></button>
                  </nav>
                  <div className="mt-10">{menuLinkColumns(false)}</div>
                  <div className="mt-10">{menuBrandBlock(false)}</div>
                  </>
                ) : (
                  <nav aria-label="Collections" className="mt-8">
                    {visibleCollections.map(({ slug, label }) => (
                      <Link asChild key={slug} href={`/collection/${slug}`} onClick={() => setIsOpen(false)}>
                        <a className={mobileMenuLinkClass}>{label}</a>
                      </Link>
                    ))}
                  </nav>
                )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="hidden md:flex md:h-full md:flex-col md:overflow-y-auto md:px-12 md:pb-10 md:pt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className={menuLabelClass}>Menu</span>
                  {menuCloseButton}
                </div>

                <div className="grid flex-1 grid-cols-12 gap-x-10 pt-6">
                  {/* Search + Navigation Links */}
                  <div className="col-span-7 flex flex-col">
                    <div className="max-w-[560px]">{menuSearchForm}</div>
                    <nav aria-label="Menu" className="mt-6 flex flex-col">
                      {desktopMenuItems.map((item, idx) => {
                        const [englishLabel, banglaLabel] = item.label.split(" - ");
                        return (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: idx * 0.06 + 0.2, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <Link asChild href={item.href} onClick={() => setIsOpen(false)}>
                              <a className="flex min-h-[58px] items-center font-bloop text-[32px] font-bold leading-[1.1] tracking-[-0.015em] text-[#DB2828] transition-opacity duration-300 hover:opacity-70">
                                <span>
                                  {englishLabel}
                                  {banglaLabel ? <> <span className="font-bangla text-[28px] font-semibold">/ {banglaLabel}</span></> : null}
                                </span>
                              </a>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Small columns, brand + contact */}
                  <div className="col-span-5 flex flex-col pt-2">
                    {menuLinkColumns(true)}
                    <div className="mt-12">{menuBrandBlock(true)}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Main Content with Transition */}
      <main className="flex-grow overflow-hidden bg-bloop-cream pb-20 md:pb-0 lg:overflow-clip">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 14, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(3px)" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bloop-style Footer */}
      <footer className="bg-[#DB2828] px-[17px] pb-14 pt-12 text-[#FFFDF3] md:px-12 md:pb-20 md:pt-[100px]">
        <div className="grid grid-cols-1 md:grid-cols-12 md:gap-x-5">
          {/* Logo */}
          <div className="md:col-span-4">
            <Link asChild href="/">
              <a aria-label="Angonaloy home" className="inline-block transition-opacity hover:opacity-80">
                <span
                  className="block text-[52px] font-bold leading-none text-[#F9D05E]"
                  style={{ fontFamily: "'IhtishamDeshlipi', serif" }}
                >
                  আঙ্গনালয়
                </span>
              </a>
            </Link>
            <p className="mt-4 font-bangla text-[14px] font-medium leading-[21px] md:mt-6 md:max-w-[320px] md:text-[15.4px] md:leading-[23px]">
              <BrandTagline />
            </p>
          </div>

          {/* Big links */}
          <ul className="mt-8 font-bloop text-[25px] font-bold leading-[38px] tracking-[-0.015em] md:col-span-4 md:mt-0 md:text-[43px] md:leading-[58px]">
            <li>
              <Link asChild href="/products">
                <a className="transition-opacity hover:opacity-80">Explore Products</a>
              </Link>
            </li>
            {visibleCollections.map(({ slug, label }) => (
              <li key={slug}>
                <Link asChild href={`/collection/${slug}`}>
                  <a className="transition-opacity hover:opacity-80">{label}</a>
                </Link>
              </li>
            ))}
          </ul>

          {/* Small link columns */}
          <div className="mt-10 grid grid-cols-1 gap-y-8 md:col-span-4 md:mt-0 md:grid-cols-4 md:gap-x-5 md:gap-y-0">
            {([["Information", INFORMATION_LINKS], ["Support", SUPPORT_LINKS]] as const).map(([heading, links]) => (
              <div key={heading} className="md:col-span-2">
                <h2 className="font-bloop text-[20px] font-bold leading-[1.2] md:pt-[3px] md:text-[28px] md:leading-[1.1]">{heading}</h2>
                <ul className="mt-[27px] font-bloop-body text-[14px] font-medium leading-[32px] tracking-[-0.005em] md:mt-[30px] md:text-[15.4px]">
                  {links.map(([label, href]) => (
                    <li key={label}>
                      <Link asChild href={href}>
                        <a className="underline-offset-[3px] hover:underline">{label}</a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-9 h-px bg-[#FFFDF3]/25 md:mt-[54px]" />

        {/* Bottom Bar */}
        <div className="grid grid-cols-1 gap-y-4 pt-[35px] font-bloop-body text-[14px] font-medium leading-[21px] md:grid-cols-12 md:items-start md:gap-x-5 md:pt-[53px] md:text-[15.4px] md:leading-[23px]">
          <div className="md:col-span-4">
            <p>© 2026 Angonaloy-আঙ্গনালয়</p>
            <p>All rights reserved</p>
          </div>
          <p className="md:col-span-4">
            Designed &amp; Developed by{" "}
            <a
              href="https://api.whatsapp.com/send/?phone=8801733670129"
              className="underline decoration-1 underline-offset-[3px] transition-opacity hover:opacity-80"
            >
              Arc Labs Corporation
            </a>
          </p>
          <div className="-ml-[10px] -mt-[10px] flex items-start md:col-span-4 md:ml-0 md:justify-self-end">
            <a href="https://www.facebook.com/angonaloyofficial" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-11 w-11 items-center justify-center transition-opacity hover:opacity-80">
              <FooterFacebookIcon />
            </a>
            <a href="https://www.instagram.com/angonaloyofficial/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center transition-opacity hover:opacity-80">
              <FooterInstagramIcon />
            </a>
            <a href="https://api.whatsapp.com/send/?phone=8801819502705" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-11 w-11 items-center justify-center transition-opacity hover:opacity-80">
              <FooterWhatsAppIcon />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
