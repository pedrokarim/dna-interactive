export interface CharacterElement {
  key: string;
  label: string;
}

export interface CharacterPortrait {
  publicPath: string | null;
}

export interface CharacterPortraits {
  gacha: CharacterPortrait;
  head: CharacterPortrait;
  icon: CharacterPortrait;
  bust: CharacterPortrait;
  phantom: CharacterPortrait;
  charpiece: CharacterPortrait;
}

export interface CharacterCamp {
  key: string;
  nameKey: string | null;
  iconGamePath: string | null;
}

export interface CharacterTextKeys {
  nameKey: string | null;
  subtitleKey: string | null;
  birthdayKey: string | null;
  forceKey: string | null;
  campNameKey: string | null;
}

export interface CharacterLocalizedContent {
  name: string | null;
  subtitle: string | null;
  birthday: string | null;
  force: string | null;
  campName: string | null;
}

export interface CharacterIntronLevel {
  cardLevel: number;
  resourceId: number;
  resourceNum: number;
}

export interface CharacterBaseStats {
  atk: number;
  atkGrowCurve: string;
  def: number;
  defGrowCurve: string;
  maxHp: number;
  maxHpGrowCurve: string;
  maxES: number;
  maxESGrowCurve: string;
  maxSp: number;
}

export interface CharacterAddonAttr {
  attrId: number;
  attrName: string;
  rate?: number;
  value?: number;
  iconPath: string;
  nameKey: string;
}

export interface LevelUpCurves {
  maxLevel: number;
  curves: Record<string, Record<number, number>>;
}

export interface CharacterRecord {
  id: string;
  charId: number;
  internalName: string;
  element: CharacterElement;
  weaponTags: string[];
  camp: CharacterCamp;
  rarity: number | null;
  maxLevel: number | null;
  colorVar: string | null;
  gender: boolean | null;
  sortPriority: number | null;
  charPieceId: number | null;
  unlockRequiredPiece: number | null;
  intronLevels: CharacterIntronLevel[];
  baseStats: CharacterBaseStats;
  addonAttrs: CharacterAddonAttr[];
  positioning: string[];
  recommendAttr: string[];
  ascensionLevels: number[];
  textKeys: CharacterTextKeys;
  portraits: CharacterPortraits;
  translations: Record<string, CharacterLocalizedContent>;
}

export interface CharactersCatalog {
  generatedAt: string;
  characterCount: number;
  availableLanguages: string[];
  defaultGridLanguages: string[];
  defaultDetailLanguage: string;
  elements: CharacterElement[];
  weaponTypes: string[];
  camps: { key: string; nameKey: string | null }[];
}
