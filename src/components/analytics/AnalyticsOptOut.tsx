"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

import { DnaButton, DnaSectionLabel } from "@/components/dna";
import {
  abonnerRefusAnalytics,
  accepterAnalytics,
  analyticsRefusee,
  analyticsRefuseeServeur,
  refuserAnalytics,
} from "@/lib/analytics";

/**
 * Bascule de refus de la mesure d'audience.
 *
 * Le consentement est automatique sur ce site : la collecte démarre à la
 * première visite, sans bandeau. Ce n'est tenable que si le refus existe
 * quelque part et se trouve — la page Confidentialité annonçait la mesure sans
 * jamais offrir le moyen de s'y opposer.
 *
 * L'état vient du stockage local, donc d'en dehors de React : `useSyncExternalStore`
 * est fait pour ça. Il rend l'instantané serveur — « non refusé », la seule
 * hypothèse possible sans navigateur — puis bascule sur l'état réel dès
 * l'hydratation, sans le désaccord qu'un `useState` lu au montage produirait.
 */
export function AnalyticsOptOut() {
  const t = useTranslations("privacy");
  const refuse = useSyncExternalStore(
    abonnerRefusAnalytics,
    analyticsRefusee,
    analyticsRefuseeServeur,
  );

  return (
    <>
      <DnaSectionLabel>{t("optOutTitle")}</DnaSectionLabel>
      <p className="mt-3 font-sans text-sm leading-relaxed text-parch/85">{t("optOutText")}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {/* `aria-live` : le texte change sans que le focus bouge, donc rien ne
            serait annoncé sans ça. */}
        <p aria-live="polite" className="font-sans text-sm text-parch/85">
          {refuse ? t("optOutDisabled") : t("optOutActive")}
        </p>

        <DnaButton
          variant={refuse ? "gold" : "ghost"}
          onClick={refuse ? accepterAnalytics : refuserAnalytics}
        >
          {refuse ? t("optOutAllow") : t("optOutDeny")}
        </DnaButton>
      </div>

      <p className="mt-3 font-sans text-xs leading-relaxed text-muted">{t("optOutNote")}</p>
    </>
  );
}
