import draftsRecipesJson from "@/data/items/drafts.recipes.json";

export type DraftItemSourceCategory =
  | "mods"
  | "resources"
  | "weapons"
  | "char-accessories"
  | "unknown";

export interface DraftItemIcon {
  gamePath: string | null;
  publicPath: string | null;
  placeholderPath: string | null;
}

export interface DraftItemReference {
  type: string;
  id: number;
  quantity: number;
  sourceCategory: DraftItemSourceCategory;
  href: string | null;
  rarity: number | null;
  names: Record<string, string | null>;
  descriptions: Record<string, string | null>;
  icon: DraftItemIcon;
  metadata: Record<string, string | number | boolean | null | number[]>;
}

export interface DraftRecipeCrafting {
  durationSec: number | null;
  batch: boolean;
  rarity: number | null;
  foundryCostByCoinType: Record<string, number>;
  resourceToCoinType: number | null;
  resourceValue: number | null;
  accessKeys: string[];
  releaseVersion: number | null;
  openVersion: number | null;
  showInBag: number | null;
  showInDraftArchive: boolean;
}

export interface DraftRecipeRecord {
  id: string;
  draftId: number;
  productType: string;
  productId: number;
  productQuantity: number;
  icon: DraftItemIcon;
  product: DraftItemReference;
  ingredients: DraftItemReference[];
  crafting: DraftRecipeCrafting;
  fields: Record<string, string | number | boolean | null | number[]>;
}

export interface DraftRecipeSummary {
  id: string;
  draftId: number;
  productType: string;
  productId: number;
  productQuantity: number;
  rarity: number | null;
  durationSec: number | null;
  icon: DraftItemIcon;
  product: DraftItemReference;
  ingredients: DraftItemReference[];
}

const rawDraftRecipes = draftsRecipesJson as unknown as DraftRecipeRecord[];

const draftRecipes = rawDraftRecipes.slice().sort((a, b) => a.draftId - b.draftId);

const draftRecipesById = new Map<number, DraftRecipeRecord>();
for (const recipe of draftRecipes) {
  draftRecipesById.set(recipe.draftId, recipe);
}

const draftRecipeSummaries: DraftRecipeSummary[] = draftRecipes.map((recipe) => ({
  id: recipe.id,
  draftId: recipe.draftId,
  productType: recipe.productType,
  productId: recipe.productId,
  productQuantity: recipe.productQuantity,
  rarity: recipe.product.rarity ?? recipe.crafting.rarity,
  durationSec: recipe.crafting.durationSec,
  icon: recipe.icon,
  product: recipe.product,
  ingredients: recipe.ingredients,
}));

function firstNonEmpty(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getDraftRecipes(): DraftRecipeRecord[] {
  return draftRecipes;
}

export function getDraftRecipeSummaries(): DraftRecipeSummary[] {
  return draftRecipeSummaries;
}

export function getDraftRecipeById(draftIdOrSlug: string): DraftRecipeRecord | null {
  const normalized = draftIdOrSlug.trim().toLowerCase();

  for (const recipe of draftRecipes) {
    if (recipe.id.toLowerCase() === normalized) {
      return recipe;
    }
  }

  const numeric = Number(draftIdOrSlug);
  if (Number.isFinite(numeric)) {
    return draftRecipesById.get(numeric) ?? null;
  }

  return null;
}

export function getDraftAvailableLanguages(recipes: DraftRecipeSummary[] = draftRecipeSummaries): string[] {
  const out = new Set<string>();

  for (const recipe of recipes) {
    for (const code of Object.keys(recipe.product.names)) {
      out.add(code.toUpperCase());
    }
  }

  return Array.from(out).sort((a, b) => a.localeCompare(b));
}

export function resolveDraftTextByLanguage(
  valuesByLanguage: Record<string, string | null>,
  languageCode: string,
  fallbackLanguages: string[],
): string | null {
  const primary = firstNonEmpty(valuesByLanguage[languageCode.toUpperCase()]);
  if (primary) {
    return primary;
  }

  for (const code of fallbackLanguages) {
    const candidate = firstNonEmpty(valuesByLanguage[code.toUpperCase()]);
    if (candidate) {
      return candidate;
    }
  }

  for (const value of Object.values(valuesByLanguage)) {
    const candidate = firstNonEmpty(value);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

export function resolveDraftItemName(
  item: DraftItemReference,
  languageCode: string,
  fallbackLanguages: string[],
): string {
  return resolveDraftTextByLanguage(item.names, languageCode, fallbackLanguages) ?? `${item.type} #${item.id}`;
}

export function resolveDraftItemDescription(
  item: DraftItemReference,
  languageCode: string,
  fallbackLanguages: string[],
): string | null {
  return resolveDraftTextByLanguage(item.descriptions, languageCode, fallbackLanguages);
}

