export interface MarkerInstance {
  id: number;
  position: { x: number; y: number };
  image?: string;
}

export interface MarkerType {
  id: number;
  name: string;
  icon: string;
  markers: MarkerInstance[];
}

export interface LegendCategory {
  type: string;
  label: string;
  icon: string;
  markers: MarkerType[];
}

/**
 * Point du jeu absent du relevé boarhat (`src/data/maps/game/<carte>.json`),
 * déjà rangé dans un type canonique de la taxonomie.
 */
export interface GamePoint {
  /** Type canonique (`teleport`, `storageChest`, `res-caramellus`…). */
  t: string;
  /** Clé de progression, stable d'une génération à l'autre. */
  k: string;
  x: number;
  y: number;
  /** Titre par langue (lectures). */
  titles?: Record<string, string>;
}

export interface GamePointsFile {
  /** Icône des types canoniques qui n'ont pas de ressource associée. */
  icons: Record<string, string>;
  points: GamePoint[];
}

export interface GameMap {
  id: string;
  name: string;
  image: string;
  imageSize: { width: number; height: number };
  legend: LegendCategory[];
  /** Points complémentaires, fusionnés par `normalizeMap`. */
  gamePoints?: GamePointsFile;
}

// Index version: legend without marker instances, with pre-computed counts
export interface MarkerTypeSummary {
  id: number;
  name: string;
  icon: string;
}

export interface LegendCategorySummary {
  type: string;
  label: string;
  icon: string;
  markers: MarkerTypeSummary[];
}

export interface GameMapSummary {
  id: string;
  name: string;
  image: string;
  imageSize: { width: number; height: number };
  markerCount: number;
  imageCount: number;
  legend: LegendCategorySummary[];
}
