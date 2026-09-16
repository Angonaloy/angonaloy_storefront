"use client";

import { HandCoins, PackageCheck, TreePine, type LucideIcon } from "lucide-react";

export type LogoCloudItem = {
  title: string;
  text: string;
};

type LogoCloudBlockProps = {
  items: readonly LogoCloudItem[];
};

const itemIcons: LucideIcon[] = [TreePine, PackageCheck, HandCoins];

export default function LogoCloudBlock({ items }: LogoCloudBlockProps) {
  return (
    <section
      aria-label="আঙ্গনালয়ের প্রতিশ্রুতি"
      className="flex w-full items-center overflow-hidden border-b border-[#19382d]/25 bg-[#FBBB14] px-4 py-3 text-[#19382d]"
    >
      <style>{`
        @keyframes honey-trust-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .honey-trust-track {
          animation: honey-trust-marquee 26s linear infinite;
        }
        .honey-trust-mask:hover .honey-trust-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .honey-trust-track {
            animation: none;
          }
        }
      `}</style>

      <div className="w-full text-center">
        <div className="honey-trust-mask relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="honey-trust-track flex w-max items-stretch">
            {[...items, ...items].map(({ title, text }, index) => {
              const Icon = itemIcons[index % itemIcons.length];
              return (
                <div
                  key={`${title}-${index}`}
                  className="flex shrink-0 items-center gap-2 border-r border-[#19382d]/25 px-5 text-left last:border-r-0"
                  aria-hidden={index >= items.length ? "true" : undefined}
                >
                  <Icon className="size-5 shrink-0 text-[#19382d]" aria-hidden="true" />
                  <p className="whitespace-nowrap text-sm leading-5">
                    <strong className="font-serif font-medium tracking-tight">{title}</strong>
                    <span className="px-2 text-[#19382d]/50" aria-hidden="true">·</span>
                    <span className="text-[#19382d]/80">{text}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
