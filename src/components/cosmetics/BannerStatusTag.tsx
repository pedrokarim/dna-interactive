"use client";

import { useTranslations } from "next-intl";
import type { BannerStatus } from "@/lib/cosmetics/format";
import { cn } from "@/components/dna/cn";

const STATUS_STYLE: Record<BannerStatus, string> = {
  current: "border-anemo/50 bg-anemo/15 text-anemo",
  upcoming: "border-hydro/45 bg-hydro/10 text-hydro",
  ended: "border-white/15 bg-ink/60 text-muted",
  permanent: "border-gold/40 bg-gold/10 text-gold",
};

/** Statut d'une bannière selon l'horloge du visiteur. */
export default function BannerStatusTag({ status, className }: { status: BannerStatus; className?: string }) {
  const t = useTranslations("cosmetics");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-caps text-[0.55rem] uppercase tracking-[0.16em]",
        STATUS_STYLE[status],
        className,
      )}
    >
      {status === "current" ? <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" /> : null}
      {t(`bannerStatus.${status}`)}
    </span>
  );
}
