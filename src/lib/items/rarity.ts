import { isCalamityWeapon } from "@/lib/items/calamity-weapons";
import { CALAMITY_RARITY, toRarityLevel, type RarityLevel } from "@/components/dna/rarity";
import type { ItemRecord } from "@/lib/items/types";

type RarityInput = Pick<ItemRecord, "stats" | "fields">;

/**
 * Niveau de rareté effectif d'un objet, pour le code couleur.
 *
 * `stats.rarity` plafonne à 5 dans les données : le palier 6 (rouge) du jeu
 * correspond aux armes de calamité (`WeaponSubType === "Hyper"`), qui portent
 * par ailleurs une rareté 5. On les remonte donc au palier 6.
 */
export function resolveItemRarity(item: RarityInput): RarityLevel | null {
  if (isCalamityWeapon(item)) return CALAMITY_RARITY;
  return toRarityLevel(item.stats?.rarity);
}
