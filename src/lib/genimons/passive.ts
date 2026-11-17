import { getItemByCategoryAndId, getItemTranslation } from "@/lib/items/catalog";

// ---------------------------------------------------------------------------
// Le passif d'un Géniemon, à son palier maximal.
//
// On choisit une créature pour son passif, donc une recommandation de build
// doit le montrer, en plus du nom et de l'icône.
//
// Le texte du jeu contient des jetons `#1`, `#2`… dont les valeurs sont dans
// `scaling.valuesByLevel`, indexées par niveau de compétence passive (1 à 4,
// débloqué par les ascensions). Rien à voir avec le niveau 1-60 de la
// créature. On renvoie le palier maximal, celui que vise un build.
//
// Pas de formatage des nombres ici. Sur les 56 créatures équipables, les 472
// valeurs vont de -0,2 à 0,15 : ce sont des taux. Les formater demande la
// locale de la page, que seul le composant connaît, donc on renvoie un gabarit
// et ses valeurs.
// ---------------------------------------------------------------------------

export interface GenimonPassive {
  /** Texte du jeu, jetons `#N` intacts. */
  template: string;
  /** Valeurs du palier maximal, par index de jeton. Ce sont des taux. */
  values: Record<string, number>;
  /** Palier atteint, et le plus haut possible. */
  level: number;
  maxLevel: number;
}

export function getGenimonPassive(itemId: string, lang: string = "FR"): GenimonPassive | null {
  const item = getItemByCategoryAndId("genimons", itemId);
  if (!item) return null;

  const template = getItemTranslation(item, lang, ["EN"]).passiveEffectsDescription;
  if (!template) return null;

  const levels = item.scaling?.availableLevels ?? [];
  const level = levels.length ? Math.max(...levels) : (item.scaling?.defaultLevel ?? 1);
  const values = item.scaling?.valuesByLevel?.[String(level)] ?? {};

  return {
    template,
    values,
    level,
    maxLevel: item.scaling?.maxLevel ?? level,
  };
}
