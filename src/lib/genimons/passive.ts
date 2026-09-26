import { getItemByCategoryAndId, getItemTranslation } from "@/lib/items/catalog";

// ---------------------------------------------------------------------------
// Le **passif** d'un Géniemon, résolu à son palier maximal.
//
// On choisit une créature pour son passif : c'est lui qu'il faut montrer sur
// une recommandation de build, pas seulement un nom et une icône.
//
// Le texte du jeu porte des jetons `#1`, `#2`… dont les valeurs vivent dans
// `scaling.valuesByLevel`, indexées par **niveau de compétence passive** (1 à 4,
// ouvert par les ascensions) – à ne pas confondre avec le niveau 1-60 de la
// créature. On expose le palier maximal : c'est l'état visé par un build.
//
// Les nombres ne sont **pas** formatés ici : relevé sur les 56 créatures
// équipables, les 472 valeurs tiennent entre -0,2 et 0,15, ce sont donc des
// taux. Les mettre en forme demande la locale de la page, qui appartient au
// composant – d'où un gabarit et ses valeurs, jamais une chaîne toute faite.
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
