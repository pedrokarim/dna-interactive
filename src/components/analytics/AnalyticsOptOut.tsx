"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

import { DnaButton, DnaSectionLabel } from "@/components/dna";
import {
  subscribeToAnalyticsOptOut,
  acceptAnalytics,
  isAnalyticsOptedOut,
  isAnalyticsOptedOutOnServer,
  refuseAnalytics,
} from "@/lib/analytics";

/**
 * Bouton pour refuser la mesure d'audience, sur la page Confidentialité.
 *
 * La mesure démarre dès la première visite, sans bandeau : il faut donc un
 * endroit où la refuser.
 *
 * L'état vit dans le stockage local, hors de React, d'où `useSyncExternalStore`.
 * Côté serveur on rend « non refusé » (pas de navigateur pour savoir), puis
 * l'état réel à l'hydratation, sans l'erreur d'hydratation d'un `useState` lu
 * au montage.
 */
export function AnalyticsOptOut() {
  const t = useTranslations("privacy");
  const refuse = useSyncExternalStore(
    subscribeToAnalyticsOptOut,
    isAnalyticsOptedOut,
    isAnalyticsOptedOutOnServer,
  );

  return (
    <>
      <DnaSectionLabel>{t("optOutTitle")}</DnaSectionLabel>
      <p className="mt-3 font-sans text-sm leading-relaxed text-parch/85">{t("optOutText")}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {/* `aria-live` : le texte change sans que le focus bouge, sinon le
            lecteur d'écran ne dirait rien. */}
        <p aria-live="polite" className="font-sans text-sm text-parch/85">
          {refuse ? t("optOutDisabled") : t("optOutActive")}
        </p>

        <DnaButton
          variant={refuse ? "gold" : "ghost"}
          onClick={refuse ? acceptAnalytics : refuseAnalytics}
        >
          {refuse ? t("optOutAllow") : t("optOutDeny")}
        </DnaButton>
      </div>

      <p className="mt-3 font-sans text-xs leading-relaxed text-muted">{t("optOutNote")}</p>
    </>
  );
}
