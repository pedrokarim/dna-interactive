"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { CalendarDays } from "lucide-react";
import { DnaPanel } from "@/components/dna";
import { useReleaseCountdown } from "./useReleaseCountdown";

/**
 * Compte à rebours de sortie, format « panneau » pour la fiche personnage.
 * L'horloge et le calcul vivent dans `useReleaseCountdown`, partagés avec la
 * bande d'accueil : une seule minuterie pour toute la page.
 */
export function UpcomingCountdown({
  releaseDate,
  versionName,
  bannerName,
}: {
  releaseDate: string;
  versionName: string;
  bannerName?: string;
}) {
  const locale = useLocale();
  const { parts, released } = useReleaseCountdown(releaseDate);

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
        new Date(`${releaseDate}T12:00:00Z`),
      ),
    [locale, releaseDate],
  );

  return (
    <DnaPanel className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-caps text-[0.56rem] uppercase tracking-[0.16em] text-gold">
            <CalendarDays className="h-3 w-3" />
            {released ? "Disponible" : "Sortie prévue"}
          </p>
          <p className="mt-1 font-sans text-sm text-parch">{dateLabel}</p>
          <p className="mt-0.5 font-sans text-xs text-muted">
            Version {versionName}
            {bannerName ? ` · bannière Myriad « ${bannerName} »` : ""}
          </p>
        </div>

        {/* Place reservee des le rendu serveur : l'horloge du visiteur ne peut
            etre lue qu'apres hydratation, et le panneau ne doit pas sauter. */}
        {released ? null : (
          <div className="flex gap-2" role="timer" aria-live="off">
            <Unit value={parts?.days ?? null} label="j" />
            <Unit value={parts?.hours ?? null} label="h" />
            <Unit value={parts?.minutes ?? null} label="min" />
            <Unit value={parts?.seconds ?? null} label="s" />
          </div>
        )}
      </div>
    </DnaPanel>
  );
}

function Unit({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="flex min-w-[3rem] flex-col items-center border border-line/25 bg-black/25 px-2 py-1.5">
      {/* Cf. UpcomingCharacterStrip : le chiffre a besoin du même recentrage
          optique que les capitales, sans quoi il flotte en haut de sa case. */}
      <span className="dna-optical-num font-mono text-lg leading-none text-gold-bright tabular-nums">
        {value === null ? "--" : `${value}`.padStart(2, "0")}
      </span>
      <span className="mt-0.5 font-caps text-[0.5rem] uppercase tracking-[0.14em] text-muted-2">{label}</span>
    </div>
  );
}
