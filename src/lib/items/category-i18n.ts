import "server-only";
import { getTranslations } from "next-intl/server";
import type { ItemCategory } from "./types";

/**
 * Catégorie d'objets avec titre, nom et description dans la langue du visiteur.
 *
 * Ces textes viennent de `catalog.json`, généré en français. Les messages
 * `itemCategories.<id>` les remplacent ; sans traduction, la catégorie garde
 * ses textes d'origine.
 */
export async function localizeItemCategory(category: ItemCategory, locale: string): Promise<ItemCategory> {
  const t = await getTranslations({ locale, namespace: "itemCategories" });
  if (!t.has(`${category.id}.name`)) return category;
  return {
    ...category,
    title: t(`${category.id}.title`),
    displayName: t(`${category.id}.name`),
    description: t(`${category.id}.description`),
  };
}
