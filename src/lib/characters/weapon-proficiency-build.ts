import { getItemByCategoryAndId } from "@/lib/items/catalog";
import { isCalamityWeapon } from "@/lib/items/calamity-weapons";
import type { ItemRecord } from "@/lib/items/types";
import type { CharacterBuild } from "@/lib/characters/builds";
import {
  isWeaponTypeTag,
  suggestProficienciesFor,
  type ProficiencySuggestion,
  type ProficiencyWeaponInput,
} from "@/lib/characters/weapon-proficiency";

const WEAPON_TYPE_KEY_PREFIX = "WeaponType_";

/**
 * Type de prédilection auquel une arme se rattache.
 *
 * Il ne se lit pas dans `ResourceSType` : une faux y est une `Scythe` alors
 * qu'elle compte comme arme d'hast. La clé `WeaponType_*` est celle que le jeu
 * compare à la prédilection du personnage.
 */
export function getWeaponProficiencyTag(item: Pick<ItemRecord, "typeCompatibility">): string | null {
  const key = (item.typeCompatibility?.textKeys ?? []).find((textKey) => textKey.startsWith(WEAPON_TYPE_KEY_PREFIX));
  if (!key) return null;
  const tag = key.slice(WEAPON_TYPE_KEY_PREFIX.length);
  return isWeaponTypeTag(tag) ? tag : null;
}

/** Maîtrises supplémentaires utiles à un build, d'après les armes qu'il conseille. */
export function suggestExtraProficiencies(charId: number, build: Pick<CharacterBuild, "weapons">): ProficiencySuggestion[] {
  const weapons: ProficiencyWeaponInput[] = [];
  for (const entry of [...build.weapons.melee, ...build.weapons.ranged]) {
    if (!entry.item) continue;
    const record = getItemByCategoryAndId("weapons", entry.item.itemId);
    if (!record) continue;
    weapons.push({
      itemId: entry.item.itemId,
      name: entry.item.name,
      rank: entry.rank,
      tag: getWeaponProficiencyTag(record),
      calamity: isCalamityWeapon(record),
    });
  }
  return suggestProficienciesFor(charId, weapons);
}
