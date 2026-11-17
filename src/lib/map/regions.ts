/**
 * Accès serveur aux régions de la carte, pour les pages `/map/[region]`.
 *
 * Sur `/map`, les 16 régions passent par un `<select>` et `?mapId=` : rien
 * n'est indexable par zone, alors que les joueurs cherchent justement par zone
 * (« bloomfield station map », « haojing chests »). Chaque région a donc son URL.
 *
 * Les ids du jeu sont irréguliers (`youlai_alley`, `arcanorift`, `mountarcano`) :
 * `REGION_SLUGS` fait la correspondance slug/id. Le slug est public et stable,
 * l'id reste celui de `mapLoaders` et de `?mapId=`.
 *
 * Même taxonomie que la carte (`taxonomy.ts`) : mêmes catégories, mêmes types
 * fusionnés, noms officiels du jeu pour les zones.
 */

import mapLoaders from "@/data/maps";
import mapIndex from "@/data/mapIndex.json";
import type { GameMap, GameMapSummary } from "@/types/map";
import { loadGameMap } from "./load";
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
 * Lit seulement l'index : sa légende a les types, ça suffit pour une liste, pas
 * besoin de charger des milliers de coordonnées.
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
 * Charge le fichier de carte complet : seul lui a les marqueurs placés, et on
 * veut les vrais décomptes, pas une estimation tirée de la légende.
 */
export async function getRegionBySlug(slug: string): Promise<RegionDetail | null> {
  const id = REGION_ID_BY_SLUG[slug];
  if (!id) return null;
  const summary = getAllRegions().find((r) => r.id === id);
  if (!summary) return null;
  const data = await loadGameMap(id);
  if (!data) return null;
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
