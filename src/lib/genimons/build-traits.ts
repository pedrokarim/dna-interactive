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
// Les Traits portés par un Géniemon **dans un build**.
//
// Un Trait n'est pas un item du catalogue : il vit dans `data/genimons/traits.json`
// et se désigne par sa clé (`UI_PetEntry_Title03`), stable et unique. C'est donc
// elle qu'un build enregistre, jamais un libellé traduit.
//
// Le nombre d'emplacements n'est pas une constante : il se lit sur la créature.
// Une variante ordinaire en ouvre trois, une scintillante quatre – c'est tout
// ce qui les sépare, et le serveur ne doit pas accepter davantage.
// ---------------------------------------------------------------------------

/** Emplacements d'une variante ordinaire, au bout de ses ascensions. */
const ORDINARY_SLOTS = 3;
/** Une variante scintillante en ouvre un de plus. */
const PREMIUM_SLOTS = 4;

/** Borne absolue, pour un schéma qui valide avant de connaître la créature. */
export const MAX_GENIMON_TRAITS = PREMIUM_SLOTS;

/**
 * Combien de Traits ce Géniemon peut porter.
 *
 * Un identifiant inconnu renvoie la borne haute : c'est au contrôle
 * référentiel de rejeter la créature, pas à ce calcul de la deviner.
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
    // Résolu à la rareté visée : c'est l'or qu'un build cherche à atteindre.
    effect: formatTraitEffect(pickTraitText(trait.effect, lang), trait, rarity, locale),
    category: trait.category,
    rarity,
    icon: traitIconSrc(trait.category, rarity),
  };
}

/**
 * Nettoie une liste de clés venue d'un build : on retire l'inconnu et les
 * doublons, et on coupe au nombre d'emplacements réel de la créature.
 *
 * L'ordre est conservé : il porte une priorité de farm, pas un emplacement –
 * le jeu ne fixe pas quel Trait va dans quelle sphère.
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
