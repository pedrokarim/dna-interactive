import catalogJson from "@/data/items/catalog.json";
import fishingItemsJson from "@/data/items/fishing.items.json";
import genimonsItemsJson from "@/data/items/genimons.items.json";
import modsItemsJson from "@/data/items/mods.items.json";
import resourcesItemsJson from "@/data/items/resources.items.json";
import weaponsItemsJson from "@/data/items/weapons.items.json";
import { LANGUAGE_LABELS } from "@/i18n/config";
import { FROZEN_LANGUAGES, isStaleKey, isWorkingLabel } from "@/lib/items/frozen-languages";
import { getOfficialDescription } from "@/lib/items/official-texts";
import type {
  ItemCatalog,
  ItemCategory,
  ItemLocalizedContent,
  ItemRecord,
} from "@/lib/items/types";


const catalog = catalogJson as ItemCatalog;
const rawFishingItems = fishingItemsJson as unknown as ItemRecord[];
const rawGenimonsItems = genimonsItemsJson as unknown as ItemRecord[];
const rawModsItems = modsItemsJson as unknown as ItemRecord[];
const rawResourcesItems = resourcesItemsJson as unknown as ItemRecord[];
const rawWeaponsItems = weaponsItemsJson as unknown as ItemRecord[];

function sanitizeItemFields(fields: ItemRecord["fields"]): ItemRecord["fields"] {
  const sanitized: ItemRecord["fields"] = {};
  for (const [fieldKey, fieldValue] of Object.entries(fields)) {
    if (fieldKey.toLowerCase() === "descvalues") {
      continue;
    }
    sanitized[fieldKey] = fieldValue;
  }
  return sanitized;
}

/** Une clé de TextMap restée telle quelle : le jeu n'a pas livré le texte. */
function isUnresolvedText(text: string | null, key: string | null): boolean {
  return text != null && key != null && text === key;
}

/**
 * Corrige les textes que le jeu livre faux ou pas du tout :
 * - DE/ES périmés → l'anglais actuel, plutôt qu'une valeur d'effet ou un nom
 *   d'une ancienne version ;
 * - nom resté en libellé de travail, quelle que soit la langue → l'anglais ;
 * - description restée en clé brute → texte officiel publié, sinon rien.
 */
function sanitizeTranslations(item: ItemRecord): ItemRecord["translations"] {
  const english = item.translations.EN;
  const { modNameKey, descriptionKey, passiveEffectsDescKey } = item.textKeys;
  const translations: ItemRecord["translations"] = {};
  for (const [language, content] of Object.entries(item.translations)) {
    const next = { ...content };
    if (english && FROZEN_LANGUAGES.includes(language)) {
      if (isStaleKey(modNameKey)) next.modName = english.modName;
      if (isStaleKey(descriptionKey)) next.description = english.description;
      if (isStaleKey(passiveEffectsDescKey)) {
        next.passiveEffectsDescription = english.passiveEffectsDescription;
      }
    }
    if (english && language !== "EN" && isWorkingLabel(content.modName, english.modName)) {
      next.modName = english.modName;
      next.description = english.description;
    }
    if (isUnresolvedText(next.description, descriptionKey)) {
      next.description = getOfficialDescription(item.id, language);
    }
    translations[language] = next;
  }
  return translations;
}

function sanitizeItemRecord(item: ItemRecord): ItemRecord {
  const safeIcon = { ...item.icon } as ItemRecord["icon"] & { sourceAsset?: string | null };
  delete safeIcon.sourceAsset;
  const safeAffinityIcon = {
    ...item.affinity.icon,
  } as ItemRecord["affinity"]["icon"] & { sourceAsset?: string | null };
  delete safeAffinityIcon.sourceAsset;
  const safeTypeCompatibilityTags = item.typeCompatibility.tags.map((tag) => {
    const safeTagIcon = {
      ...tag.icon,
    } as ItemRecord["typeCompatibility"]["tags"][number]["icon"] & { sourceAsset?: string | null };
    delete safeTagIcon.sourceAsset;
    return {
      ...tag,
      icon: safeTagIcon,
    };
  });

  return {
    ...item,
    icon: safeIcon,
    affinity: {
      ...item.affinity,
      icon: safeAffinityIcon,
    },
    typeCompatibility: {
      ...item.typeCompatibility,
      tags: safeTypeCompatibilityTags,
    },
    translations: sanitizeTranslations(item),
    fields: sanitizeItemFields(item.fields),
  };
}

const DATASETS_BY_CATEGORY_ID: Record<string, ItemRecord[]> = {
  fishing: rawFishingItems.map(sanitizeItemRecord),
  genimons: rawGenimonsItems.map(sanitizeItemRecord),
  mods: rawModsItems.map(sanitizeItemRecord),
  resources: rawResourcesItems.map(sanitizeItemRecord),
  weapons: rawWeaponsItems.map(sanitizeItemRecord),
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

/**
 * Colonnes de noms affichées par défaut dans les grilles : la langue du
 * visiteur, puis l'anglais pour comparer. Les grilles partaient toutes de
 * français + anglais, quelle que soit la langue de la page.
 */
export function visitorGridLanguages(locale: string): string[] {
  return [...new Set([locale.toUpperCase(), "EN"])];
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

export function getGenimonVariants(item: ItemRecord): ItemRecord[] {
  if (item.categoryId !== "genimons" || !item.variants?.siblingIds) return [];
  const items = getItemsByCategoryId("genimons");
  const siblingSet = new Set(item.variants.siblingIds);
  return items.filter((i) => siblingSet.has(i.id));
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
      passiveEffectsDescription: null,
      affinityName: null,
      archiveName: null,
      typeCompatibilityNames: [],
    }
  );
}
