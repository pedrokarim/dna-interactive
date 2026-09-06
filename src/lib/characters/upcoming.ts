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

export const UPCOMING_CHARACTERS: UpcomingCharacter[] = [
  {
    slug: "falsi",
    name: "Falsi",
    internalName: "Falu",
    charId: 3104,
    subtitle: "Cœur forgé en lame",
    subtitleEn: "A Heart Tempered into a Blade",
    element: "Fire",
    rarity: 5,
    maxLevel: 80,
    campKey: "Diguo",
    campLabel: "Empire Hyperboréen",
    weaponTags: ["Dualblade", "Cannon"],
    positioning: ["DPS", "SkillDPS"],
    recommendAttr: ["ATK_Fire", "SkillIntensity", "SkillEfficiency", "SkillSustain"],
    baseStats: { atk: 21, def: 288, maxHp: 96, maxEs: 96, maxSp: 180 },
    growthCurves: { atk: "ATKS", def: "DEFS", maxHp: "MaxHpS", maxEs: "MaxESS" },
    version: "1.6",
    versionName: "Paradise's 22nd White Bunny",
    releaseDate: "2026-09-08",
    bannerName: "Where the Long Road Leads",
    skinCount: 2,
    skinNames: ["Stalking Silence"],
    voiceActorEn: "Rae Lim",
    ascensionItems: { thought: "Thought: Falsi", sigil: "Sigil: Falsi" },
    skillIds: [310401, 310402, 310403, 310404],
    skills: [
      {
        name: "Nightmeld",
        slot: "Skill1",
        description:
          "Entre en état d'Embuscade en consommant de la Santé mentale. Tant que l'état tient, la compétence est remplacée par Shadowpierce.",
        confidence: "community",
      },
      {
        name: "Abyss Descent",
        slot: "Skill2",
        description:
          "Marque jusqu'à cinq ennemis comme Cibles d'exécution et fait passer Falsi en état de Bourreau.",
        confidence: "community",
      },
      {
        name: "Executioner",
        slot: "Passive",
        description:
          "Augmente la Résolution, convertit l'ATQ en PV max, et consomme des PV max pour ajouter des dégâts sur les attaques portées aux doubles lames.",
        confidence: "community",
      },
    ],
    lore: [
      "Falsi sert l'Empire Hyperboréen comme adjudante de Fulvis, à la tête d'une unité des Narvals. Les archives du jeu la désignent tantôt « Capitaine », tantôt « Officier » selon les témoignages.",
      "Elle apparaît au cœur de l'affaire de haute trahison Lonza : c'est elle qui s'empare de l'enregistrement laissé par Avar, pièce maîtresse du dossier, récupéré dans la salle de commande centrale peu avant l'explosion.",
      "D'après le témoignage du soldat Calem, elle a été vue pour la dernière fois hors de la forteresse. Son pistolet, taché de sang, a été retrouvé sur la rive.",
    ],
    facts: [
      { label: "Identifiant interne", value: "Falu (3104)", confidence: "dataMined" },
      { label: "Éléments d'ascension", value: "Fragment de pensée · Emblème", confidence: "dataMined" },
      { label: "Fragments pour débloquer", value: "30", confidence: "dataMined" },
      { label: "Chapitre", value: "Chapitre 7 – Ada et Falsi, région d'Arcano", confidence: "community" },
      { label: "Arme signature", value: "Stifled Howl (Théâtre immersif)", confidence: "community" },
    ],
    sources: [
      { label: "Fichiers du jeu – Char.lua / BattleChar.lua (entrée 3104)" },
      { label: "Fichiers du jeu – TextMap (UI_CHAR_NAME_3104, UI_CHAR_SUBTITLE_3104)" },
      { label: "Compte officiel du jeu", url: "https://x.com/DNAbyss_EN" },
    ],
  },
];

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
