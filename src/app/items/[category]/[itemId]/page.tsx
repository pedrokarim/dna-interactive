import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import ItemDetailClient from "@/components/items/ItemDetailClient";
import {
  getItemByCategoryAndId,
  getItemCatalog,
  getItemCategoryBySlug,
  getItemTranslation,
  getItemsByCategoryId,
} from "@/lib/items/catalog";
import { generatePageMetadata } from "@/lib/metadata";

type ItemDetailPageProps = {
  params: Promise<{ category: string; itemId: string }>;
};

export function generateStaticParams() {
  const catalog = getItemCatalog();
  const params: Array<{ category: string; itemId: string }> = [];

  for (const category of catalog.categories) {
    const items = getItemsByCategoryId(category.id);
    for (const item of items) {
      params.push({
        category: category.slug,
        itemId: item.id,
      });
    }
  }

  return params;
}

export async function generateMetadata(
  { params }: ItemDetailPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { category: categorySlug, itemId } = await params;
  const category = getItemCategoryBySlug(categorySlug);
  if (!category) {
    return generatePageMetadata(
      {
        title: "Item details",
        description: "Details for Duet Night Abyss items.",
      },
      parent,
    );
  }

  const item = getItemByCategoryAndId(category.id, itemId);
  if (!item) {
    return generatePageMetadata(
      {
        title: "Item details",
        description: "Item not found.",
        url: `https://dna-interactive.ascencia.re/items/${category.slug}`,
      },
      parent,
    );
  }

  const localized = getItemTranslation(
    item,
    category.defaultDetailLanguage,
    category.availableLanguages,
  );
  const modName = localized.modName ?? `MOD ${item.modId}`;

  return generatePageMetadata(
    {
      title: `${modName} (${category.technicalName} #${item.modId})`,
      description:
        localized.description ??
        `${category.displayName} details for ${modName} in ${category.availableLanguages.length} languages.`,
      url: `https://dna-interactive.ascencia.re/items/${category.slug}/${item.id}`,
      keywords: [
        "Duet Night Abyss",
        "item database",
        category.displayName,
        category.technicalName,
        modName,
        `${category.technicalName} ${item.modId}`,
      ],
    },
    parent,
  );
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { category: categorySlug, itemId } = await params;
  const category = getItemCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const item = getItemByCategoryAndId(category.id, itemId);
  if (!item) {
    notFound();
  }

  return <ItemDetailClient category={category} item={item} />;
}
