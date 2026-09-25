/**
 * État persistant de la carte interactive (préférences du visiteur).
 *
 * La progression elle-même (points trouvés) reste dans `markedMarkersAtom`
 * (`@/lib/store`) : même clé localStorage qu'avant, pour ne rien perdre.
 */

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

/**
 * Types affichés sur la carte, par id canonique. Un seul jeu pour toutes les
 * cartes : les types étant désormais communs, ce qu'on suit (les coffres, les
 * runes…) reste suivi d'une zone à l'autre, comme sur la carte du jeu.
 */
export const DEFAULT_ACTIVE_TYPES = [
  "teleport",
  "storageChest",
  "treasureMapChest",
  "monsterChest",
  "hiddenChest",
  "explorerProof",
];

export const activeTypesAtom = atomWithStorage<string[]>(
  "map:active-types",
  DEFAULT_ACTIVE_TYPES,
);

/** Recherches récentes, la plus récente en tête. */
export const searchHistoryAtom = atomWithStorage<string[]>("map:search-history", []);
export const SEARCH_HISTORY_MAX = 12;

export interface MapSettings {
  /** Masque les points déjà trouvés. */
  hideFound: boolean;
  /** Affiche le nom des sous-zones sur la carte. */
  showPlaces: boolean;
  /** Taille des pastilles. */
  markerSize: "s" | "m" | "l";
}

export const mapSettingsAtom = atomWithStorage<MapSettings>("map:settings", {
  hideFound: false,
  showPlaces: true,
  markerSize: "m",
});

export const panelCollapsedAtom = atomWithStorage<boolean>("map:panel-collapsed", false);

/** Point à centrer (recherche, liste « Marqué »), consommé par la carte. */
export const flyToAtom = atom<{ x: number; y: number; key?: string; nonce: number } | null>(null);

/** Rail des types affichés replié en un seul bouton (comme sur HoYoLAB). */
export const railCollapsedAtom = atomWithStorage<boolean>("map:rail-collapsed", false);

/** Demande de recadrage de la carte entière (bouton « recentrer »). */
export const refitAtom = atom(0);
