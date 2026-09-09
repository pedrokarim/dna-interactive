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
 */

import mapLoaders from "@/data/maps";
import mapIndex from "@/data/mapIndex.json";
import type { GameMap, GameMapSummary } from "@/types/map";
import { REGION_ID_BY_SLUG, getRegionSlug } from "./slugs";

export { getRegionSlug };

export interface RegionSummary {
  /** Segment d'URL, ex. `mount-arcano`. */
  slug: string;
  /** Identifiant du jeu, celui de `?mapId=`, ex. `mountarcano`. */
  id: string;
  name: string;
  image: string;
  imageSize: { width: number; height: number };
  categoryCount: number;
  /** Nombre de types de marqueurs (« Snowcap », « Teleport Point »…). */
  markerTypeCount: number;
}

export interface RegionCategory {
  type: string;
  label: string;
  icon: string;
  /** Types de marqueurs de la catégorie, avec le nombre de points relevés. */
  markerTypes: { id: number; name: string; icon: string; pointCount: number }[];
  pointCount: number;
}

export interface RegionDetail extends RegionSummary {
  categories: RegionCategory[];
  /** Nombre total de marqueurs réellement placés sur la carte. */
  pointCount: number;
}

const summaries = mapIndex as GameMapSummary[];

/**
 * Résumé de toutes les régions, dans l'ordre de `mapIndex.json`.
 *
 * Lit l'index et non les fichiers de carte complets : suffisant pour lister,
 * et sans charger les milliers de coordonnées dont une liste n'a que faire.
 */
export function getAllRegions(): RegionSummary[] {
  return summaries
    .filter((map) => map.id in mapLoaders)
    .map((map) => ({
      slug: getRegionSlug(map.id),
      id: map.id,
      name: map.name,
      image: map.image,
      imageSize: map.imageSize,
      categoryCount: map.legend.length,
      markerTypeCount: map.legend.reduce(
        (total, category) => total + category.markers.length,
        0,
      ),
    }));
}

/**
 * Détail complet d'une région, ou `null` si le slug est inconnu.
 *
 * Charge le fichier de carte complet : c'est lui, et non l'index, qui porte
 * les marqueurs placés. Les décomptes affichés doivent être les vrais, pas une
 * estimation tirée de la légende.
 */
export async function getRegionBySlug(
  slug: string,
): Promise<RegionDetail | null> {
  const id = REGION_ID_BY_SLUG[slug];
  if (!id) return null;

  const loader = mapLoaders[id];
  const summary = summaries.find((map) => map.id === id);
  if (!loader || !summary) return null;

  const data = (await loader()).default as GameMap;

  // ==Fusion par libellé==. Plusieurs cartes déclarent deux fois la même
  // catégorie (Bloomfield Station a deux blocs « Collectibles »). Les laisser
  // séparées donnait deux sections identiques sur la page, et deux `h3` de même
  // texte : mauvais pour le lecteur comme pour un moteur. On regroupe, les
  // décomptes deviennent ceux de la catégorie entière.
  const byLabel = new Map<string, RegionCategory>();

  for (const category of data.legend) {
    const markerTypes = category.markers.map((markerType) => ({
      id: markerType.id,
      name: markerType.name,
      icon: markerType.icon,
      pointCount: markerType.markers?.length ?? 0,
    }));

    const existing = byLabel.get(category.label);
    if (existing) {
      existing.markerTypes.push(...markerTypes);
    } else {
      byLabel.set(category.label, {
        type: category.type,
        label: category.label,
        icon: category.icon,
        markerTypes,
        pointCount: 0,
      });
    }
  }

  const categories: RegionCategory[] = [...byLabel.values()].map((category) => ({
    ...category,
    pointCount: category.markerTypes.reduce(
      (total, markerType) => total + markerType.pointCount,
      0,
    ),
  }));

  return {
    slug,
    id,
    name: data.name,
    image: data.image,
    imageSize: data.imageSize,
    categoryCount: categories.length,
    markerTypeCount: categories.reduce(
      (total, category) => total + category.markerTypes.length,
      0,
    ),
    pointCount: categories.reduce(
      (total, category) => total + category.pointCount,
      0,
    ),
    categories,
  };
}

/** Les autres régions, pour le maillage interne en bas de chaque page. */
export function getOtherRegions(slug: string): RegionSummary[] {
  return getAllRegions().filter((region) => region.slug !== slug);
}
