"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { BannerSummaryView } from "@/lib/cosmetics/banners";
import { bannerStatus, formatDate, formatRemaining, useNow } from "@/lib/cosmetics/format";
import { cn } from "@/components/dna/cn";
import BannerStatusTag from "./BannerStatusTag";

/** Carte de bannière : visuel d'onglet du jeu, vedette, période et statut. */
export default function BannerCard({ banner, className }: { banner: BannerSummaryView; className?: string }) {
  const t = useTranslations("cosmetics");
  const locale = useLocale();
  const now = useNow();
  const status = now ? bannerStatus(banner.start, banner.end, now) : null;
  const portrait = banner.featured?.visuals.portrait ?? null;

  return (
    <Link
      href={`/cosmetics/banners/${banner.id}`}
      className={cn(
        "group relative flex min-h-[168px] overflow-hidden border bg-panel/70 transition-all duration-200 hover:-translate-y-0.5",
        status === "current" ? "border-gold/45 hover:border-gold/70" : "border-white/10 hover:border-gold/40",
        status === "ended" && "opacity-80 hover:opacity-100",
        className,
      )}
    >
      {banner.image ? (
        <img
          src={banner.image}
          alt=""
          width={560}
          height={200}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-55 transition-opacity duration-300 group-hover:opacity-70"
        />
      ) : null}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/10" />
      {portrait ? (
        <img
          src={portrait}
          alt=""
          width={256}
          height={1024}
          loading="lazy"
          className="absolute bottom-0 right-2 top-0 h-full w-auto object-cover object-top [mask-image:linear-gradient(to_bottom,#000_75%,transparent)]"
        />
      ) : null}
      <div className="relative z-[1] flex max-w-[70%] flex-col justify-between gap-3 p-4">
        <div>
          <p className="font-caps text-[0.58rem] uppercase tracking-[0.2em] text-gold">{t(`bannerTypes.${banner.type}`)}</p>
          <h3 className="mt-1 font-display text-xl font-semibold leading-tight text-parch group-hover:text-gold-bright md:text-2xl">
            {banner.name}
          </h3>
          {banner.featured ? <p className="mt-1 truncate text-sm italic text-muted">{banner.featured.name}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status ? <BannerStatusTag status={status} /> : null}
          <span className="text-xs text-parch/75">
            {status === "current" && banner.end && now
              ? t("endsIn", { time: formatRemaining(banner.end, now, locale) })
              : status === "upcoming" && banner.start && now
                ? t("startsIn", { time: formatRemaining(banner.start, now, locale) })
                : banner.start
                  ? t("bannerPeriod", { start: formatDate(banner.start, locale) ?? "", end: formatDate(banner.end, locale) ?? "" })
                  : null}
          </span>
        </div>
      </div>
    </Link>
  );
}
