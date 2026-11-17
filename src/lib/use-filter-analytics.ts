"use client";

import { useEffect, useRef } from "react";

import { captureAnalytics, type AnalyticsProperties } from "@/lib/analytics";

/** Laps sans frappe au bout duquel on considère la recherche arrêtée. */
const REPOS_MS = 1_200;

/**
 * Émet `list_filtered` quand un filtrage de liste se stabilise.
 *
 * Deux raisons de ne pas brancher `captureAnalytics` directement sur les
 * champs :
 *
 * - **Le volume.** Ces grilles filtrent à la frappe. Un événement par
 *   changement donnerait une trentaine d'envois pour une recherche, et
 *   mesurerait la longueur du mot tapé plutôt que la recherche elle-même. On
 *   attend donc que ça se pose.
 * - **Le contenu.** Le terme saisi ne sort pas d'ici. Savoir *qu'on* a cherché
 *   et combien de résultats sont sortis répond à la question utile — « les gens
 *   trouvent-ils ? » — sans transporter ce que quelqu'un a tapé dans un champ.
 *   `results: 0` après une recherche est le signal qui compte : c'est une
 *   recherche qui a échoué.
 *
 * L'état initial n'est jamais émis : arriver sur une liste non filtrée n'est
 * pas un filtrage, c'est la pageview qui le dit déjà.
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
    // `signature` résume `filters` et `results` : les lister en plus
    // relancerait l'effet sur une nouvelle identité d'objet à contenu égal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, list]);
}
