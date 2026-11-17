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
 * En lecture : le paramètre d'URL `view` (partageable), sinon la préférence
 * enregistrée pour la liste, sinon le défaut. En écriture, on met à jour la
 * préférence et l'URL.
 *
 * Séparé exprès des `useQueryStates({...})` des grilles, pour ne pas fausser
 * leur `hasUrlFilters` ni le regroupement de leurs mises à jour de filtres.
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
