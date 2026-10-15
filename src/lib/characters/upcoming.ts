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
  /**
   * Armes, rôle et stats conseillées tels que déclarés dans `BattleChar`. Vides
   * quand le jeu n'y met encore que des valeurs recopiées d'un autre personnage :
   * la fiche masque alors ces blocs plutôt que d'afficher des données fausses.
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
   * Visuels officiels recadrés (`public/assets/upcoming/`), quand le studio en a
   * publié : portrait 3:4 de la fiche et vignette carrée de la bande d'accueil.
   * Sans eux, le cartouche à l'initiale gravée tient lieu d'illustration.
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

// Vide entre deux annonces, et c'est l'état normal : Falsi y a vécu jusqu'à la
// 1.6, où le jeu a livré son nom et ses portraits. Sa vraie fiche a pris le
// relais sur la même URL, sans rien changer d'autre.
//
// Rhythm: Flamewrought (1.7) : les fichiers 1.6 la déclarent (`SpLise`, 4103,
// `ReleaseVersion = 170`), mais son entrée `BattleChar` est une ébauche recopiée
// de Rhythm (4101) : mêmes statistiques, armes Katana + Machinegun, nom pointé
// sur `UI_CHAR_NAME_4101`. Son arme annoncée est une grenade : ces valeurs-là
// ne sont donc pas reprises. Seul ce qui diffère de Rhythm est retenu comme
// donnée du jeu.
export const UPCOMING_CHARACTERS: UpcomingCharacter[] = [
  {
    slug: "rhythm-flamewrought",
    name: "Rhythm: Flamewrought",
    internalName: "SpLise",
    charId: 4103,
    subtitle: "En marche vers l'aube",
    subtitleEn: "First-Light Farer",
    element: "Thunder",
    rarity: 5,
    maxLevel: 80,
    campKey: "Diguo",
    campLabel: "Empire Hyperboréen",
    weaponTags: [],
    positioning: [],
    recommendAttr: [],
    portrait: "/assets/upcoming/rhythm-flamewrought-portrait.webp",
    avatar: "/assets/upcoming/rhythm-flamewrought-avatar.webp",
    // PV 1.7 : « Immersive Theatre – New Character Available: Rhythm: Flamewrought ».
    theatreNext: true,
    version: "1.7",
    versionName: "Towards the Dawn",
    bannerName: "Threads Between Reverie",
    skinCount: 2,
    skinNames: ["Veil In Shadows"],
    voiceActorEn: "Sophie Colquhoun",
    skillIds: [410301, 410302, 410303, 410304],
    skills: [],
    lore: [
      "Adjudante de l'Escorte à Icelake, Rhythm passait pour une soldate à part, toujours prête à rendre service aux habitants. Quand le bruit a couru qu'elle quittait l'uniforme, la plupart l'ont pris pour une rumeur : qui renoncerait à un grade gagné de haute lutte ?",
      "Elle mesurait sa vie à la discipline militaire, jusqu'à ce que des mensonges engloutissent l'un de ses proches. Comme Blues, bien d'autres étaient entrés dans la 6ᵉ Légion sur de fausses promesses ; les noms des listes n'étaient qu'une fraction des victimes.",
      "Rhythm s'est donné à elle-même une commission : mettre fin aux exactions de la Légion. Les Charons sont des citoyens de l'Empire, pas des sujets d'expérience. Elle frappe de porte en porte et, au milieu du deuil des autres, retrouve le sens qu'elle avait perdu.",
    ],
    loreSource: "Résumé des présentations officielles du personnage (« Path to Inner Light », « Art of Combat » et notes d'histoire).",
    facts: [
      { label: "Identifiant interne", value: "SpLise (4103)", confidence: "dataMined" },
      { label: "Fragments pour débloquer", value: "30", confidence: "dataMined" },
      { label: "« Flamewrought » en français", value: "Marqué par les flammes", confidence: "dataMined" },
      { label: "Obtention", value: "Gratuite via les Mandats scellés, ou fragments en boutique", confidence: "announced" },
      { label: "Arme de prédilection", value: "Blessed Burden (grenade)", confidence: "announced" },
      { label: "Date de sortie", value: "Avec la version 1.7, date pas encore annoncée", confidence: "announced" },
    ],
    sources: [
      { label: "Fichiers du jeu – Char.lua / BattleChar.lua (entrée 4103)" },
      { label: "Présentation officielle « Path to Inner Light »", url: "https://x.com/DNAbyss_EN/status/2109524467831414810" },
      { label: "Présentation officielle « Art of Combat »", url: "https://x.com/DNAbyss_EN/status/2109886853939909087" },
      { label: "PV officiel de la version 1.7", url: "https://x.com/DNAbyss_EN/status/2109464074065264792" },
    ],
  },
];

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
