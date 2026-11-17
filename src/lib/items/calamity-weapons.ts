import type { ItemRecord } from "@/lib/items/types";
import potentialsData from "@/data/weapons/calamity-potentials.json";

/**
 * Armes de calamité (Calamity Weapons / `UI_HyperWeapon`), repérées par
 * `WeaponSubType === "Hyper"` dans la table `Weapon`. Détail des données :
 * research_data/docs/RECHERCHE_ARMES_CALAMITE.md.
 */

/** Accent visuel des armes de calamité (crimson-bright du design system). */
export const CALAMITY_ACCENT_HEX = "#b5302a";

export function isCalamityWeapon(item: Pick<ItemRecord, "fields">): boolean {
  return item.fields?.WeaponSubType === "Hyper";
}

type PotentialsFile = Record<string, { weaponId: number; nodes: { level: number }[] }>;

/**
 * Nombre de nœuds de Potentiel (`HyperWeaponSkillTree`) par palier de Fusion de
 * calamité (0 à 5).
 *
 * Calculé depuis l'extraction : une nouvelle arme de calamité est prise en compte
 * sans rien saisir à la main.
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

/** Vrai si l'arbre de Potentiel de l'arme est connu (sinon on ne l'affiche pas). */
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
 * Valeur du jeu pour « pas encore programmé » : les tables mettent `99`
 * (`OpenVersion`) et `990` (`ReleaseVersion`) sur le contenu sans date de sortie.
 * Sans ce test, le formatage afficherait une « v9.9 ».
 */
export const UNSCHEDULED_OPEN_VERSION = 99;

/** Vrai quand la version d'ouverture est la sentinelle « non programmé ». */
export function isUnscheduledVersion(openVersion: number | null | undefined): boolean {
  return openVersion === UNSCHEDULED_OPEN_VERSION;
}

/**
 * `14` donne `v1.4`. `null` si la version est absente ou non programmée,
 * l'appelant choisit alors son libellé.
 */
export function formatOpenVersion(value: number | null | undefined): string | null {
  if (value == null || isUnscheduledVersion(value)) return null;
  if (value < 10) return `v${value}`;
  return `v${Math.floor(value / 10)}.${value % 10}`;
}
