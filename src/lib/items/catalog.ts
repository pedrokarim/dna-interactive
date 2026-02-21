import catalogJson from "@/data/items/catalog.json";
import modsItemsJson from "@/data/items/mods.items.json";
import type {
  ItemCatalog,
  ItemCategory,
  ItemLocalizedContent,
  ItemRecord,
} from "@/lib/items/types";

const LANGUAGE_LABELS: Record<string, string> = {
  DE: "Deutsch",
  EN: "English",
  ES: "Espanol",
  FR: "Francais",
  JP: "Japanese",
  KR: "Korean",
  TC: "Traditional Chinese",
};

const catalog = catalogJson as ItemCatalog;

const DATASETS_BY_CATEGORY_ID: Record<string, ItemRecord[]> = {
  mods: modsItemsJson as ItemRecord[],
};

export function getLanguageLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? code;
}

export function getItemCatalog(): ItemCatalog {
  return catalog;
}

export function getItemCategoryBySlug(slug: string): ItemCategory | null {
  return catalog.categories.find((category) => category.slug === slug) ?? null;
}

export function getItemCategoryById(categoryId: string): ItemCategory | null {
  return catalog.categories.find((category) => category.id === categoryId) ?? null;
}

export function getItemsByCategoryId(categoryId: string): ItemRecord[] {
  return DATASETS_BY_CATEGORY_ID[categoryId] ?? [];
}

export function getItemsByCategorySlug(
  slug: string,
): { category: ItemCategory; items: ItemRecord[] } | null {
  const category = getItemCategoryBySlug(slug);
  if (!category) {
    return null;
  }
  return {
    category,
    items: getItemsByCategoryId(category.id),
  };
}

export function getItemByCategoryAndId(
  categoryId: string,
  itemId: string,
): ItemRecord | null {
  const normalized = itemId.trim().toLowerCase();
  for (const item of getItemsByCategoryId(categoryId)) {
    if (item.id.toLowerCase() === normalized) {
      return item;
    }
    if (`${item.modId}` === itemId) {
      return item;
    }
  }
  return null;
}

export function normalizeLanguageCodes(
  requested: string[],
  available: string[],
  fallback: string[],
): string[] {
  const availableSet = new Set(available.map((code) => code.toUpperCase()));
  const selected = new Set<string>();

  for (const code of requested) {
    const normalized = code.toUpperCase();
    if (availableSet.has(normalized)) {
      selected.add(normalized);
    }
  }

  if (selected.size === 0) {
    for (const code of fallback) {
      const normalized = code.toUpperCase();
      if (availableSet.has(normalized)) {
        selected.add(normalized);
      }
    }
  }

  if (selected.size === 0 && available.length > 0) {
    selected.add(available[0].toUpperCase());
  }

  return Array.from(selected);
}

export function getItemTranslation(
  item: ItemRecord,
  languageCode: string,
  fallbackLanguages: string[],
): ItemLocalizedContent {
  const normalized = languageCode.toUpperCase();
  if (item.translations[normalized]) {
    return item.translations[normalized];
  }

  for (const fallback of fallbackLanguages) {
    const normalizedFallback = fallback.toUpperCase();
    if (item.translations[normalizedFallback]) {
      return item.translations[normalizedFallback];
    }
  }

  const firstAvailable = Object.values(item.translations)[0];
  return (
    firstAvailable ?? {
      modName: null,
      description: null,
      demonWedgeName: null,
      functionLabel: null,
      archiveName: null,
    }
  );
}
