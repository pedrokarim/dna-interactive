import type { ItemRecord } from "@/lib/items/types";

/**
 * Armes de calamité (Calamity Weapons / `UI_HyperWeapon`).
 * Signal technique : `WeaponSubType === "Hyper"` dans la table `Weapon`.
 * Voir research_data/docs/RECHERCHE_ARMES_CALAMITE.md pour le détail des données.
 */

/** Accent visuel des armes de calamité (crimson-bright du design system). */
export const CALAMITY_ACCENT_HEX = "#b5302a";

/** Une arme est une Arme de calamité si son sous-type technique est `Hyper`. */
export function isCalamityWeapon(item: Pick<ItemRecord, "fields">): boolean {
  return item.fields?.WeaponSubType === "Hyper";
}

/**
 * Nombre de nœuds de Potentiel (`HyperWeaponSkillTree`) débloqués par palier de
 * Fusion de calamité (0→5), pour les armes dont l'arbre est connu.
 * 10399 / 20298 (armes en acier) n'exposent pas d'arbre détaillé dans l'extraction.
 */
export const POTENTIAL_NODE_COUNTS_BY_LEVEL: Record<string, Record<number, number>> = {
  "weapons-10299": { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1 },
  "weapons-20599": { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1 },
};

/** Total cumulé de Potentiels connus débloqués jusqu'au palier `level` inclus. */
export function potentialNodesUnlocked(weaponId: string, level: number): number | null {
  const counts = POTENTIAL_NODE_COUNTS_BY_LEVEL[weaponId];
  if (!counts) return null;
  let total = 0;
  for (let current = 0; current <= level; current += 1) {
    total += counts[current] ?? 0;
  }
  return total;
}

/** Total de Potentiels de l'arme (tous paliers), ou null si l'arbre est inconnu. */
export function potentialNodesTotal(weaponId: string): number | null {
  const counts = POTENTIAL_NODE_COUNTS_BY_LEVEL[weaponId];
  if (!counts) return null;
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}
