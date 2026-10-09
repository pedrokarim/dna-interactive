import proficiencyJson from "@/data/characters/weapon-proficiency.json";

/**
 * Armes de prédilection.
 *
 * Chaque personnage a deux types d'armes de prédilection : une arme de ce type
 * gagne un bonus d'ATQ entre ses mains, et une arme de calamité n'active ses
 * Potentiels que dans ce cas. Un troisième emplacement, la maîtrise
 * supplémentaire, se débloque contre des matériaux : quatre types possibles par
 * personnage, fixés par le jeu, dont un seul est actif à la fois.
 *
 * Ce module ne lit que le fichier des prédilections : il reste léger, pour que
 * le builder puisse l'embarquer sans tirer tout le catalogue d'objets. La
 * lecture d'un build complet vit dans `weapon-proficiency-build.ts`.
 */

export type WeaponRange = "melee" | "ranged";

export interface WeaponTypeCost {
  itemId: string;
  amount: number;
}

export interface WeaponTypeInfo {
  tag: string;
  range: WeaponRange;
  icon: string;
  names: Record<string, string | null>;
  /** Ce que coûte le déblocage de ce type en maîtrise supplémentaire. */
  unlockCost: WeaponTypeCost[];
  /** Rareté minimale de l'arme à démonter pour obtenir le matériau propre au type. */
  insightFromRarity: number | null;
}

export interface CharacterProficiency {
  /** Types de prédilection d'origine. */
  base: WeaponTypeInfo[];
  /** Types proposés en maîtrise supplémentaire (un seul actif à la fois). */
  extra: WeaponTypeInfo[];
  /** Le personnage maîtrise déjà tous les types : pas d'emplacement supplémentaire. */
  allTypes: boolean;
}

interface ProficiencyFile {
  attackBonus: number;
  allTypesTag: string;
  allTypesNames: Record<string, string | null>;
  types: Record<string, Omit<WeaponTypeInfo, "tag" | "unlockCost" | "insightFromRarity"> & {
    unlockCost?: WeaponTypeCost[];
    insightFromRarity?: number;
  }>;
  characters: Record<string, { base: string[]; extra: string[] }>;
}

const data = proficiencyJson as ProficiencyFile;

/** Bonus d'ATQ d'une arme de prédilection, en fraction (`0.2` pour 20 %). */
export const PROFICIENCY_ATTACK_BONUS = data.attackBonus;

export function getWeaponType(tag: string): WeaponTypeInfo | null {
  const entry = data.types[tag];
  if (!entry) return null;
  return {
    tag,
    range: entry.range,
    icon: entry.icon,
    names: entry.names,
    unlockCost: entry.unlockCost ?? [],
    insightFromRarity: entry.insightFromRarity ?? null,
  };
}

/** Nom d'un type d'arme dans la langue voulue, anglais puis étiquette brute à défaut. */
export function weaponTypeName(type: Pick<WeaponTypeInfo, "tag" | "names">, lang: string): string {
  return type.names[lang] ?? type.names.EN ?? type.tag;
}

export function allWeaponTypesName(lang: string): string {
  return data.allTypesNames[lang] ?? data.allTypesNames.EN ?? data.allTypesTag;
}

export function getCharacterProficiency(charId: number): CharacterProficiency | null {
  const entry = data.characters[String(charId)];
  if (!entry) return null;
  const resolve = (tags: string[]) => tags.map(getWeaponType).filter((type): type is WeaponTypeInfo => type !== null);
  return {
    base: resolve(entry.base),
    extra: resolve(entry.extra),
    allTypes: entry.base.includes(data.allTypesTag),
  };
}

/** Vrai quand l'étiquette désigne un type d'arme que le jeu sait comparer à une prédilection. */
export function isWeaponTypeTag(tag: string): boolean {
  return Boolean(data.types[tag]);
}

/** Une arme conseillée, réduite à ce qu'il faut pour juger d'une maîtrise. */
export interface ProficiencyWeaponInput {
  itemId: string;
  name: string;
  rank: "best" | "alternative";
  /** Type de prédilection de l'arme (`Sword`, `Polearm`…), ou `null` s'il est inconnu. */
  tag: string | null;
  calamity: boolean;
}

export type ProficiencySuggestionWeapon = Pick<ProficiencyWeaponInput, "itemId" | "name" | "rank" | "calamity">;

export interface ProficiencySuggestion {
  type: WeaponTypeInfo;
  /** Armes conseillées par le build qui en profiteraient, les plus importantes d'abord. */
  weapons: ProficiencySuggestionWeapon[];
  /** Une arme de calamité est concernée : ses Potentiels restent inactifs sans cette maîtrise. */
  unlocksPotentials: boolean;
}

function weaponWeight(weapon: ProficiencySuggestionWeapon): number {
  // Une arme de calamité sans maîtrise perd ses Potentiels, pas seulement de l'ATQ :
  // elle pèse plus qu'un premier choix ordinaire.
  return (weapon.calamity ? 4 : 0) + (weapon.rank === "best" ? 2 : 1);
}

/**
 * Maîtrises supplémentaires utiles à un jeu d'armes, la plus utile en premier.
 *
 * Se déduit des armes conseillées : celles dont le type n'est pas une
 * prédilection d'origine mais figure parmi les quatre choix du personnage.
 * Une seule maîtrise étant active à la fois, la première de la liste est celle
 * à activer ; les suivantes servent aux armes alternatives.
 */
export function suggestProficienciesFor(charId: number, weapons: ProficiencyWeaponInput[]): ProficiencySuggestion[] {
  const proficiency = getCharacterProficiency(charId);
  if (!proficiency || proficiency.allTypes) return [];
  const baseTags = new Set(proficiency.base.map((type) => type.tag));
  const byTag = new Map<string, ProficiencySuggestion>();

  for (const weapon of weapons) {
    if (!weapon.tag || baseTags.has(weapon.tag)) continue;
    const type = proficiency.extra.find((candidate) => candidate.tag === weapon.tag);
    if (!type) continue;

    const suggestion = byTag.get(type.tag) ?? { type, weapons: [], unlocksPotentials: false };
    if (!suggestion.weapons.some((known) => known.itemId === weapon.itemId)) {
      suggestion.weapons.push({ itemId: weapon.itemId, name: weapon.name, rank: weapon.rank, calamity: weapon.calamity });
      suggestion.unlocksPotentials ||= weapon.calamity;
    }
    byTag.set(type.tag, suggestion);
  }

  const score = (suggestion: ProficiencySuggestion) => Math.max(...suggestion.weapons.map(weaponWeight));
  return [...byTag.values()]
    .map((suggestion) => ({ ...suggestion, weapons: [...suggestion.weapons].sort((a, b) => weaponWeight(b) - weaponWeight(a)) }))
    .sort((a, b) => score(b) - score(a) || b.weapons.length - a.weapons.length);
}
