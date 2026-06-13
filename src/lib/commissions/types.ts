// ---------------------------------------------------------------------------
// Domaine Covert Commissions
// ---------------------------------------------------------------------------

/** Régions (ordre d'affichage). */
export const REGIONS = ["ASIA", "AMERICA", "EUROPE", "HMT", "SEA"] as const;
export type Region = (typeof REGIONS)[number];

/** Catégories de commission. */
export const CATEGORIES = ["character", "weapon", "demon_wedge"] as const;
export type Category = (typeof CATEGORIES)[number];

/** Objectifs connus (clés EN canoniques). */
export const OBJECTIVES = [
  "Capture",
  "Defense",
  "Dismantle",
  "Escort",
  "Excavation",
  "Expulsion",
  "Exploration",
  "Hedge",
  "Mediation",
  "Relocation",
  "Termination",
] as const;
export type Objective = (typeof OBJECTIVES)[number];

/**
 * Commissions « infinies » (∞) : missions sans fin, rejouables à difficulté
 * croissante. D'après Game8, seules Defense, Exploration et Excavation le sont
 * (propriété fixe du type, pas par rotation — l'embed source ne porte pas l'info).
 */
const INFINITE_OBJECTIVE_KEYS = new Set([
  "defense",
  "defence",
  "exploration",
  "excavation",
]);

export function isInfiniteObjective(objective: string): boolean {
  return INFINITE_OBJECTIVE_KEYS.has(objective.trim().toLowerCase());
}

/** État d'une rotation : par région, 3 objectifs par catégorie. */
export type RotationState = {
  /** sha256 du contenu normalisé — identité stable d'une rotation. */
  contentHash: string;
  /** Horodatage de la dernière mise à jour de la rotation (ISO). */
  updatedAt: string;
  regions: Record<Region, Record<Category, string[]>>;
};

/** Métadonnées de cadence pour le countdown client. */
export type RotationMeta = {
  /** Quand la rotation courante a commencé (ISO). */
  updatedAt: string | null;
  /** Prochaine MAJ attendue = prochaine heure pleine UTC (ISO). */
  nextRefreshAt: string;
  /** Période nominale du cycle (ms) — le bot édite toutes les heures. */
  periodMs: number;
};

// --- Libellés localisés ----------------------------------------------------

export const CATEGORY_LABELS: Record<Category, { en: string; fr: string }> = {
  character: { en: "Character", fr: "Personnage" },
  weapon: { en: "Weapon", fr: "Arme" },
  demon_wedge: { en: "Demon Wedge", fr: "Sceau démoniaque" },
};

/**
 * Objectifs EN → FR (libellés du client FR « Mandats scellés »).
 * Médiation/Hedge à reconfirmer sur le client FR ; fallback = EN.
 */
export const OBJECTIVE_FR: Record<Objective, string> = {
  Capture: "Capture",
  Defense: "Défense",
  Dismantle: "Démanteler",
  Escort: "Escorte",
  Excavation: "Excavation",
  Expulsion: "Expulsion",
  Exploration: "Exploration",
  Hedge: "Précaution",
  Mediation: "Médiation",
  Relocation: "Transfert",
  Termination: "Extermination",
};

export const REGION_LABELS: Record<Region, string> = {
  ASIA: "Asia",
  AMERICA: "America",
  EUROPE: "Europe",
  HMT: "HMT",
  SEA: "SEA",
};
