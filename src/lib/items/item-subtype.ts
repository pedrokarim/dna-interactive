import { getWeaponType, weaponTypeName } from "@/lib/characters/weapon-proficiency";
import type { ItemRecord } from "@/lib/items/types";

/**
 * Sous-type d'un objet, tel que la liste le filtre et l'affiche.
 *
 * Pour une arme, c'est son type d'arme (`fields.WeaponTypeKey`), celui que le
 * jeu montre : `ResourceSType` est un code interne qui sépare des armes que le
 * jeu range ensemble (`Broadsword` et `Claymore` sont toutes deux des espadons,
 * `Scythe` des armes d'hast) et dont les noms ne sont pas ceux du jeu
 * (`Crossbow` pour les doubles pistolets, `Machinegun` pour les fusils d'assaut).
 * Les autres objets n'ont pas de type d'arme : leur `ResourceSType` reste la clé.
 */
export function getItemSubTypeKey(item: ItemRecord): string | null {
  const weaponTypeKey = item.fields.WeaponTypeKey;
  if (typeof weaponTypeKey === "string" && weaponTypeKey.startsWith("WeaponType_")) {
    return weaponTypeKey.slice("WeaponType_".length);
  }
  const resourceSType = item.fields.ResourceSType;
  return typeof resourceSType === "string" && resourceSType.trim().length > 0 ? resourceSType.trim() : null;
}

/**
 * Anciennes valeurs du filtre, quand il portait sur `ResourceSType` : un lien
 * partagé ou un filtre mémorisé avec `Broadsword` ne doit pas donner une liste vide.
 */
const LEGACY_SUBTYPE_ALIASES: Record<string, string> = {
  Broadsword: "Claymore",
  Scythe: "Polearm",
};

export function normalizeItemSubTypeFilter(value: string): string {
  return LEGACY_SUBTYPE_ALIASES[value] ?? value;
}

/** Nom affiché d'un sous-type : le nom officiel du type d'arme dans la langue voulue, sinon la clé. */
export function itemSubTypeLabel(key: string, lang: string): string {
  const weaponType = getWeaponType(key);
  return weaponType ? weaponTypeName(weaponType, lang) : key;
}
