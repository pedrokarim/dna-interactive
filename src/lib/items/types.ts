export type ItemRawField = string | number | boolean | null | number[];

export interface ItemLocalizedContent {
  modName: string | null;
  description: string | null;
  demonWedgeName: string | null;
  functionLabel: string | null;
  passiveEffectsDescription: string | null;
  affinityName: string | null;
  archiveName: string | null;
  typeCompatibilityNames: string[];
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
  passiveEffectsDescKey: string | null;
  affinityNameKey: string | null;
  archiveNameKey: string | null;
}

export interface ItemIcon {
  gamePath: string | null;
  publicPath: string | null;
  placeholderPath: string | null;
  candidates: string[];
  allMatches: string[];
}

export interface ItemResolvedAttribute {
  attrName: string | null;
  allowModMultiplier: string | null;
  rate: number | null;
  value: number | null;
  rawRate: string | number | null;
  rawValue: string | number | null;
}

export interface ItemScaling {
  defaultLevel: number;
  maxLevel: number;
  availableLevels: number[];
  valuesByLevel: Record<string, Record<string, number>>;
  attributesByLevel: Record<string, ItemResolvedAttribute[]>;
}

export interface ItemAffinity {
  id: number | null;
  nameKey: string | null;
  char: string | null;
  icon: ItemIcon;
}

export interface ItemTolerance {
  baseCost: number | null;
  costChange: number | null;
  maxLevel: number;
  valuesByLevel: Record<string, number | null>;
}

export interface ItemTypeCompatibilityTag {
  key: string;
  icon: ItemIcon;
}

export interface ItemTypeCompatibility {
  applicationType: number | null;
  textKeys: string[];
  tags: ItemTypeCompatibilityTag[];
}

export interface ItemRecord {
  id: string;
  categoryId: string;
  modId: number;
  archiveId: number | null;
  stats: ItemStats;
  textKeys: ItemTextKeys;
  affinity: ItemAffinity;
  typeCompatibility: ItemTypeCompatibility;
  tolerance: ItemTolerance;
  icon: ItemIcon;
  scaling: ItemScaling;
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
