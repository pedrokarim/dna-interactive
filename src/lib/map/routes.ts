/**
 * Itinéraires de farm (côté client) : tracés partagés par la communauté,
 * stockés en base (`farm_routes`), votés anonymement comme les builds.
 */

import { atom } from "jotai";

export interface FarmRoute {
  id: string;
  mapId: string;
  title: string;
  description: string | null;
  /** Sommets dans le repère de l'image, `[x, y]`. */
  points: [number, number][];
  typeIds: string[];
  visibility: "public" | "private";
  voteCount: number;
  authorName: string | null;
  isMine: boolean;
  votedByMe: boolean;
  createdAt: string;
}

/** Itinéraires chargés pour la carte courante. */
export const routesAtom = atom<FarmRoute[]>([]);
/** Itinéraires tracés sur la carte. */
export const shownRouteIdsAtom = atom<string[]>([]);
/** Itinéraire mis en avant (survol / sélection dans la liste). */
export const focusedRouteIdAtom = atom<string | null>(null);

/** Tracé en cours : `null` hors mode tracé. */
export const drawingAtom = atom<[number, number][] | null>(null);

/** Palette des tracés affichés, pour les distinguer quand plusieurs se croisent. */
export const ROUTE_COLORS = ["#e3cd95", "#5fa8ff", "#57d6a6", "#e2664a", "#a48ed0", "#ece4d2"];

/** Demande de cadrage sur un itinéraire (clic dans la liste, lien partagé). */
export const fitRouteAtom = atom<{ id: string; nonce: number } | null>(null);
