/**
 * Accès serveur aux régions de la carte, pour les pages `/map/[region]`.
 *
 * Ces pages existent pour une raison précise : jusqu'ici les 16 régions
 * vivaient toutes derrière la seule URL `/map`, pilotées par un `<select>` et
 * un paramètre `?mapId=`. Rien n'était indexable par zone, alors que c'est
 * exactement ce que les joueurs cherchent (« bloomfield station map »,
 * « haojing chests »). Chaque région a donc désormais son URL.
 *
 * Les identifiants du jeu sont irréguliers (`youlai_alley`, `arcanorift`,
 * `mountarcano`), on ne les met pas tels quels dans une URL : `REGION_SLUGS`
 * fait la traduction slug <-> id. Le slug est public et stable, l'id reste
 * celui attendu par `mapLoaders` et par `?mapId=`.
 *
 * Le contenu suit la même taxonomie que la carte (`taxonomy.ts`) : mêmes
 * catégories, mêmes types fusionnés, noms officiels du jeu pour les zones.
 */

import mapLoaders from "@/data/maps";
import mapIndex from "@/data/mapIndex.json";
import type { GameMap, GameMapSummary } from "@/types/map";
import { MAP_CATEGORY_IDS, normalizeMap, type MapCategoryId, type MapTypeGroup } from "./taxonomy";
import { getMapLocation, type LocalizedName } from "./world";
import { REGION_ID_BY_SLUG, getRegionSlug } from "./slugs";

export { getRegionSlug };

export interface RegionSummary {
  /** Segment d'URL, ex. `mount-arcano`. */
  slug: string;
  /** Identifiant du jeu, celui de `?mapId=`, ex. `mountarcano`. */
  id: string;
  /** Nom officiel en 7 langues (tables du jeu). */
  names: LocalizedName;
  /** Nation de rattachement, en 7 langues. */
  nationNames: LocalizedName;
  image: string;
  imageSize: { width: number; height: number };
  categoryCount: number;
  /** Nombre de types de marqueurs (après regroupement de la taxonomie). */
  markerTypeCount: number;
}

export interface RegionCategory {
  id: MapCategoryId;
  /** Types de la catégorie, avec le nombre de points relevés. */
  markerTypes: (Pick<MapTypeGroup, "id" | "icon" | "messageKey" | "resourceIds" | "rawName"> & { pointCount: number })[];
  pointCount: number;
}

export interface RegionDetail extends RegionSummary {
  categories: RegionCategory[];
  /** Nombre total de marqueurs réellement placés sur la carte. */
  pointCount: number;
}

const summaries = mapIndex as GameMapSummary[];

function categoriesOf(map: GameMap): RegionCategory[] {
  const normalized = normalizeMap(map);
  return MAP_CATEGORY_IDS.map((id) => {
    const markerTypes = normalized.types
      .filter((g) => g.category === id)
      .map((g) => ({
        id: g.id,
        icon: g.icon,
        messageKey: g.messageKey,
        resourceIds: g.resourceIds,
        rawName: g.rawName,
        pointCount: g.points.length,
      }));
    return { id, markerTypes, pointCount: markerTypes.reduce((t, m) => t + m.pointCount, 0) };
  }).filter((c) => c.markerTypes.length > 0);
}

/**
 * Résumé de toutes les régions, dans l'ordre de `mapIndex.json`.
 *
 * Lit l'index et non les fichiers de carte complets : suffisant pour lister
 * (la légende de l'index porte les types, sans les points), et sans charger
 * les milliers de coordonnées dont une liste n'a que faire.
 */
export function getAllRegions(): RegionSummary[] {
  return summaries
    .filter((map) => map.id in mapLoaders && getMapLocation(map.id))
    .map((map) => {
      const categories = categoriesOf(map as unknown as GameMap);
      const location = getMapLocation(map.id)!;
      return {
        slug: getRegionSlug(map.id),
        id: map.id,
        names: location.map.name,
        nationNames: location.nation.name,
        image: map.image,
        imageSize: map.imageSize,
        categoryCount: categories.length,
        markerTypeCount: categories.reduce((t, c) => t + c.markerTypes.length, 0),
      };
    });
}

/**
 * Détail complet d'une région, ou `null` si le slug est inconnu.
 *
 * Charge le fichier de carte complet : c'est lui, et non l'index, qui porte
 * les marqueurs placés. Les décomptes affichés doivent être les vrais, pas une
 * estimation tirée de la légende.
 */
export async function getRegionBySlug(slug: string): Promise<RegionDetail | null> {
  const id = REGION_ID_BY_SLUG[slug];
  if (!id) return null;
  const summary = getAllRegions().find((r) => r.id === id);
  const loader = mapLoaders[id];
  if (!loader || !summary) return null;

  const data = (await loader()).default as GameMap;
  const categories = categoriesOf(data);

  return {
    ...summary,
    categoryCount: categories.length,
    markerTypeCount: categories.reduce((t, c) => t + c.markerTypes.length, 0),
    pointCount: categories.reduce((t, c) => t + c.pointCount, 0),
    categories,
  };
}

/** Les autres régions, pour le maillage interne en bas de chaque page. */
export function getOtherRegions(slug: string): RegionSummary[] {
  return getAllRegions().filter((region) => region.slug !== slug);
}
