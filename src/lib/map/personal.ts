/**
 * Marqueurs personnels : points posés par le joueur, avec un libellé, une
 * icône et une couleur. Stockés dans le navigateur (synchronisation avec le
 * compte : phase suivante de la refonte).
 */

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const PERSONAL_ICONS = {
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7",
  gem: "M6 3h12l4 6-10 13L2 9z M2 9h20 M12 22 8 9l4-6 4 6-4 13",
  heart:
    "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M22 12h-4 M6 12H2 M12 6V2 M12 22v-4",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01",
} as const;
export type PersonalIcon = keyof typeof PERSONAL_ICONS;

/** Couleurs = jetons du design system (valeurs du thème sombre, la carte l'est toujours). */
export const PERSONAL_COLORS = {
  gold: "#e3cd95",
  crimson: "#e2664a",
  hydro: "#5fa8ff",
  anemo: "#57d6a6",
  electro: "#a48ed0",
  parch: "#ece4d2",
} as const;
export type PersonalColor = keyof typeof PERSONAL_COLORS;

export interface PersonalMarker {
  id: string;
  mapId: string;
  /** Coordonnées dans le repère de l'image (mêmes que les points boarhat). */
  x: number;
  y: number;
  label: string;
  note: string;
  icon: PersonalIcon;
  color: PersonalColor;
  createdAt: number;
}

export const PERSONAL_MARKERS_MAX = 300;

export const personalMarkersAtom = atomWithStorage<PersonalMarker[]>("map:personal-markers", []);
export const showPersonalMarkersAtom = atomWithStorage<boolean>("map:show-personal", true);

/** SVG autonome (chaîne) d'une icône, pour les DivIcon de Leaflet. */
export function personalIconSvg(icon: PersonalIcon, color: string, size: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${PERSONAL_ICONS[icon]}"/></svg>`;
}

/** Marqueur personnel en cours d'édition (fiche flottante), ou `null`. */
export const editingPersonalAtom = atom<string | null>(null);
