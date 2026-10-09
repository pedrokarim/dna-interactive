import metaJson from "@/data/characters/attribute-meta.json";

/**
 * Icônes et noms officiels des attributs et des rôles.
 *
 * Les noms et les icônes de rôle viennent des tables du jeu
 * (`extract:roles:site`). Les icônes d'attribut sont celles que le jeu pose sur
 * les bonus d'ascension ; la correspondance attribut → icône est relevée ici.
 */

interface MetaFile {
  positioning: Record<string, { icon: string; names: Record<string, string | null> }>;
  attributes: Record<string, Record<string, string | null>>;
}

const meta = metaJson as MetaFile;

const TALENT_ICON_DIR = "/assets/characters/skills";

/**
 * Attribut → numéro de l'icône `T_SkillTalent_NN`.
 *
 * Relevé sur les bonus d'ascension, où le jeu associe lui-même chaque attribut
 * à son icône. Deux exceptions, le bouclier et la Lucidité, qu'aucun bonus
 * d'ascension ne porte : leur icône est celle du rôle du même nom, dont le jeu
 * reprend le dessin à l'identique.
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
