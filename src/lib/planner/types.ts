/**
 * Planificateur de farm : types partagés entre les données extraites
 * (`src/data/planner/`), le calcul pur (`compute.ts`) et l'interface.
 * Cadrage : `docs/cadrage-planificateur-farm.md`.
 */

/**
 * Clé d'objet : `res:<id>`, `mod:<id>`, `draft:<id>`, `weapon:<id>`, ou une
 * réserve d'XP virtuelle (`xp:character`, `xp:weapon`). Jamais d'id nu : les
 * identifiants de ressources et de wedges se recouvrent.
 */
export type MaterialKey = string;
export type Cost = { key: MaterialKey; num: number };

export const CREDITS_KEY = "res:101";
export const MOD_COIN_KEY = "res:102";
export const XP_KEYS = { character: "xp:character", weapon: "xp:weapon" } as const;
export type XpPool = keyof typeof XP_KEYS;

// ---------------------------------------------------------------------------
// Données du jeu (forme de `src/data/planner/progression.json`)
// ---------------------------------------------------------------------------

export type BreakStep = { level: number; costs: Cost[] };
/** Passage du niveau n au niveau n+1 d'une compétence (index n-1). */
export type SkillStep = { breaks: number; costs: Cost[] };

export type CharacterProgression = {
  breaks: BreakStep[];
  /** Emplacement de compétence des builds (1 à 3) → paliers. */
  skills: Record<string, SkillStep[]>;
  /** Intron n (index n-1) ; le 7ᵉ n'existe que pour certains persos. */
  introns: Cost[][];
};

export type WeaponProgression = {
  breaks: BreakStep[];
  /** Affinage des armes de calamité (index n-1) ; vide pour les autres. */
  refinement: Cost[][];
};

export type WedgeProgression = {
  rarity: number;
  /** Rang atteignable sans étoile. */
  maxLevel: number;
  /** Étoiles possibles : chacune ajoute un rang au-delà de `maxLevel`. */
  starMax: number;
  /** Exemplaires du wedge consommés par l'étoile n (index n-1). */
  starCopies: number[];
  /** Ressource universelle acceptée à la place des exemplaires. */
  starResource: MaterialKey | null;
};

export type Recipe = {
  /** Le plan de forge, consommé à chaque fabrication. */
  draft: MaterialKey;
  quantity: number;
  /** Ingrédients et monnaies, pour une fabrication. */
  ingredients: Cost[];
  durationSec: number;
};

export type ProgressionData = {
  maxLevel: number;
  /** XP pour passer du niveau n au niveau n+1 (index n-1). */
  characterXp: number[];
  weaponXp: number[];
  /** Objets d'XP, du plus gros au plus petit. */
  characterXpItems: { key: MaterialKey; xp: number }[];
  weaponXpItems: { key: MaterialKey; xp: number }[];
  /** Clé : `charId` du jeu (un perso multi-élément en a un par élément). */
  characters: Record<string, CharacterProgression>;
  /** Clé : id du site (`weapons-10402`). */
  weapons: Record<string, WeaponProgression>;
  /** Coût du rang n (index n-1), par rareté (`"1"` à `"5"`). */
  modLevels: Record<string, Cost[]>[];
  /** Clé : id du site (`mods-51758`). */
  mods: Record<string, WedgeProgression>;
  /** Clé : objet produit (`weapon:20503`, `mod:51002`, `res:20027`). */
  recipes: Record<MaterialKey, Recipe>;
};

// ---------------------------------------------------------------------------
// Jeu de données localisé, tel que l'interface le reçoit
// ---------------------------------------------------------------------------

export type PlannerMaterial = { name: string; icon: string | null; rarity: number; href: string | null };

export type PlannerActivity = { name: string; focus: string | null; levels: [number, number] };

export type PlannerSources = {
  activities: Record<string, PlannerActivity>;
  access: Record<string, string>;
  byMaterial: Record<MaterialKey, { activities: string[]; access: string[] }>;
};

export type PlannerCharacterOption = {
  id: string;
  name: string;
  avatar: string | null;
  rarity: number | null;
  /** Un élément par variante ; `charId` désigne ses coûts. */
  elements: { key: string | null; label: string; charId: number }[];
  skills: { index: number; name: string }[];
};

export type PlannerItemOption = { id: string; name: string; icon: string | null; rarity: number | null };

export type PlannerDataset = {
  progression: ProgressionData;
  materials: Record<MaterialKey, PlannerMaterial>;
  sources: PlannerSources;
  catalog: {
    characters: PlannerCharacterOption[];
    weapons: PlannerItemOption[];
    wedges: PlannerItemOption[];
  };
};

// ---------------------------------------------------------------------------
// Plan de l'utilisateur
// ---------------------------------------------------------------------------

export type CharacterState = { level: number; breaks: number; skills: [number, number, number]; intron: number };
export type WeaponState = { level: number; breaks: number; refinement: number };

/** Build qui a apporté un objectif (pour le regrouper et le retirer d'un bloc). */
export type GoalOrigin = { buildKey: string; label: string };

type GoalBase = { id: string; paused?: boolean; origins?: GoalOrigin[] };

export type CharacterGoal = GoalBase & {
  kind: "character";
  targetId: string;
  element: string | null;
  charId: number;
  current: CharacterState;
  target: CharacterState;
};

/** La possession de l'arme se lit dans le stock (`weapon:<id>`). */
export type WeaponGoal = GoalBase & {
  kind: "weapon";
  targetId: string;
  current: WeaponState;
  target: WeaponState;
};

/**
 * Les exemplaires possédés se lisent dans le stock (`mod:<id>`), tous au rang
 * `current`. `demand` garde ce que chaque build demande, pour recalculer
 * `copies` quand un build entre ou sort du plan.
 */
export type WedgeGoal = GoalBase & {
  kind: "wedge";
  targetId: string;
  copies: number;
  current: number;
  target: number;
  demand?: Record<string, { characterId: string; count: number }>;
};

export type PlannerGoal = CharacterGoal | WeaponGoal | WedgeGoal;

export type CraftChoice = "farm" | "craft";

export type PlannerState = {
  version: 1;
  goals: PlannerGoal[];
  inventory: Record<MaterialKey, number>;
  craftChoices: Record<MaterialKey, CraftChoice>;
};

// ---------------------------------------------------------------------------
// Résultat du calcul
// ---------------------------------------------------------------------------

export type PlanStep =
  | { kind: "level"; from: number; to: number }
  | { kind: "break"; to: number }
  | { kind: "skill"; index: number; to: number }
  | { kind: "intron"; to: number }
  | { kind: "refine"; to: number }
  | { kind: "acquire"; count: number }
  | { kind: "rank"; to: number; star: boolean };

export type GoalStep = {
  /** Unique dans l'objectif : sert de clé React et de cible de « Fait ». */
  id: string;
  step: PlanStep;
  costs: Cost[];
  /** Faisable dans l'état actuel (ordre du jeu, prérequis remplis). */
  available: boolean;
};

export type MaterialLine = {
  key: MaterialKey;
  required: number;
  /** Pris dans le stock. */
  owned: number;
  /** Obtenu en fabriquant (ses ingrédients sont des lignes à part). */
  crafted: number;
  missing: number;
  craftable: boolean;
  crafting: boolean;
  /** Objectifs qui en ont besoin directement. */
  usedBy: string[];
  /** Objets fabriqués qui en ont besoin comme ingrédient. */
  forCrafting: MaterialKey[];
};

export type GoalProgress = { ratio: number; ready: boolean; steps: GoalStep[] };

export type SourceGroup =
  | { kind: "activity"; id: string; keys: MaterialKey[] }
  | { kind: "access"; id: string; keys: MaterialKey[] }
  | { kind: "unknown"; keys: MaterialKey[] };

export type PlanWarning =
  | { kind: "raisedForSkill"; goalId: string; skill: number; level: number; breaks: number }
  | { kind: "missingData"; goalId: string };

export type PlanResult = {
  lines: MaterialLine[];
  byGoal: Record<string, GoalProgress>;
  sources: SourceGroup[];
  warnings: PlanWarning[];
};
