"use client";

import { useEffect, useRef } from "react";

import { captureAnalytics, type AnalyticsProperties } from "@/lib/analytics";

/** Laps sans frappe au bout duquel on considère la recherche arrêtée. */
const REPOS_MS = 1_200;

/**
 * Émet `list_filtered` quand un filtrage de liste se stabilise.
 *
 * On ne branche pas `captureAnalytics` sur les champs. Ces grilles filtrent à
 * la frappe : un événement par changement ferait une trentaine d'envois par
 * recherche, et on mesurerait la longueur du mot tapé. On attend donc que ça
 * se pose.
 *
 * Le terme saisi ne part pas. Savoir qu'il y a eu une recherche et combien de
 * résultats elle a donnés suffit pour savoir si les gens trouvent ;
 * `results: 0` signale une recherche ratée.
 *
 * L'état initial n'est pas émis : la pageview le couvre déjà.
 */
export function useFilterAnalytics(
  list: string,
  filters: AnalyticsProperties,
  results: number,
): void {
  const signature = JSON.stringify({ filters, results });
  const previous = useRef<string | null>(null);

  useEffect(() => {
    // Premier rendu : on mémorise sans émettre.
    if (previous.current === null) {
      previous.current = signature;
      return;
    }
    if (previous.current === signature) return;

    const timer = setTimeout(() => {
      previous.current = signature;
      captureAnalytics("list_filtered", { list, ...filters, results: results });
    }, REPOS_MS);

    return () => clearTimeout(timer);
    // `signature` résume `filters` et `results` : les ajouter relancerait
    // l'effet à chaque nouvel objet, même à contenu égal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, list]);
}
