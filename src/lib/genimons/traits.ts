import traitsData from "@/data/genimons/traits.json";

// ---------------------------------------------------------------------------
// Traits de Géniemon.
//
// Un Trait est un affixe greffé sur un Géniemon dans un emplacement ouvert par
// l'ascension. Les 29 traits existent chacun en plusieurs raretés, et trois
// exemplaires d'une rareté en donnent un de la rareté au-dessus.
//
// Les catégories viennent du jeu lui-même (l'icône de chaque trait porte sa
// famille) : on ne les a pas inventées, et il ne faut pas en créer d'autres.
// ---------------------------------------------------------------------------

export const TRAIT_CATEGORIES = ["battle", "base", "speed", "world"] as const;
export type TraitCategory = (typeof TRAIT_CATEGORIES)[number];

export interface TraitTier {
  rarity: number;
  entryId: number;
  /** Nombre d'exemplaires à fusionner pour obtenir `fuseInto`. */
  fuseCount: number | null;
  fuseInto: number | null;
}

export interface GenimonTrait {
  key: string;
  category: TraitCategory | "unknown";
  battlePetId: number;
  /** Attribut du jeu touché (`ATK`, `DropDistance`…), utile pour recouper. */
  attributes: string[];
  name: Record<string, string>;
  effect: Record<string, string>;
  tiers: TraitTier[];
  /** Un trait qui n'existe qu'en or ne s'obtient pas par fusion. */
  goldOnly: boolean;
}

const ALL = (traitsData as { traits: GenimonTrait[] }).traits;

/**
 * Texte dans la langue demandée, avec repli sur l'anglais.
 *
 * Le repli n'est pas une précaution de style : le jeu ne livre pas l'allemand
 * sur une partie des traits, et l'afficher vide serait pire que de montrer
 * l'anglais.
 */
export function pickTraitText(text: Record<string, string>, lang: string): string {
  const upper = lang.toUpperCase();
  return text[upper] ?? text.EN ?? text.FR ?? Object.values(text)[0] ?? "";
}

/**
 * Effet d'un Trait, prêt à afficher.
 *
 * Les descriptions portent un jeton `#1` à la place du chiffre : la valeur n'est
 * pas dans les données de jeu lisibles, elle est résolue ailleurs, et elle varie
 * de toute façon d'une rareté à l'autre. Laissé tel quel, `+#1` ressemble à un
 * gabarit non substitué ; les points de suspension se lisent comme ce qu'ils
 * sont, une valeur qui dépend de la rareté.
 */
export function formatTraitEffect(text: string): string {
  return text.replace(/#\d+/g, "…");
}

/** Tous les traits d'une catégorie, triés par nom dans la langue demandée. */
export function getTraitsByCategory(category: TraitCategory, lang: string): GenimonTrait[] {
  return ALL.filter((t) => t.category === category).sort((a, b) =>
    pickTraitText(a.name, lang).localeCompare(pickTraitText(b.name, lang)),
  );
}

export function getAllTraits(): GenimonTrait[] {
  return ALL;
}

/** Raretés d'un trait, de la plus basse à la plus haute. */
export function traitRarities(trait: GenimonTrait): number[] {
  return trait.tiers.map((t) => t.rarity).sort((a, b) => a - b);
}

/**
 * Combien d'exemplaires de la rareté la plus basse pour en obtenir un de la
 * plus haute. Trois par palier, donc neuf quand le trait a trois raretés.
 */
export function fusionCostFromLowest(trait: GenimonTrait): number | null {
  const steps = trait.tiers.filter((t) => t.fuseCount && t.fuseInto);
  if (steps.length === 0) return null;
  return steps.reduce((total, step) => total * (step.fuseCount ?? 1), 1);
}

// ---------------------------------------------------------------------------
// Icônes.
//
// Le jeu dessine un glyphe par catégorie, décliné dans la couleur de la rareté.
// La correspondance rareté → couleur est **relevée dans les données**, pas
// choisie : 3 = bleu, 4 = violet, 5 = or. Les fichiers sont donc nommés sur la
// rareté, qui est ce que porte `TraitTier`, et non sur la couleur.
//
// Le jeu livre aussi un gris et un vert, qu'aucun trait n'utilise : ils ne sont
// pas embarqués.
// ---------------------------------------------------------------------------

const ICON_DIR = "/assets/genimons/traits";
const ICON_RARITIES = new Set([3, 4, 5]);

/** Glyphe neutre d'une catégorie, pour un titre de section. */
export function categoryIconSrc(category: TraitCategory): string {
  return `${ICON_DIR}/${category}.png`;
}

/** Glyphe d'un trait à une rareté donnée. `null` hors des raretés connues. */
export function traitIconSrc(category: TraitCategory | "unknown", rarity: number): string | null {
  if (category === "unknown" || !ICON_RARITIES.has(rarity)) return null;
  return `${ICON_DIR}/${category}-${rarity}.png`;
}

export interface TraitCategoryCount {
  category: TraitCategory;
  count: number;
}

export function countTraitsByCategory(): TraitCategoryCount[] {
  return TRAIT_CATEGORIES.map((category) => ({
    category,
    count: ALL.filter((t) => t.category === category).length,
  }));
}
