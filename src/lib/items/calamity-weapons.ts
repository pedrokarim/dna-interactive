import type { ItemRecord } from "@/lib/items/types";
import potentialsData from "@/data/weapons/calamity-potentials.json";

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

type PotentialsFile = Record<string, { weaponId: number; nodes: { level: number }[] }>;

/**
 * Nombre de nœuds de Potentiel (`HyperWeaponSkillTree`) par palier de Fusion de
 * calamité (0→5).
 *
 * Le décompte est **dérivé de l'extraction**, pas saisi à la main : ajouter une
 * arme de calamité au jeu suffit à le mettre à jour, sans risque d'oublier
 * cette table au passage.
 */
export const POTENTIAL_NODE_COUNTS_BY_LEVEL: Record<string, Record<number, number>> = Object.fromEntries(
  Object.entries(potentialsData as PotentialsFile).map(([weaponId, entry]) => {
    const counts: Record<number, number> = {};
    for (const node of entry.nodes) counts[node.level] = (counts[node.level] ?? 0) + 1;
    return [weaponId, counts];
  }),
);

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

/** L'arme a-t-elle un arbre de Potentiel connu ? Sert à décider d'afficher l'arbre. */
export function hasCalamityPotentialTree(weaponItemId: string): boolean {
  return POTENTIAL_NODE_COUNTS_BY_LEVEL[weaponItemId] !== undefined;
}

/** Total de Potentiels de l'arme (tous paliers), ou null si l'arbre est inconnu. */
export function potentialNodesTotal(weaponId: string): number | null {
  const counts = POTENTIAL_NODE_COUNTS_BY_LEVEL[weaponId];
  if (!counts) return null;
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

/**
 * Sentinelle du jeu pour « pas encore programmé » : les tables portent `99`
 * (`OpenVersion`) et `990` (`ReleaseVersion`) sur le contenu dont la sortie
 * n'est pas datée. Sans ce garde-fou, le formatage naïf annonce une « v9.9 »
 * qui n'existera jamais.
 */
export const UNSCHEDULED_OPEN_VERSION = 99;

/** Vrai quand la version d'ouverture est la sentinelle « non programmé ». */
export function isUnscheduledVersion(openVersion: number | null | undefined): boolean {
  return openVersion === UNSCHEDULED_OPEN_VERSION;
}

/**
 * `14` → `v1.4`. Rend `null` quand la version est absente **ou** non
 * programmée : à l'appelant de choisir le libellé qui convient à son contexte.
 */
export function formatOpenVersion(value: number | null | undefined): string | null {
  if (value == null || isUnscheduledVersion(value)) return null;
  if (value < 10) return `v${value}`;
  return `v${Math.floor(value / 10)}.${value % 10}`;
}
