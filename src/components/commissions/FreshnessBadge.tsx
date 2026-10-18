"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/components/dna";
import type { RotationFreshness } from "@/lib/commissions/types";

const FRESHNESS_TONE: Record<RotationFreshness, { dot: string; text: string }> = {
  live: { dot: "bg-anemo", text: "text-anemo" },
  syncing: { dot: "bg-gold-bright animate-pulse", text: "text-gold-bright" },
  stale: { dot: "bg-crimson-bright", text: "text-crimson-bright" },
  none: { dot: "bg-crimson-bright", text: "text-crimson-bright" },
};

/** Pastille d'état : à jour, récupération en cours, collecte interrompue. */
export function FreshnessBadge({ freshness, className }: { freshness: RotationFreshness; className?: string }) {
  const t = useTranslations("commissions");
  const tone = FRESHNESS_TONE[freshness];
  return (
    <p className={cn("flex items-center gap-2 font-caps text-[0.62rem] uppercase tracking-[0.24em]", tone.text, className)} role="status">
      <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", tone.dot)} />
      {t(`status.${freshness}`)}
    </p>
  );
}
