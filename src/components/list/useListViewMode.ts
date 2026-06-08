"use client";

import { useAtom } from "jotai";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { listViewModesAtom, type ListViewMode } from "@/lib/store";

const VIEW_MODE_VALUES = ["simplified", "list", "detailed"] as const;

/**
 * Mode d'affichage d'une liste (Simplifié / Liste / Détaillé).
 *
 * @param surfaceKey  Identifiant de la liste ("characters", "items:<categoryId>", "drafts").
 *                    La préférence est mémorisée par liste.
 * @param defaultMode Mode par défaut de cette liste (ex. "detailed" pour les MOD, sinon "simplified").
 *
 * Lecture : paramètre d'URL `view` (partageable) → préférence persistée de la liste → défaut.
 * Écriture : met à jour la préférence de la liste + l'URL.
 *
 * NOTE : volontairement séparé des blocs `useQueryStates({...})` des grilles afin de
 * ne pas perturber leur heuristique `hasUrlFilters` ni leur batching de filtres.
 */
export function useListViewMode(
  surfaceKey: string,
  defaultMode: ListViewMode = "simplified",
): [ListViewMode, (mode: ListViewMode) => void] {
  const [modes, setModes] = useAtom(listViewModesAtom);
  const [urlView, setUrlView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEW_MODE_VALUES),
  );

  const value: ListViewMode = urlView ?? modes[surfaceKey] ?? defaultMode;

  const setValue = (mode: ListViewMode): void => {
    setModes((prev) => ({ ...prev, [surfaceKey]: mode }));
    void setUrlView(mode);
  };

  return [value, setValue];
}
