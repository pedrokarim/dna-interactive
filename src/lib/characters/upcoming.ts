import type { ElementKey } from "@/components/dna/elements";

/**
 * Personnages annoncés mais pas encore extractibles.
 *
 * Le jeu déclare une partie de ses personnages plusieurs versions à l'avance :
 * on trouve leur fiche technique complète dans `Char.lua` et `BattleChar.lua`
 * bien avant que les textures ne soient livrées. Le pipeline d'extraction les
 * écarte volontairement (règle « aucun portrait livré = non sorti », cf.
 * `research_data/extract-characters.ts`), sans quoi la liste afficherait des
 * cartes cassées.
 *
 * Ce module comble l'entre-deux : une fiche « à venir », curée à la main, qui
 * n'affiche que ce qui est réellement établi. Elle vit sur la MÊME URL que la
 * future fiche complète (`/characters/<slug>`), branchée dans la route
 * dynamique juste avant le `notFound()`. Dès que le personnage sort et passe
 * dans `characters.json`, la vraie fiche prend le dessus toute seule – il ne
 * reste qu'à supprimer l'entrée ci-dessous.
 *
 * Deux niveaux de fiabilité, jamais mélangés à l'affichage :
 *   `dataMined`  – lu directement dans les fichiers du jeu, donc sûr
 *   `announced`  – communiqué officiellement (date, bannière, doubleurs)
 *   `community`  – connu de la communauté, à confirmer à la sortie
 */

export type UpcomingConfidence = "dataMined" | "announced" | "community";

export type UpcomingFact = {
  label: string;
  value: string;
  confidence: UpcomingConfidence;
};

export type UpcomingSkill = {
  name: string;
  /** Type de compétence tel que le jeu le nomme (Skill1, Skill2, Passive, Ultra…). */
  slot: string;
  description: string;
  confidence: UpcomingConfidence;
};

export type UpcomingCharacter = {
  /** Slug d'URL – doit être celui que produira `getCharacterSlug` à la sortie. */
  slug: string;
  name: string;
  /** Nom interne dans les fichiers du jeu (`GUIPathVariable`). */
  internalName: string;
  charId: number;
  subtitle: string;
  subtitleEn: string;
  element: ElementKey;
  rarity: number;
  maxLevel: number;
  campKey: string;
  campLabel: string;
  weaponTags: string[];
  positioning: string[];
  recommendAttr: string[];
  /** Statistiques de base niveau 1 et courbes de croissance (`ATKS`, `DEFS`…). */
  baseStats: { atk: number; def: number; maxHp: number; maxEs: number; maxSp: number };
  growthCurves: { atk: string; def: string; maxHp: string; maxEs: string };
  /** Version de sortie telle que déclarée par le jeu (`ReleaseVersion` / 100). */
  version: string;
  versionName: string;
  /** Date de sortie ISO `AAAA-MM-JJ`, si officiellement annoncée. */
  releaseDate?: string;
  bannerName?: string;
  skinCount: number;
  skinNames?: string[];
  voiceActorEn?: string;
  ascensionItems: { thought: string; sigil: string };
  /** Identifiants des compétences déclarées dans `BattleChar.SkillList`. */
  skillIds: number[];
  skills: UpcomingSkill[];
  lore: string[];
  facts: UpcomingFact[];
  /** Sources vérifiables, affichées telles quelles en bas de fiche. */
  sources: { label: string; url?: string }[];
};

// Vide entre deux annonces, et c'est l'état normal : Falsi y a vécu jusqu'à la
// 1.6, où le jeu a livré son nom et ses portraits. Sa vraie fiche a pris le
// relais sur la même URL, sans rien changer d'autre.
export const UPCOMING_CHARACTERS: UpcomingCharacter[] = [];

const bySlug = new Map(UPCOMING_CHARACTERS.map((c) => [c.slug, c] as const));

/** Personnage à venir correspondant au segment d'URL, ou `null`. */
export function getUpcomingCharacter(slug: string): UpcomingCharacter | null {
  return bySlug.get(slug.trim().toLowerCase()) ?? null;
}

/**
 * Statistique à un niveau donné : `base × multiplicateur de courbe`.
 * Même formule que les fiches complètes ; `MaxSp` n'a pas de courbe.
 */
export function statAtLevel(base: number, curve: Record<string, number> | undefined, level: number): number {
  const multiplier = curve?.[level] ?? 1;
  return Math.round(base * multiplier);
}
