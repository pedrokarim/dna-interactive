"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

import { startAnalytics, trackLocale } from "@/lib/analytics";

/**
 * Démarre la mesure d'audience, ne rend rien.
 *
 * Le SDK est dans le bundle (avant, une balise <script> vers `/s.js`), voir
 * `@/lib/analytics`. `startAnalytics` ignore un second appel, donc le double
 * montage du mode strict ne pose pas de problème.
 */
export function SarutobiAnalytics() {
  const locale = useLocale();

  useEffect(() => {
    startAnalytics(locale);
  }, [locale]);

  // Séparé de l'init : changer de langue en cours de visite ne relance pas le
  // SDK, ça met juste à jour la locale envoyée avec les événements suivants.
  useEffect(() => {
    trackLocale(locale);
  }, [locale]);

  return null;
}
