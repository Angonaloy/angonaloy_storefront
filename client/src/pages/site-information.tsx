import { Link } from "wouter";

import Layout from "@/components/layout";
import type { SitePage } from "@/lib/site-pages";
import { CONTACT_DETAILS } from "@/lib/site-pages";

export default function SiteInformationPage({ page }: { page: SitePage }) {
  return (
    <Layout>
      <main className="bg-[#f6f6f6] px-4 py-12 sm:px-8 md:px-16 md:py-20">
        <article className="mx-auto max-w-4xl">
          <Link href="/">
            <a className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/50 transition-colors hover:text-black">
              ← Back to Angonaloy
            </a>
          </Link>

          <header className="mt-12 border-b border-black/10 pb-10 md:mt-16 md:pb-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#b98500]">Angonaloy-আঙ্গনালয়</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-black sm:text-5xl md:text-6xl">
              {page.title.en}
              <span className="mt-3 block text-2xl font-normal tracking-[-0.03em] text-black/55 sm:text-3xl">{page.title.bn}</span>
            </h1>
            <div className="mt-8 grid gap-4 text-base leading-7 text-black/70 md:grid-cols-2 md:gap-10">
              <p>{page.intro.en}</p>
              <p className="text-black/55">{page.intro.bn}</p>
            </div>
          </header>

          <div className="divide-y divide-black/10">
            {page.sections.map((section) => (
              <section key={section.heading.en} className="grid gap-5 py-9 md:grid-cols-[0.72fr_1.28fr] md:gap-12 md:py-12">
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.025em] text-black">{section.heading.en}</h2>
                  <p className="mt-2 text-base text-black/50">{section.heading.bn}</p>
                </div>
                <div className="grid gap-5 text-[15px] leading-7 text-black/75 md:grid-cols-2 md:gap-8">
                  <p className="whitespace-pre-line">{section.body.en}</p>
                  <p className="whitespace-pre-line text-black/55">{section.body.bn}</p>
                </div>
              </section>
            ))}
          </div>

          <aside className="mt-8 grid gap-5 rounded-[10px] bg-[#FBBB14] p-6 text-black sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.025em]">Need help?</h2>
              <p className="mt-1 text-base text-black/70">সহায়তা দরকার?</p>
              <p className="mt-4 max-w-xl text-sm leading-6 text-black/75">
                Call {CONTACT_DETAILS.phone} or email {CONTACT_DETAILS.email}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.12em]">
              <a className="border border-black/20 px-4 py-3 transition-colors hover:bg-black hover:text-white" href={`tel:${CONTACT_DETAILS.whatsapp}`}>Call us</a>
              <a className="border border-black/20 px-4 py-3 transition-colors hover:bg-black hover:text-white" href={CONTACT_DETAILS.whatsappHref}>WhatsApp</a>
            </div>
          </aside>
        </article>
      </main>
    </Layout>
  );
}
