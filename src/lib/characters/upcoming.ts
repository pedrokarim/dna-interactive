import type { ElementKey } from "@/components/dna/elements";

/**
 * Personnages annoncés mais pas encore extractibles.
 *
 * Le jeu déclare certains personnages plusieurs versions à l'avance : leur fiche
 * technique est complète dans `Char.lua` et `BattleChar.lua` bien avant que les
 * textures arrivent. L'extraction les écarte exprès (« aucun portrait livré = non
 * sorti », cf. `research_data/extract-characters.ts`), sinon la liste aurait des
 * cartes cassées.
 *
 * Ici on tient à la main une fiche « à venir » qui n'affiche que ce qui est
 * établi. Elle vit sur la même URL que la future fiche (`/characters/<slug>`),
 * branchée dans la route dynamique juste avant le `notFound()`. Quand le perso
 * sort et arrive dans `characters.json`, la vraie fiche passe devant toute seule :
 * il ne reste qu'à supprimer l'entrée ci-dessous.
 *
 * Trois niveaux de fiabilité, jamais mélangés à l'affichage :
 *   `dataMined` : lu dans les fichiers du jeu, donc sûr
 *   `announced` : annoncé officiellement (date, bannière, doubleurs)
 *   `community` : connu de la communauté, à confirmer à la sortie
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
  /** Slug d'URL : doit être celui que donnera `getCharacterSlug` à la sortie. */
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
  /**
   * Armes, rôle et stats conseillées déclarés dans `BattleChar`. Vides tant que
   * le jeu n'y met que des valeurs copiées d'un autre perso : la fiche masque
   * alors ces blocs.
   */
  weaponTags: string[];
  positioning: string[];
  recommendAttr: string[];
  /**
   * Statistiques de base niveau 1 et courbes de croissance (`ATKS`, `DEFS`…).
   * Absentes tant que les fichiers du jeu ne portent que des valeurs provisoires.
   */
  baseStats?: { atk: number; def: number; maxHp: number; maxEs: number; maxSp: number };
  growthCurves?: { atk: string; def: string; maxHp: string; maxEs: string };
  /**
   * Visuels officiels recadrés (`public/assets/upcoming/`) quand le studio en a
   * publié : portrait 3:4 pour la fiche, vignette carrée pour la bande d'accueil.
   * Sans eux, on affiche le cartouche avec l'initiale gravée.
   */
  portrait?: string;
  avatar?: string;
  /**
   * Annoncé officiellement comme prochaine récompense du théâtre immersif, sans
   * dates. Le suivi `/theatre` l'affiche dans la case « Prochaine » tant que la
   * vraie rotation n'est pas dans les données du jeu.
   */
  theatreNext?: boolean;
  /** Version de sortie telle que déclarée par le jeu (`ReleaseVersion` / 100). */
  version: string;
  versionName: string;
  /** Date de sortie ISO `AAAA-MM-JJ`, si officiellement annoncée. */
  releaseDate?: string;
  bannerName?: string;
  skinCount: number;
  skinNames?: string[];
  voiceActorEn?: string;
  /** Noms des objets d'ascension, absents tant que le jeu ne les a pas traduits. */
  ascensionItems?: { thought: string; sigil: string };
  /** Identifiants des compétences déclarées dans `BattleChar.SkillList`. */
  skillIds: number[];
  skills: UpcomingSkill[];
  lore: string[];
  /** D'où vient le dossier ; par défaut, les dialogues et archives du jeu. */
  loreSource?: string;
  facts: UpcomingFact[];
  /** Sources vérifiables, affichées telles quelles en bas de fiche. */
  sources: { label: string; url?: string }[];
};

// Vide entre deux annonces, c'est normal. Falsi y était jusqu'à la 1.6, Rhythm:
// Flamewrought jusqu'à la 1.7, quand le jeu a livré leur nom et leurs portraits ;
// la vraie fiche a alors pris le relais sur la même URL.
export const UPCOMING_CHARACTERS: UpcomingCharacter[] = [];

const bySlug = new Map(UPCOMING_CHARACTERS.map((c) => [c.slug, c] as const));

/** Personnage annoncé pour la prochaine rotation du théâtre immersif, s'il y en a un. */
export const ANNOUNCED_THEATRE_NEXT: UpcomingCharacter | null = UPCOMING_CHARACTERS.find((c) => c.theatreNext) ?? null;

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
