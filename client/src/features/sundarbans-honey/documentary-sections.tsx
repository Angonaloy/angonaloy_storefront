import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState } from "react";

import LogoCloudBlock from "@/components/ui/logo-cloud-3";
import {
  collectionReelHeading,
  collectionReelSubcopy,
  comparisonHeading,
  faqHeading,
  faqAnswers,
  faqQuestions,
  heroSubcopy,
  importantNotes,
  importantNotesHeading,
  journeyHeading,
  journeyStages,
  nutritionistHeading,
  nutritionistName,
  nutritionistStatement,
  trustRibbonItems,
  waysToEnjoyHeading,
  waysToEnjoyNote,
  waysToEnjoyPoints,
  whoCanConsumeHeading,
  whoCanConsumePoints,
  whyAngonaloyHeading,
  whySpecialHeading,
  whySpecialLead,
  whySpecialPoints,
  type HoneyNarrativePoint,
} from "./content";

type DocumentarySectionsProps = {
  onOrderClick: (placement: string) => void;
};

function OrderButton({
  placement,
  label,
  onOrderClick,
  className,
}: {
  placement: string;
  label: string;
  onOrderClick: (placement: string) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOrderClick(placement)}
      className={`inline-flex min-h-12 items-center justify-between gap-6 border border-[#19382d] bg-[#eab308] px-5 py-3 text-base font-bold text-[#19382d] shadow-[3px_3px_0_#19382d] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#19382d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19382d] ${className ?? ""}`}
    >
      <span>{label}</span>
      <span aria-hidden="true" className="text-xl leading-none">→</span>
    </button>
  );
}

function SectionHeading({ id, label, heading, description, headingImage, headingClassName }: {
  id: string;
  label: string;
  heading: string;
  description?: string;
  headingClassName?: string;
  headingImage?: {
    src: string;
    alt: string;
  };
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-4 pt-8 text-center sm:px-6 sm:pt-10">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a711c]">{label}</p>
      <h2 id={id} className={`mt-3 text-balance font-serif text-3xl font-medium leading-tight tracking-[-0.04em] text-[#19382d] honey-heading-heavy sm:text-5xl ${headingClassName ?? ""}`}>
        {headingImage ? (
          <img
            src={headingImage.src}
            alt={headingImage.alt}
            className="mx-auto h-auto w-full mix-blend-multiply"
            width="2400"
            height="800"
            loading="lazy"
            decoding="async"
          />
        ) : heading}
      </h2>
      {description ? <p className="mx-auto mt-4 max-w-xl leading-7 text-[#654b2f]">{description}</p> : null}
    </div>
  );
}

function EditorialPointRail({ points }: { points: HoneyNarrativePoint[] }) {
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
        <li
          key={point.title}
          data-point-card
          className="group min-w-[82%] snap-start border-y border-[#19382d]/20 py-4 transition-colors hover:border-[#e9aa22]/70 sm:min-w-0 sm:border-y-0 sm:border-t sm:py-5 lg:border-l lg:border-t-0 lg:pl-5 lg:first:border-l-0 lg:first:pl-0"
        >
          <span className="block font-serif text-5xl font-medium leading-none tracking-[-0.08em] text-[#d9a92b]/70 sm:text-6xl">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="honey-heading-heavy mt-5 max-w-[14rem] font-serif text-xl font-medium leading-tight text-[#19382d] sm:text-2xl">{point.title}</h3>
          <p className="mt-3 max-w-[17rem] text-[13px] leading-6 text-[#654b2f] sm:text-sm sm:leading-7">{point.text}</p>
        </li>
      ))}
      </ul>
      <div className="mt-3 flex justify-end gap-2 sm:hidden">
        <button
          type="button"
          aria-label="আগের কার্ড"
          onClick={() => scrollPoints(-1)}
          className="flex size-10 items-center justify-center border border-[#19382d] bg-transparent text-[#19382d] transition-colors hover:bg-[#19382d] hover:text-[#fffaf0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19382d]"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="পরের কার্ড"
          onClick={() => scrollPoints(1)}
          className="flex size-10 items-center justify-center border border-[#19382d] bg-[#19382d] text-[#fffaf0] transition-colors hover:bg-transparent hover:text-[#19382d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19382d]"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function AnimatedFaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const answerId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div className="border-b border-[#19382d]/12 py-3.5 last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={answerId}
          onClick={() => setIsOpen((current) => !current)}
          className="flex w-full cursor-pointer items-center justify-between gap-4 text-left font-serif text-base text-[#19382d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19382d] sm:text-lg"
        >
          <span>{question}</span>
          <motion.span
            aria-hidden="true"
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#19382d]/15 text-xl leading-none"
          >
            +
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={answerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pt-3 text-sm leading-6 text-[#654b2f]">{answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const COLLECTION_REELS = [
  {
    src: "https://res.cloudinary.com/n0d6bs08/video/upload/f_auto,q_auto/AQPk2xiiGJkLlKAuYLArzgO3dROk08xjUPPg6ovJ7kQsv9zy8Wn5fw_jYTB_cp8D8j6y-V5xINML6aRGauN7ixv8sDLOE0K2cNygCbaHdIRQVg.mp4",
    poster: "https://res.cloudinary.com/n0d6bs08/video/upload/so_0,w_640/AQPk2xiiGJkLlKAuYLArzgO3dROk08xjUPPg6ovJ7kQsv9zy8Wn5fw_jYTB_cp8D8j6y-V5xINML6aRGauN7ixv8sDLOE0K2cNygCbaHdIRQVg.jpg",
    title: "সুন্দরবনের মধু সংগ্রহের ভিডিও ১",
  },
  {
    src: "https://res.cloudinary.com/n0d6bs08/video/upload/f_auto,q_auto/snapsave-app_2560951824420061_hd.mp4",
    poster: "https://res.cloudinary.com/n0d6bs08/video/upload/so_auto,w_640/snapsave-app_2560951824420061_hd.jpg",
    title: "সুন্দরবনের মধু সংগ্রহের ভিডিও ২",
  },
] as const;

function ReelCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollReels = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector<HTMLElement>("[data-reel]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: direction * (slide?.offsetWidth ?? track.clientWidth),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-6 sm:px-6 sm:pb-8">
      <div className="relative">
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto sm:grid sm:grid-cols-2 sm:overflow-visible"
        >
          {COLLECTION_REELS.map((reel) => (
            <div key={reel.src} data-reel className="w-full shrink-0 snap-center sm:mx-auto sm:w-full sm:max-w-[230px]">
              <div className="mx-auto aspect-[2/3] w-full max-w-[300px] overflow-hidden rounded-2xl border border-[#19382d]/15 bg-black sm:max-w-[260px]">
                <video
                  src={reel.src}
                  poster={reel.poster}
                  title={reel.title}
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          aria-label="আগের ভিডিও"
          onClick={() => scrollReels(-1)}
          className="absolute left-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19382d] sm:hidden"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="পরের ভিডিও"
          onClick={() => scrollReels(1)}
          className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19382d] sm:hidden"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function MediaSlot({ label, dark = false }: { label: string; dark?: boolean }) {
  return (
    <div
      data-media-slot={label}
      className={dark
        ? "grid min-h-64 place-items-center bg-[#a9c3b5] p-6 text-center text-[#19382d] sm:min-h-80"
        : "grid min-h-64 place-items-center bg-[#bdd2c8] p-6 text-center text-[#19382d] sm:min-h-80"}
    >
      <div className="border border-[#19382d] px-5 py-4 text-xs font-bold uppercase tracking-[0.14em]">
        {label}
      </div>
    </div>
  );
}

export function DocumentarySections({ onOrderClick }: DocumentarySectionsProps) {
  return (
    <>
      <section aria-labelledby="honey-hero-heading" className="border-b border-[#19382d]/25 bg-[#fbf4e8] text-[#19382d]">
        <div className="mx-auto max-w-4xl px-4 pb-5 pt-7 text-center sm:px-6 sm:pb-8 sm:pt-10">
          <h2 id="honey-hero-heading" className="mx-auto mt-4 max-w-3xl">
            <img
              src="/step/sundarbans-natural-honey/sundarbans-honey-headline-v1.webp"
              alt="সুন্দরবনের প্রাকৃতিক চাকের মধু"
              className="h-auto w-full mix-blend-multiply"
              width="2400"
              height="800"
              fetchPriority="high"
              decoding="async"
            />
          </h2>
          <p className="mx-auto mt-0 max-w-2xl leading-8 text-[#654b2f]">{heroSubcopy}</p>
          <div className="mx-auto mt-1 w-[76%] max-w-sm overflow-hidden rounded-xl bg-[#fbf4e8]">
            <img
              src="/step/sundarbans-natural-honey/sundarbans-honey-hero-banner-v1.webp"
              alt=""
              aria-hidden="true"
              className="h-auto w-full mix-blend-multiply"
              width="2400"
              height="802"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="mt-3"><OrderButton placement="hero" label="অর্ডার করুন" onOrderClick={onOrderClick} /></div>
          <div className="mx-auto mt-7 h-96 max-w-xl sm:h-[30rem]">
            <img
              src="/step/sundarbans-natural-honey/sundarbans-honey-hero-v2.webp"
              alt="সুন্দরবনের প্রাকৃতিক চাকের মধুর বোতল, মৌচাক ও মৌমাছি"
              className="h-full w-full object-contain"
              fetchPriority="high"
              decoding="async"
              width="1122"
              height="1402"
            />
          </div>
        </div>
      </section>

      <LogoCloudBlock items={trustRibbonItems} />

      <section id="honey-collection-reel" aria-labelledby="honey-collection-heading" className="border-b border-[#19382d]/25 bg-[#fffdf8]">
        <SectionHeading
          id="honey-collection-heading"
          label="বন থেকে বোতল পর্যন্ত"
          heading={collectionReelHeading}
          headingImage={{
            src: "/step/sundarbans-natural-honey/sundarbans-honey-collection-heading-v1.webp",
            alt: "বনের গল্প, বাস্তব ভিডিওতে",
          }}
          description={collectionReelSubcopy}
        />
        <ReelCarousel />
      </section>

      <section aria-labelledby="honey-why-heading" className="bg-[#fffdf8]">
        <SectionHeading
          id="honey-why-heading"
          label={whySpecialHeading}
          heading={whySpecialLead}
          headingImage={{
            src: "/step/sundarbans-natural-honey/sundarbans-why-special-heading-v1.webp",
            alt: "বনের স্বাদ, প্রাকৃতিক বৈচিত্র্য, এক বোতলে।",
          }}
        />
        <div className="mx-auto max-w-4xl px-4 pb-6 sm:px-6 sm:pb-8">
          <img
            src="/step/sundarbans-natural-honey/sundarbans-why-special-infographic-v2.webp"
            alt="সুন্দরবনের চাকের মধু কেন বিশেষ: সুন্দরবনের বন ও ফুল, স্বতন্ত্র স্বাদ ও ঘ্রাণ, প্রাকৃতিক শর্করায় শক্তি, প্রাকৃতিক অ্যান্টিঅক্সিডেন্ট যৌগ, প্রতিদিনের ব্যবহারে সহজ"
            className="mx-auto h-auto w-full"
            width="1254"
            height="1254"
            loading="lazy"
            decoding="async"
          />
          <ul className="sr-only">
            {whySpecialPoints.map((point) => (
              <li key={point.title}>{point.title}: {point.text}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="honey-bundle-showcase" className="border-b border-[#19382d]/25 bg-[#fffdf7]">
        <div className="mx-auto max-w-5xl px-4 pb-6 pt-0 sm:px-6 sm:pb-8 sm:pt-0">
          <div className="mx-auto mt-0 grid max-w-4xl grid-cols-2 gap-3 sm:gap-5">
            <article className="rounded-[1.75rem] bg-transparent">
              <img
                src="/step/sundarbans-natural-honey/sundarbans-honey-bundle-500g-v3.webp"
                alt="সুন্দরবনের চাকের মধু ৫০০ গ্রামের প্যাক"
                className="mx-auto h-auto w-full"
                width="1024"
                height="1536"
                loading="lazy"
                decoding="async"
              />
              <div className="mt-3 flex justify-center px-1 pb-3 sm:px-4 sm:pb-5">
                <OrderButton placement="bundle_500g" label="অর্ডার করুন" onOrderClick={onOrderClick} className="w-full justify-center gap-2 px-2 text-sm sm:w-auto sm:gap-6 sm:px-5 sm:text-base" />
              </div>
            </article>
            <article className="rounded-[1.75rem] bg-transparent">
              <img
                src="/step/sundarbans-natural-honey/sundarbans-honey-bundle-1kg-v3.webp"
                alt="সুন্দরবনের চাকের মধু ১ কেজির প্যাক"
                className="mx-auto h-auto w-full"
                width="1024"
                height="1536"
                loading="lazy"
                decoding="async"
              />
              <div className="mt-3 flex justify-center px-1 pb-3 sm:px-4 sm:pb-5">
                <OrderButton placement="bundle_1kg" label="অর্ডার করুন" onOrderClick={onOrderClick} className="w-full justify-center gap-2 px-2 text-sm sm:w-auto sm:gap-6 sm:px-5 sm:text-base" />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section aria-labelledby="honey-who-heading" className="border-b border-[#19382d]/25 bg-[#fbf4e8]">
        <div className="mx-auto max-w-5xl px-4 pb-6 sm:px-6 sm:pb-8">
          <SectionHeading id="honey-who-heading" label="পরিবারের জন্য" heading={whoCanConsumeHeading} headingClassName="font-black honey-heading-heavy" description="বয়স ও শারীরিক অবস্থা অনুযায়ী পরিমিত পরিমাণে ব্যবহার করুন।" />
          <div className="mx-auto max-w-4xl"><EditorialPointRail points={whoCanConsumePoints} /></div>
        </div>
      </section>

      <section aria-labelledby="honey-ways-heading" className="border-b border-[#19382d]/25 bg-[#fffdf8]">
        <div className="mx-auto max-w-5xl px-4 pb-6 sm:px-6 sm:pb-8">
          <SectionHeading id="honey-ways-heading" label="দৈনন্দিন ব্যবহারে" heading={waysToEnjoyHeading} headingClassName="font-black honey-heading-heavy" description={waysToEnjoyNote} />
          <div className="mx-auto max-w-4xl">
            <EditorialPointRail points={waysToEnjoyPoints} />
            <div className="mt-8 text-center"><OrderButton placement="content_mid" label="অর্ডার করুন" onOrderClick={onOrderClick} /></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="honey-journey-heading" className="border-b border-[#19382d]/25 bg-[#19382d] text-[#fffaf0]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f5c456]">সুন্দরবন থেকে আপনার ঘরে</p>
          <h2 id="honey-journey-heading" className="honey-heading-heavy mt-3 font-serif text-3xl font-medium leading-tight sm:text-5xl">{journeyHeading}</h2>
          <ol className="relative mt-10 grid gap-8 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-[#f5c456]/35 md:grid-cols-3 md:gap-6 md:before:bottom-auto md:before:left-[16.666%] md:before:right-[16.666%] md:before:top-5 md:before:h-px md:before:w-auto">
            {journeyStages.map((stage, index) => (
              <li key={stage.title} className="relative pl-14 md:pl-0 md:pt-14 md:text-center">
                <span className="absolute left-0 top-0 z-10 flex size-10 items-center justify-center rounded-full border-4 border-[#19382d] bg-[#f5c456] text-sm font-bold text-[#19382d] shadow-[0_0_0_1px_rgba(245,196,86,0.35)] md:left-1/2 md:-translate-x-1/2">
                  {index + 1}
                </span>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#f5c456]">ধাপ {index + 1}</p>
                <h3 className="honey-heading-heavy mt-2 font-serif text-2xl font-medium">{stage.title}</h3>
                <p className="mt-2 leading-7 text-[#f4ecd9]">{stage.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="honey-nutritionist-heading" className="border-b border-[#19382d]/25 bg-[#fbf4e8]">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
          <div className="grid overflow-hidden rounded-[2rem] border border-[#19382d]/10 bg-[#fffdf7] md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <figure className="relative min-h-[19rem] bg-[#e6d8c4] md:min-h-[30rem]">
              <img
                src="/step/sundarbans-natural-honey/nutritionist-murad-parvez-v1.webp"
                alt="পুষ্টিবিদ মুরাদ পারভেজ"
                className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
                width="1024"
                height="1536"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#19382d]/80 to-transparent px-5 pb-5 pt-16 text-[#fffaf0]">
                <figcaption className="text-sm font-semibold tracking-wide">{nutritionistName}</figcaption>
              </div>
            </figure>
            <div className="relative flex flex-col justify-center bg-[#19382d] px-6 py-10 text-[#fffaf0] sm:px-10 sm:py-12">
              <span aria-hidden="true" className="absolute right-6 top-2 font-serif text-[7rem] leading-none text-[#f5c456]/20 sm:right-10 sm:text-[9rem]">“</span>
              <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-[#f5c456]">দায়িত্বশীল তথ্য</p>
              <h2 id="honey-nutritionist-heading" className="honey-heading-heavy relative mt-3 max-w-md font-serif text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-4xl">{nutritionistHeading}</h2>
              <blockquote className="relative mt-6 max-w-xl border-l-2 border-[#f5c456] pl-4 text-base leading-8 text-[#f4ecd9] sm:text-lg">{nutritionistStatement}</blockquote>
              <p className="relative mt-6 font-semibold text-[#f5c456]">— {nutritionistName}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="honey-why-brand-heading" className="border-b border-[#19382d]/25 bg-[#fffdf8]">
        <SectionHeading id="honey-why-brand-heading" label="স্বচ্ছতার সঙ্গে" heading={whyAngonaloyHeading} description={comparisonHeading} />
        <div className="mx-auto max-w-5xl px-4 pb-6 sm:px-6 sm:pb-8">
          <div>
            <img
              src="/step/sundarbans-natural-honey/mango-lover-vs-other-brands-v1.webp"
              alt="Angonaloy vs অন্যান্য Brands — পার্থক্যটা নিজেই দেখুন"
              className="mx-auto h-auto w-full max-w-full"
              width="1536"
              height="1024"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="mt-8 text-center"><OrderButton placement="content_bottom" label="অর্ডার করুন" onOrderClick={onOrderClick} /></div>
        </div>
      </section>

      {/* Customer reviews intentionally omitted until genuine, approved reviews arrive. */}
      <section aria-labelledby="honey-faq-heading" className="border-b border-[#19382d]/25 bg-[#fbf4e8]">
        <div className="mx-auto max-w-5xl px-4 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-10">
          <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a711c]">আপনার প্রশ্নের উত্তর</p>
              <h2 id="honey-faq-heading" className="honey-heading-heavy mt-2 font-serif text-3xl font-medium leading-tight tracking-[-0.04em] text-[#19382d] sm:text-4xl">{faqHeading}</h2>
            </div>
            <span className="hidden rounded-full border border-[#19382d]/15 bg-[#fffdf8] px-3 py-1.5 text-xs font-semibold text-[#654b2f] sm:inline-flex">অর্ডারের আগে জানুন</span>
          </div>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-8">
            <div className="rounded-[1.25rem] border border-[#19382d]/12 bg-[#fffdf8] px-4 sm:px-5">
            {faqQuestions.map((question, index) => (
              <AnimatedFaqItem key={question} question={question} answer={faqAnswers[index]} />
            ))}
            </div>
            <aside aria-labelledby="honey-notes-heading" className="rounded-[1.25rem] border border-[#19382d]/12 bg-[#19382d] p-4 text-[#fffaf0] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 id="honey-notes-heading" className="honey-heading-heavy font-serif text-2xl font-medium">{importantNotesHeading}</h3>
                <span className="rounded-full bg-[#f5c456]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#f5c456]">মনে রাখুন</span>
              </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {importantNotes.map((note) => (
                <li key={note.text} className="flex gap-2.5 rounded-xl bg-[#fffaf0]/10 px-3 py-2.5">
                  <TriangleAlert className={note.tone === "warning" ? "mt-0.5 size-4 shrink-0 text-[#f5c456]" : "mt-0.5 size-4 shrink-0 text-[#b8d9c5]"} aria-hidden="true" />
                  <p className="text-sm leading-5 text-[#f4ecd9]">{note.text}</p>
                </li>
              ))}
            </ul>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
