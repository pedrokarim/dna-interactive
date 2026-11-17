import { getItemByCategoryAndId } from "@/lib/items/catalog";
import {
  formatTraitEffect,
  getAllTraits,
  pickTraitText,
  traitIconSrc,
  type GenimonTrait,
  type TraitCategory,
} from "@/lib/genimons/traits";

// ---------------------------------------------------------------------------
// Les Traits d'un Géniemon dans un build.
//
// Un Trait n'est pas un item du catalogue : il vit dans `data/genimons/traits.json`
// et se désigne par sa clé (`UI_PetEntry_Title03`), stable et unique. Un build
// enregistre cette clé, jamais un libellé traduit.
//
// Le nombre d'emplacements dépend de la créature : trois pour une variante
// ordinaire, quatre pour une scintillante (leur seule différence). Le serveur ne
// doit pas en accepter plus.
// ---------------------------------------------------------------------------

/** Emplacements d'une variante ordinaire, au bout de ses ascensions. */
const ORDINARY_SLOTS = 3;
/** Une variante scintillante en ouvre un de plus. */
const PREMIUM_SLOTS = 4;

/** Borne absolue, pour un schéma qui valide avant de connaître la créature. */
export const MAX_GENIMON_TRAITS = PREMIUM_SLOTS;

/**
 * Nombre de Traits que ce Géniemon peut porter.
 *
 * Id inconnu : on renvoie la borne haute, c'est le contrôle référentiel qui
 * rejette la créature.
 */
export function genimonTraitSlots(itemId: string): number {
  const item = getItemByCategoryAndId("genimons", itemId);
  if (!item) return PREMIUM_SLOTS;
  return item.variants?.isPremium ? PREMIUM_SLOTS : ORDINARY_SLOTS;
}

const BY_KEY = new Map<string, GenimonTrait>(getAllTraits().map((t) => [t.key, t]));

export function getTraitByKey(key: string): GenimonTrait | null {
  return BY_KEY.get(key) ?? null;
}

export function isKnownTraitKey(key: string): boolean {
  return BY_KEY.has(key);
}

/** Un Trait tel qu'un build l'affiche : nom traduit, glyphe, rareté visée. */
export interface BuildGenimonTrait {
  key: string;
  name: string;
  effect: string;
  category: TraitCategory | "unknown";
  /** La plus haute rareté à laquelle il existe : celle qu'on cherche à obtenir. */
  rarity: number;
  icon: string | null;
}

export function resolveBuildTrait(
  key: string,
  lang: string = "FR",
  /** Locale de la page, pour la mise en forme des nombres. */
  locale: string = "fr",
): BuildGenimonTrait | null {
  const trait = BY_KEY.get(key);
  if (!trait) return null;
  const rarity = Math.max(...trait.tiers.map((t) => t.rarity));
  return {
    key: trait.key,
    name: pickTraitText(trait.name, lang),
    // Effet à la rareté visée, l'or qu'un build cherche à obtenir.
    effect: formatTraitEffect(pickTraitText(trait.effect, lang), trait, rarity, locale),
    category: trait.category,
    rarity,
    icon: traitIconSrc(trait.category, rarity),
  };
}

/**
 * Nettoie les clés venues d'un build : on retire l'inconnu et les doublons, et on
 * coupe au nombre d'emplacements de la créature.
 *
 * L'ordre est gardé, c'est une priorité de farm (le jeu ne fixe pas quel Trait va
 * dans quelle sphère).
 */
export function sanitizeTraitKeys(itemId: string, keys: readonly string[] | undefined): string[] {
  if (!keys?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of keys) {
    if (!BY_KEY.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out.slice(0, genimonTraitSlots(itemId));
}
