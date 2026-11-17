/**
 * Code couleur de rareté du jeu.
 *
 * Couleurs prélevées sur les textures d'interface extraites (FModel) :
 * `T_Item_Hover_N` (dégradé de survol de la case), `T_Com_TipsTextColor_N`
 * (couleur du nom) et `T_Com_TipsLineColor_N` (filet séparateur). Relevé
 * complet et chemins des assets dans `docs/rarete-couleurs-jeu.md`.
 *
 * Le jeu désature ses teintes (vert sauge, bleu ardoise). Ne pas les remplacer
 * par des couleurs Tailwind saturées : on perdrait la ressemblance avec
 * l'interface du jeu.
 */

export type RarityLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type RarityMeta = {
  level: RarityLevel;
  /** Nom de la teinte côté jeu (cf. `T_Item_Appearance_*`). */
  gameName: "Grey" | "Green" | "Blue" | "Purple" | "Gold" | "Red";
  /** Teinte principale, au centre du dégradé de survol. */
  hex: string;
  /** Couleur du nom de l'objet. */
  textHex: string;
  /** Couleur du filet séparateur. */
  lineHex: string;
};

export const RARITIES: Record<RarityLevel, RarityMeta> = {
  1: { level: 1, gameName: "Grey",   hex: "#939393", textHex: "#bac1c3", lineHex: "#8c8d8c" },
  2: { level: 2, gameName: "Green",  hex: "#7cac7c", textHex: "#a1edd1", lineHex: "#4f876b" },
  3: { level: 3, gameName: "Blue",   hex: "#859bce", textHex: "#b2dfff", lineHex: "#555587" },
  4: { level: 4, gameName: "Purple", hex: "#a878ae", textHex: "#db74c6", lineHex: "#84517b" },
  5: { level: 5, gameName: "Gold",   hex: "#ba9869", textHex: "#ffe4a0", lineHex: "#c0965b" },
  6: { level: 6, gameName: "Red",    hex: "#d6616b", textHex: "#d96068", lineHex: "#a4545a" },
};

export const RARITY_LEVELS = [1, 2, 3, 4, 5, 6] as const;

/**
 * Palier « calamité ». Jamais dans `stats.rarity`, qui s'arrête à 5 : on le
 * déduit de `WeaponSubType === "Hyper"` dans `resolveItemRarity`
 * (`src/lib/items/rarity.ts`).
 */
export const CALAMITY_RARITY: RarityLevel = 6;

/** Rareté maximale portée par les données (`stats.rarity`). */
export const MAX_DATA_RARITY = 5;

export function isRarityLevel(value: unknown): value is RarityLevel {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 6;
}

/** Normalise une valeur brute en niveau de rareté, ou `null` si hors échelle. */
export function toRarityLevel(value: number | null | undefined): RarityLevel | null {
  return isRarityLevel(value) ? value : null;
}

/**
 * Valeur de `data-rarity` sur l'élément stylé : "1" à "6", ou "none" quand
 * l'objet n'a pas de rareté (le jeu a une texture pour ça, `NoQuality`). Va
 * avec les classes `dna-rarity-*` de `globals.css`.
 */
export function rarityAttr(level: RarityLevel | null | undefined): string {
  return level ? String(level) : "none";
}
