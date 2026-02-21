export type ItemRawField = string | number | boolean | null | number[];

export interface ItemLocalizedContent {
  modName: string | null;
  description: string | null;
  demonWedgeName: string | null;
  functionLabel: string | null;
  archiveName: string | null;
}

export interface ItemStats {
  rarity: number | null;
  polarity: number | null;
  maxLevel: number | null;
  cost: number | null;
  openVersion: number | null;
  releaseVersion: number | null;
}

export interface ItemTextKeys {
  modNameKey: string | null;
  descriptionKey: string | null;
  demonWedgeKey: string | null;
  functionKey: string | null;
  archiveNameKey: string | null;
}

export interface ItemIcon {
  gamePath: string | null;
  sourceAsset: string | null;
  publicPath: string | null;
  placeholderPath: string | null;
  candidates: string[];
  allMatches: string[];
}

export interface ItemRecord {
  id: string;
  categoryId: string;
  modId: number;
  archiveId: number | null;
  stats: ItemStats;
  textKeys: ItemTextKeys;
  icon: ItemIcon;
  translations: Record<string, ItemLocalizedContent>;
  fields: Record<string, ItemRawField>;
}

export interface ItemCategory {
  id: string;
  slug: string;
  title: string;
  technicalName: string;
  displayName: string;
  description: string;
  itemCount: number;
  availableLanguages: string[];
  defaultGridLanguages: string[];
  defaultDetailLanguage: string;
  datasetFile: string;
  iconDirectory: string;
  sampleIconPath: string | null;
}

export interface ItemCatalog {
  generatedAt: string;
  categories: ItemCategory[];
}
