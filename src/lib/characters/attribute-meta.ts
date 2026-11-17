import metaJson from "@/data/characters/attribute-meta.json";

/**
 * Icônes et noms officiels des attributs et des rôles.
 *
 * Noms et icônes de rôle viennent des tables du jeu (`extract:roles:site`).
 * Les icônes d'attribut sont celles des bonus d'ascension, la correspondance
 * est relevée à la main ci-dessous.
 */

interface MetaFile {
  positioning: Record<string, { icon: string; names: Record<string, string | null> }>;
  attributes: Record<string, Record<string, string | null>>;
}

const meta = metaJson as MetaFile;

const TALENT_ICON_DIR = "/assets/characters/skills";

/**
 * Numéro de l'icône `T_SkillTalent_NN` de chaque attribut, relevé sur les
 * bonus d'ascension. Le bouclier et la Lucidité n'ont pas de bonus d'ascension :
 * on prend l'icône du rôle du même nom, le jeu utilise le même dessin.
 */
const TALENT_ICON_BY_ATTRIBUTE: Record<string, string> = {
  ATK: "08",
  MaxHp: "14",
  DEF: "07",
  MaxES: "09",
  MaxSp: "01",
  SkillRange: "10",
  SkillSustain: "11",
  SkillIntensity: "12",
  SkillEfficiency: "13",
  EnmityValue: "05",
  StrongValue: "02",
  MultiShootModifierRate: "06",
  WeaponCRIModifierRate: "03",
};

/** Icône du jeu pour un attribut, ou `null` quand le jeu n'en fournit pas. */
export function attributeIcon(attribute: string): string | null {
  // « ATK_Fire », « ATK_Dark »… : une ATQ d'élément reste une ATQ.
  const key = attribute.startsWith("ATK_") ? "ATK" : attribute;
  const id = TALENT_ICON_BY_ATTRIBUTE[key];
  return id ? `${TALENT_ICON_DIR}/T_SkillTalent_${id}.png` : null;
}

/** Nom officiel d'un attribut dans la langue voulue, ou `null` s'il est inconnu. */
export function attributeName(attribute: string, lang: string): string | null {
  const names = meta.attributes[attribute];
  return names ? names[lang] ?? names.EN ?? null : null;
}

export interface PositioningMeta {
  icon: string;
  name: string;
}

/** Icône et nom officiel d'un rôle (`DPS`, `Support`, `SkillDPS`…). */
export function positioningMeta(key: string, lang: string): PositioningMeta | null {
  const entry = meta.positioning[key];
  if (!entry) return null;
  return { icon: entry.icon, name: entry.names[lang] ?? entry.names.EN ?? key };
}
