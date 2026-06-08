"use client";

import { useAtom } from "jotai";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { listViewModeAtom, type ListViewMode } from "@/lib/store";

const VIEW_MODE_VALUES = ["simplified", "list"] as const;

/**
 * Mode d'affichage des listes (Simplifié / Liste).
 *
 * Lecture : paramètre d'URL `view` (partageable) sinon préférence persistée globale.
 * Écriture : met à jour les deux (persistance + URL).
 *
 * NOTE : volontairement séparé des blocs `useQueryStates({...})` des grilles afin de
 * ne pas perturber leur heuristique `hasUrlFilters` ni leur batching de filtres.
 */
export function useListViewMode(): [ListViewMode, (mode: ListViewMode) => void] {
  const [persisted, setPersisted] = useAtom(listViewModeAtom);
  const [urlView, setUrlView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEW_MODE_VALUES),
  );

  const value: ListViewMode = urlView ?? persisted;

  const setValue = (mode: ListViewMode): void => {
    setPersisted(mode);
    void setUrlView(mode);
  };

  return [value, setValue];
}
