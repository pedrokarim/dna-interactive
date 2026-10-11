import "server-only";
import { getTranslations } from "next-intl/server";
import type { ItemCategory } from "./types";

/**
 * Catégorie d'objets avec son titre, son nom et sa description dans la langue
 * du visiteur.
 *
 * Ces trois textes viennent de `catalog.json`, généré en français. Les pages
 * les affichaient tels quels dans les 7 langues : les messages
 * `itemCategories.<id>` les remplacent. Une catégorie sans traduction garde
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
