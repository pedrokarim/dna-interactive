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
  intronEffects: (string | null)[];
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
  intronDescriptionKeys: string[];
  intronParameters: string[];
  baseStats: CharacterBaseStats;
  addonAttrs: CharacterAddonAttr[];
  positioning: string[];
  recommendAttr: string[];
  ascensionLevels: number[];
  textKeys: CharacterTextKeys;
  portraits: CharacterPortraits;
  consonanceWeapons: CharacterConsonanceWeapon[];
  skillIcons: {
    skill1: CharacterPortrait;
    skill2: CharacterPortrait;
    skill3: CharacterPortrait;
  };
  translations: Record<string, CharacterLocalizedContent>;
}

export interface CharacterConsonanceWeapon {
  weaponId: number;
  nameKey: string | null;
  rarity: number;
  icon: { publicPath: string | null };
  translations: Record<string, { name: string | null }>;
}

export interface CharacterSkillParam {
  label: string | null;
  labelKey: string | null;
  formula: string;
  valuesByLevel: Record<string, string | null>;
  levelDependent: boolean;
}

export const SKILL_LEVEL_MIN = 1;
export const SKILL_LEVEL_MAX = 20;

export interface CharacterSkillSection {
  heading: string | null;
  headingKey: string | null;
  indices: number[];
}

export interface CharacterSkillCombatTerm {
  id: string;
  nameKey: string | null;
  explanationKey: string | null;
  name: string | null;
  explanation: string | null;
}

export interface CharacterSkillLocalized {
  name: string | null;
  description: string | null;
  params: CharacterSkillParam[];
  sections: CharacterSkillSection[];
  combatTerms: CharacterSkillCombatTerm[];
}

export interface CharacterSkill {
  skillId: number;
  skillType: string | null;
  iconPublicPath: string | null;
  iconName: string | null;
  explanationIds: string[];
  skillDescKeys: (string | null)[];
  skillDescValues: (string | null)[];
  skillDescGroups: Array<{ sectionKey: string; indices: number[] }>;
  translations: Record<string, CharacterSkillLocalized>;
}

export interface CharacterSkillSet {
  charId: number;
  charName: string | null;
  skillList: number[];
  upgradeSkillExtraLevel: Array<{ grade: number; skillId: number; extraLv: number }>;
  skills: CharacterSkill[];
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
