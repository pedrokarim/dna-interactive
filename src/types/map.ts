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

export interface GameMap {
  id: string;
  name: string;
  image: string;
  imageSize: { width: number; height: number };
  legend: LegendCategory[];
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
