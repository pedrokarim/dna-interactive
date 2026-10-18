"use client";

import { AlertTriangle, Clock, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DnaPanel } from "@/components/dna/Panel";
import { cn } from "@/components/dna";
import { REGIONS, type RotationFreshness, type RotationMeta, type RotationState } from "@/lib/commissions/types";
import { CountdownTimer } from "./CountdownTimer";
import { FreshnessBadge } from "./FreshnessBadge";
import { RegionCard } from "./RegionCard";
import { useLiveRotation } from "./useLiveRotation";

/** Remplace la grille quand aucune rotation ne couvre l'heure en cours. */
function NoCurrentRotation({ freshness, lastCollected }: { freshness: RotationFreshness; lastCollected: string | null }) {
  const t = useTranslations("commissions");
  const syncing = freshness === "syncing";
  return (
    <DnaPanel
      inner
      className={cn(
        "flex flex-col items-center gap-3 border-dashed px-6 py-12 text-center",
        syncing ? "border-gold/30" : "border-crimson-bright/40",
      )}
    >
      {syncing ? (
        <Loader2 className="h-6 w-6 animate-spin text-gold" aria-hidden />
      ) : (
        <AlertTriangle className="h-6 w-6 text-crimson-bright" aria-hidden />
      )}
      <p className="font-display text-2xl text-parch">{t(`empty.${freshness}.title`)}</p>
      <p className="max-w-xl text-sm text-parch/75">
        {t(`empty.${freshness}.body`, { time: lastCollected ?? "–" })}
      </p>
    </DnaPanel>
  );
}

export function CommissionsBoard({
  initialState,
  initialMeta,
}: {
  initialState: RotationState;
  initialMeta: RotationMeta;
}) {
  const t = useTranslations("commissions");
  const locale = useLocale();
  const { state, meta, freshness, live, syncing, nextLabel, updatedLabel, handleComplete } = useLiveRotation(
    initialState,
    initialMeta,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 text-center">
        <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 font-display text-4xl text-parch md:text-5xl">{t("title")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-parch/80">{t("description")}</p>
      </header>

      {/* Bandeau : état de la collecte, puis compte à rebours */}
      <DnaPanel inner className="mb-8 p-5 sm:p-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center border border-gold/30 bg-gold/10 text-gold">
              <Clock className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <FreshnessBadge freshness={freshness} />
              {live && nextLabel ? (
                <p className="mt-1 text-[0.8rem] text-parch/80">
                  {t("nextRefresh")} {t("nextAt", { time: nextLabel })}
                </p>
              ) : null}
              {updatedLabel ? (
                <p className="mt-0.5 text-[0.72rem] text-parch/55">{t("lastCollected", { time: updatedLabel })}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {syncing && live ? (
              <span className="flex items-center gap-1.5 font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold/70">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("syncing")}
              </span>
            ) : null}
            {/* Le décompte n'a de sens que pour une rotation valable : sans elle,
                il ferait croire que les données affichées courent jusqu'à zéro.
                Le passage à zéro déclenche les vérifications rapprochées, qui
                continuent ensuite sans lui. */}
            {live ? (
              <CountdownTimer
                target={meta.nextRefreshAt}
                onComplete={handleComplete}
                className="font-display text-4xl tabular-nums text-gold-bright sm:text-5xl"
              />
            ) : null}
          </div>
        </div>
      </DnaPanel>

      {live ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {REGIONS.map((region) => (
            <RegionCard key={region} region={region} data={state.regions[region]} locale={locale} />
          ))}
        </div>
      ) : (
        <NoCurrentRotation freshness={freshness === "live" ? "none" : freshness} lastCollected={updatedLabel} />
      )}

      <p className="mt-8 text-center text-[0.72rem] text-parch/45">{t("utcNote")}</p>
    </div>
  );
}
