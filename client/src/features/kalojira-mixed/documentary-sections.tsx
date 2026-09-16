import { ChevronDown, ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useId, useRef, useState } from "react";

import TestimonialsSection from "@/components/ui/testimonials-3";

import {
  audienceHeading,
  audiencePoints,
  demoReviews,
  faqAnswers,
  faqHeading,
  faqQuestions,
  heroEyebrow,
  heroHeadline,
  heroSubcopy,
  honestPositioning,
  importantNotes,
  ingredients,
  nutritionGroups,
  nutritionHeading,
  nutritionistCredentials,
  nutritionistHeading,
  nutritionistName,
  nutritionistStatement,
  servingHeading,
  servingNote,
  servingPoints,
  storyHeading,
  storyProblem,
  storySolution,
  whyHeading,
  whyPoints,
  lifestylePoints,
} from "./content";

type DocumentarySectionsProps = { onOrderClick: (placement: string) => void };

function OrderButton({ placement, label, onOrderClick, className = "" }: {
  placement: string;
  label: string;
  onOrderClick: (placement: string) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOrderClick(placement)}
      className={`inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#e5672e] px-6 py-3 text-base font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-[#d95721] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3d211a] ${className}`}
    >
      {label}<span aria-hidden="true">→</span>
    </button>
  );
}

function SectionIntro({ label, heading, description, light = false }: {
  label: string;
  heading: string;
  description?: string;
  light?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className={`text-sm font-bold tracking-[0.14em] ${light ? "text-[#f0c5a5]" : "text-[#e5672e]"}`}>{label}</p>
      <h2 className={`kalojira-heading mt-3 text-3xl leading-tight tracking-[-0.04em] sm:text-5xl ${light ? "text-[#fff8ee]" : "text-[#3d211a]"}`}>{heading}</h2>
      {description ? <p className={`mx-auto mt-4 max-w-2xl text-base leading-7 ${light ? "text-[#fff8ee]/80" : "text-[#6c5145]"}`}>{description}</p> : null}
    </div>
  );
}

type EditorialPoint = {
  title: string;
  text: string;
  category?: string;
};

function EditorialPointRail({ points }: { points: readonly EditorialPoint[] }) {
  const railRef = useRef<HTMLUListElement>(null);
  const scrollPoints = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>("[data-point-card]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({
      left: direction * (card?.offsetWidth ?? rail.clientWidth),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <div>
      <ul ref={railRef} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-5 pb-2 scroll-px-5 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-9 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {points.map((point, index) => (
          <li key={point.title} data-point-card className="group min-w-[82%] snap-start border-y border-[#19382d]/20 py-4 transition-colors hover:border-[#e9aa22]/70 sm:min-w-0 sm:border-y-0 sm:border-t sm:py-5 lg:border-l lg:border-t-0 lg:pl-5 lg:first:border-l-0 lg:first:pl-0">
            <span className="block font-serif text-5xl font-medium leading-none tracking-[-0.08em] text-[#d9a92b]/70 sm:text-6xl">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="kalojira-heading mt-5 max-w-[14rem] text-xl font-medium leading-tight text-[#19382d] sm:text-2xl">{point.title}</h3>
            {point.category ? <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9a711c]">{point.category}</p> : null}
            <p className="mt-3 max-w-[17rem] text-[13px] leading-6 text-[#654b2f] sm:text-sm sm:leading-7">{point.text}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-end gap-2 sm:hidden">
        <button type="button" aria-label="আগের কার্ড" onClick={() => scrollPoints(-1)} className="flex size-10 items-center justify-center border border-[#19382d] bg-transparent text-[#19382d] transition-colors hover:bg-[#19382d] hover:text-[#fffaf0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19382d]"><ChevronLeft className="size-5" aria-hidden="true" /></button>
        <button type="button" aria-label="পরের কার্ড" onClick={() => scrollPoints(1)} className="flex size-10 items-center justify-center border border-[#19382d] bg-[#19382d] text-[#fffaf0] transition-colors hover:bg-transparent hover:text-[#19382d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19382d]"><ChevronRight className="size-5" aria-hidden="true" /></button>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const answerId = useId();
  return (
    <div className="border-b border-[#3d211a]/12 last:border-0">
      <h3>
        <button type="button" aria-expanded={open} aria-controls={answerId} onClick={() => setOpen((value) => !value)} className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left font-semibold text-[#3d211a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e5672e]">
          <span>{question}</span><ChevronDown className={`size-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open ? <motion.div id={answerId} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden"><p className="pb-4 text-sm leading-6 text-[#6c5145]">{answer}</p></motion.div> : null}
      </AnimatePresence>
    </div>
  );
}

const KALOJIRA_GALLERY = [
  {
    src: "/step/kalojira-mixed/kalojira-mixed-hero-studio-v1.webp",
    alt: "আলো-ছায়ায় কালোজিরা মিক্সডের জার",
  },
  {
    src: "/step/kalojira-mixed/kalojira-mixed-hero-plants-v1.webp",
    alt: "গাছের পাশে কালোজিরা মিক্সডের জার",
  },
  {
    src: "/step/kalojira-mixed/kalojira-mixed-product-in-hand-v1.webp",
    alt: "হাতে ধরা কালোজিরা মিক্সডের জার",
  },
] as const;

export function ProductGallery() {
  const [activeImage, setActiveImage] = useState(0);
  const [galleryRef, galleryApi] = useEmblaCarousel({
    align: "start",
    containScroll: false,
    loop: false,
    skipSnaps: false,
  });

  useEffect(() => {
    if (!galleryApi) return;
    const syncActiveImage = () => setActiveImage(galleryApi.selectedScrollSnap());
    galleryApi.scrollTo(0, true);
    syncActiveImage();
    galleryApi.on("select", syncActiveImage);
    galleryApi.on("reInit", syncActiveImage);
    return () => {
      galleryApi.off("select", syncActiveImage);
      galleryApi.off("reInit", syncActiveImage);
    };
  }, [galleryApi]);

  return (
    <section aria-labelledby="kalojira-gallery-heading" className="bg-brand-ivory px-4 py-4 md:px-16 md:py-10 xl:px-20">
      <div className="mx-auto max-w-[1080px]">
        <h2 id="kalojira-gallery-heading" className="sr-only">কালোজিরা মিক্সডের ছবি</h2>

        <div className="md:hidden">
          <div className="relative mx-auto aspect-square w-full max-w-[1080px] overflow-hidden rounded-[8px] bg-[#f6f6f6]">
            <div ref={galleryRef} className="h-full cursor-grab overflow-hidden active:cursor-grabbing">
              <div className="flex h-full touch-pan-y">
                {KALOJIRA_GALLERY.map((image) => (
                  <div key={image.src} className="relative h-full min-w-0 flex-[0_0_100%] overflow-hidden">
                    <img src={image.src} alt={image.alt} width="1080" height="1080" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover object-center" />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute left-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
              {KALOJIRA_GALLERY.map((image, index) => (
                <button key={image.src} type="button" onClick={() => galleryApi?.scrollTo(index)} aria-label={`কালোজিরা মিক্সডের ছবি ${index + 1}`} className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-[6px] border-2 bg-white shadow-md transition-opacity ${activeImage === index ? "border-black opacity-100" : "border-white/70 opacity-70 hover:opacity-100"}`}>
                  <img src={image.src} alt="" className="h-full w-full object-cover object-center" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="overflow-hidden rounded-[8px] bg-[#f6f6f6]">
            <img src={KALOJIRA_GALLERY[0].src} alt={KALOJIRA_GALLERY[0].alt} width="1080" height="720" className="h-auto w-full object-cover object-center" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {KALOJIRA_GALLERY.slice(1).map((image) => (
              <div key={image.src} className="group overflow-hidden rounded-[8px] bg-[#f6f6f6]">
                <img src={image.src} alt={image.alt} width="540" height="360" loading="lazy" className="h-auto w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function DocumentarySections({ onOrderClick }: DocumentarySectionsProps) {
  return (
    <>
      <section aria-labelledby="kalojira-hero-heading">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-4 sm:px-6 sm:py-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:py-12">
          <div className="order-1">
            <p className="text-sm font-bold text-[#e5672e]">{heroEyebrow}</p>
            <h1 id="kalojira-hero-heading" className="kalojira-heading mt-4 text-5xl leading-[0.98] tracking-[-0.06em] text-[#3d211a] sm:text-7xl">{heroHeadline.split(" ")[0]} <span className="text-[#e5672e]">{heroHeadline.split(" ").slice(1).join(" ")}</span></h1>
            <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-[#5b793e]">{heroSubcopy}</p>
            <OrderButton placement="hero" label="এখনই অর্ডার করুন" onOrderClick={onOrderClick} className="mt-6 w-full sm:w-auto" />
          </div>
          <div className="order-2">
            <img src="/step/kalojira-mixed/kalojira-mixed-hero-sep-8-v1.webp" alt="কালোজিরা মিক্সডের পণ্য জার" className="mx-auto h-auto w-full max-w-[560px] object-contain" width="1199" height="1312" fetchPriority="high" decoding="async" />
          </div>
        </div>
      </section>

      <section aria-labelledby="kalojira-story-heading" className="bg-[#fffdf9] px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <SectionIntro label="কেন তৈরি হলো?" heading={storyHeading} />
          <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1fr_0.9fr]">
            <article className="rounded-[1.75rem] border border-[#e5c9b2] bg-[#fff1e6] p-6 sm:p-8"><span className="rounded-full bg-[#fff8ee] px-4 py-2 text-sm font-bold text-[#e5672e]">{storyProblem.label}</span><h2 id="kalojira-story-heading" className="kalojira-heading mt-8 text-2xl text-[#3d211a] sm:text-3xl">{storyProblem.heading}</h2><p className="mt-5 leading-7 text-[#6c5145]">{storyProblem.text}</p><img src="/step/kalojira-mixed/kalojira-mixed-story-ingredients-v1.webp" alt="কালোজিরা মিক্সডের ৮টি উপাদান: কালোজিরা, রসুন, বিশুদ্ধ মধু, জয়তুন, কিসমিস, খেজুর, ত্বীন ফল ও ইরানি জাফরান" className="mt-7 h-auto w-full" width="1600" height="618" loading="lazy" decoding="async" /></article>
            <article className="overflow-hidden rounded-[1.75rem] bg-[#5b793e] text-[#fff8ee]"><div className="p-6 sm:p-8"><span className="rounded-full bg-[#f0c5a5] px-4 py-2 text-sm font-bold text-[#3d211a]">{storySolution.label}</span><h2 className="kalojira-heading mt-8 text-2xl sm:text-3xl">{storySolution.heading}</h2><p className="mt-5 leading-7 text-[#fff8ee]/85">{storySolution.text}</p></div><img src="/step/kalojira-mixed/kalojira-mixed-ingredients-table-v1.webp" alt="কালোজিরা মিক্সডের সঙ্গে পরিচিত উপাদানগুলো" className="h-56 w-full object-cover" width="1536" height="1024" loading="lazy" decoding="async" /></article>
            <div className="flex items-center rounded-[1.75rem] border-l-4 border-[#e5672e] bg-[#f0c5a5]/35 p-6 text-lg font-semibold leading-8 text-[#3d211a]">{honestPositioning}</div>
          </div>
        </div>
      </section>

      <section aria-labelledby="kalojira-ingredients-heading" className="border-b border-[#19382d]/25 bg-[#fbf4e8]">
        <div className="mx-auto max-w-5xl px-4 pb-6 sm:px-6 sm:pb-8">
          <SectionIntro label="ভেতরে কী আছে, আগে সেটাই জানুন" heading="৮টি পরিচিত উপাদান" description="গোপন ফর্মুলা নয়—আপনি কী খাচ্ছেন, তা পরিষ্কারভাবে দেখুন।" />
          <div className="mx-auto max-w-4xl">
            <img src="/step/kalojira-mixed/landing_static.webp" alt="কালোজিরা মিক্সডের ৮টি উপাদান: কালোজিরা, রসুন, বিশুদ্ধ মধু, জয়তুন, কিসমিস, খেজুর, ত্বীন ফল ও ইরানি জাফরান" className="mx-auto h-auto w-full mix-blend-multiply" width="1312" height="1199" loading="lazy" decoding="async" />
            <EditorialPointRail points={ingredients.map((ingredient) => ({ title: ingredient.name, text: ingredient.note, category: ingredient.category }))} />
          </div>
        </div>
      </section>

      <section aria-labelledby="kalojira-nutrition-heading" className="bg-[#fff8ee] px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-6xl"><SectionIntro label="শুধু কালোজিরা নয়" heading={nutritionHeading} description="একটি সহজ মিশ্রণে পরিচিত উপাদানের বৈচিত্র্য—খাদ্যাভ্যাসের পাশে ব্যবহারযোগ্যভাবে।" /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{nutritionGroups.map((group, index) => <article key={group.mark} className="rounded-[1.5rem] border border-[#3d211a]/12 bg-white p-5"><span className="grid size-12 place-items-center rounded-full bg-[#f0c5a5] text-xl font-bold text-[#3d211a]">{group.mark}</span><h3 id={index === 0 ? "kalojira-nutrition-heading" : undefined} className="kalojira-heading mt-5 text-xl text-[#3d211a]">{group.title}</h3><p className="mt-3 text-sm leading-6 text-[#6c5145]">{group.text}</p></article>)}</div><div className="mt-10 rounded-2xl bg-[#e2efd8] p-6 text-center text-lg font-semibold leading-8 text-[#3d211a]">উপাদান জানুন → পুষ্টির ভূমিকা বুঝুন → তারপর নিজের জন্য সিদ্ধান্ত নিন</div></div></section>

      <section aria-labelledby="kalojira-why-heading" className="border-b border-[#19382d]/25 bg-[#fbf4e8]"><div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12"><SectionIntro label="৮টি উপাদান · ১টি সহজ Food Mix" heading={whyHeading} /><h2 id="kalojira-why-heading" className="sr-only">কালোজিরা মিক্সডের ব্যবহারিক কারণ</h2><div className="mt-10"><EditorialPointRail points={whyPoints} /></div><div className="mt-8 text-center"><OrderButton placement="content_mid" label="কালোজিরা মিক্সড অর্ডার করুন" onOrderClick={onOrderClick} /></div></div></section>

      <section aria-labelledby="kalojira-audience-heading" className="border-b border-[#19382d]/25 bg-[#fbf4e8]"><div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12"><SectionIntro label="দৈনন্দিন খাদ্যাভ্যাসে" heading={audienceHeading} description="সবার খাদ্যচাহিদা এক নয়—নিজের রুটিন ও পছন্দ অনুযায়ী বিবেচনা করুন।" /><h2 id="kalojira-audience-heading" className="sr-only">কারা বিবেচনা করতে পারেন</h2><div className="mt-10"><EditorialPointRail points={audiencePoints} /></div></div></section>

      <section aria-labelledby="kalojira-expert-heading" className="bg-[#fff8ee] px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-6xl"><div className="grid overflow-hidden rounded-[2rem] bg-[#3d211a] md:grid-cols-[0.8fr_1.2fr]"><div className="min-h-[25rem] bg-[#e6d8c4]"><img src="/step/kalojira-mixed/kalojira-mixed-expert-murad-parvez-v1.webp" alt="পুষ্টিবিদ মুরাদ পারভেজ কালোজিরা মিক্সড হাতে" className="h-full w-full object-cover object-center" width="680" height="850" loading="lazy" decoding="async" /></div><div className="flex flex-col justify-center p-7 text-[#fff8ee] sm:p-12"><p className="text-sm font-bold text-[#f0c5a5]">পুষ্টিবিদের কথা</p><h2 id="kalojira-expert-heading" className="kalojira-heading mt-3 text-3xl sm:text-5xl">{nutritionistHeading}</h2><p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#f0c5a5]">{nutritionistName}{"\n"}{nutritionistCredentials}</p><blockquote className="mt-7 border-l-2 border-[#e5672e] pl-5 text-base leading-8 text-[#fff8ee]/85">“{nutritionistStatement}”</blockquote><p className="mt-6 font-bold text-[#f0c5a5]">— {nutritionistName}</p></div></div></div></section>

      <section aria-labelledby="kalojira-reviews-heading" className="border-b border-[#19382d]/25 bg-[#fbf4e8] px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <SectionIntro label="গ্রাহকের অভিজ্ঞতা" heading="যারা ব্যবহার করছেন, তাদের কথা" />
          <h2 id="kalojira-reviews-heading" className="sr-only">কালোজিরা মিক্সড গ্রাহকের অভিজ্ঞতা</h2>
          <TestimonialsSection
            testimonials={demoReviews.map((review) => ({
              quote: review.text,
              name: review.name,
              role: "কালোজিরা মিক্সড",
              company: "আঙ্গনালয়",
            }))}
            className="mt-12"
          />
        </div>
      </section>

      <section aria-labelledby="kalojira-serving-heading" className="bg-[#fffdf9] px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-6xl"><SectionIntro label="Lifestyle first" heading={servingHeading} description={servingNote} /><div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><div className="rounded-[1.75rem] bg-[#e2efd8] p-6 sm:p-8"><h2 id="kalojira-serving-heading" className="kalojira-heading text-2xl text-[#3d211a]">সহজ দৈনিক পরিবেশন</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">{servingPoints.map((point) => <div key={point.title} className="rounded-2xl bg-[#fff8ee] p-5"><p className="text-2xl font-bold text-[#e5672e]">{point.title}</p><p className="mt-2 text-sm leading-6 text-[#6c5145]">{point.text}</p></div>)}</div></div><div className="rounded-[1.75rem] bg-[#3d211a] p-6 text-[#fff8ee] sm:p-8"><p className="text-sm font-bold text-[#f0c5a5]">স্বাস্থ্যকর রুটিনের ভিত্তি</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{lifestylePoints.map((point) => <div key={point} className="flex items-center gap-3 rounded-xl border border-[#fff8ee]/15 px-4 py-3"><span className="size-2 rounded-full bg-[#e5672e]" aria-hidden="true" />{point}</div>)}</div><p className="mt-7 border-t border-[#fff8ee]/15 pt-5 text-sm leading-6 text-[#fff8ee]/75">একটি খাবার একা সুস্থ জীবন তৈরি করে না। সুষম খাবার, পানি, বিশ্রাম ও নিয়মিত কার্যক্রমকে সবসময় গুরুত্ব দিন।</p></div></div></div></section>

      <section aria-labelledby="kalojira-faq-heading" className="bg-[#fff8ee] px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-5xl"><SectionIntro label="অর্ডারের আগে" heading={faqHeading} /><div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="rounded-[1.5rem] border border-[#3d211a]/12 bg-white px-5">{faqQuestions.map((question, index) => <FaqItem key={question} question={question} answer={faqAnswers[index]} />)}</div><aside aria-labelledby="kalojira-notes-heading" className="rounded-[1.5rem] bg-[#3d211a] p-6 text-[#fff8ee]"><h2 id="kalojira-faq-heading" className="sr-only">কালোজিরা মিক্সড সম্পর্কে সাধারণ প্রশ্ন</h2><h3 id="kalojira-notes-heading" className="kalojira-heading text-2xl">মনে রাখুন</h3><ul className="mt-5 space-y-3">{importantNotes.map((note) => <li key={note} className="flex gap-3 text-sm leading-6 text-[#fff8ee]/80"><TriangleAlert className="mt-1 size-4 shrink-0 text-[#f0c5a5]" aria-hidden="true" />{note}</li>)}</ul></aside></div><div className="mt-8 text-center"><OrderButton placement="content_bottom" label="অর্ডার করতে এগিয়ে যান" onOrderClick={onOrderClick} /></div></div></section>
    </>
  );
}
