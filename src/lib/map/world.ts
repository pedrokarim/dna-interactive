/**
 * Hiérarchie du monde : nation → carte monde → sous-cartes.
 *
 * Tirée des tables `WorldMap` / `RegionMap` / `Region` du jeu (1.6) par
 * `research_data/scripts/gen-map-world.mjs` ; noms en 7 langues depuis le
 * TextMap. Module sans dépendance lourde : importable côté client comme serveur.
 */

import world from "@/data/maps/world.json";
import progressIndex from "@/data/maps/progress-index.json";
import mapIndex from "@/data/mapIndex.json";
import type { Progress } from "./progress";

export type LocalizedName = Record<string, string>;

export interface WorldSubMap {
  /** Identifiant de carte du site (celui de `src/data/maps`). */
  id: string;
  gameMapId: number;
  /** Carte principale de sa zone. */
  main: boolean;
  name: LocalizedName;
}

export interface WorldArea {
  id: string;
  name: LocalizedName;
  /** Chapitre « Crépuscule » (EX) du jeu. */
  twilight: boolean;
  maps: WorldSubMap[];
}

export interface WorldNation {
  id: string;
  name: LocalizedName;
  areas: WorldArea[];
}

/**
 * Filet de sécurité pour les mises à jour boarhat : une carte présente dans
 * `mapIndex.json` mais pas encore rangée dans `world.json` (nouvelle zone pas
 * encore rattachée à sa nation) reste accessible, dans un groupe à part,
 * sous son nom boarhat. `scripts/check-map-taxonomy.ts` la signale.
 */
const PLACEHOLDER_NATION_NAME: LocalizedName = {
  fr: "Nouvelles zones",
  en: "New areas",
  de: "Neue Gebiete",
  es: "Nuevas zonas",
  jp: "新エリア",
  kr: "새 지역",
  tc: "新區域",
};

const knownIds = new Set((world.nations as WorldNation[]).flatMap((n) => n.areas.flatMap((a) => a.maps.map((m) => m.id))));
const unlisted = (mapIndex as { id: string; name: string }[]).filter((m) => !knownIds.has(m.id));

export const NATIONS: WorldNation[] = [
  ...(world.nations as WorldNation[]),
  ...(unlisted.length
    ? [
        {
          id: "unlisted",
          name: PLACEHOLDER_NATION_NAME,
          areas: unlisted.map((m, i) => ({
            id: `unlisted-${m.id}`,
            name: { en: m.name },
            twilight: false,
            maps: [{ id: m.id, gameMapId: -1 - i, main: true, name: { en: m.name } }],
          })),
        },
      ]
    : []),
];

export function localized(name: LocalizedName, locale: string): string {
  return name[locale] ?? name.en;
}

interface MapLocation {
  nation: WorldNation;
  area: WorldArea;
  map: WorldSubMap;
}

const LOCATIONS = new Map<string, MapLocation>();
for (const nation of NATIONS)
  for (const area of nation.areas)
    for (const map of area.maps) LOCATIONS.set(map.id, { nation, area, map });

export const getMapLocation = (mapId: string) => LOCATIONS.get(mapId);

/** Cartes dans l'ordre du sélecteur : nation, puis zones du chapitre courant avant le Crépuscule. */
export const ORDERED_MAP_IDS: string[] = NATIONS.flatMap((n) =>
  [...n.areas]
    .sort((a, b) => Number(a.twilight) - Number(b.twilight))
    .flatMap((a) => a.maps.map((m) => m.id)),
);

/** Index précalculé : carte → catégorie → clés des points suivis. */
export const TRACKED_INDEX = progressIndex as Record<string, Record<string, string[]>>;

function countFound(keys: string[], marked: ReadonlySet<string>): Progress {
  let found = 0;
  for (const k of keys) if (marked.has(k)) found++;
  return { found, total: keys.length };
}

/** Progression d'exploration d'une carte à partir de l'index précalculé. */
export function mapProgressFromIndex(mapId: string, marked: ReadonlySet<string>): Progress {
  return countFound(Object.values(TRACKED_INDEX[mapId] ?? {}).flat(), marked);
}

/** Progression par catégorie, sur toutes les cartes ou sur une liste de cartes. */
export function categoryProgressFromIndex(
  marked: ReadonlySet<string>,
  mapIds: string[] = Object.keys(TRACKED_INDEX),
): Record<string, Progress> {
  const out: Record<string, Progress> = {};
  for (const mapId of mapIds)
    for (const [category, keys] of Object.entries(TRACKED_INDEX[mapId] ?? {})) {
      const p = countFound(keys, marked);
      const acc = (out[category] ??= { found: 0, total: 0 });
      acc.found += p.found;
      acc.total += p.total;
    }
  return out;
}

export function sumProgress(list: Progress[]): Progress {
  return list.reduce((a, p) => ({ found: a.found + p.found, total: a.total + p.total }), { found: 0, total: 0 });
}
