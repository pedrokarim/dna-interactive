import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ItemsGridClient from "@/components/items/ItemsGridClient";
import ItemsSuspenseFallback from "@/components/items/ItemsSuspenseFallback";
import { getItemCatalog, getItemsByCategorySlug } from "@/lib/items/catalog";
import { generatePageMetadata } from "@/lib/metadata";

type ItemCategoryPageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  const catalog = getItemCatalog();
  return catalog.categories.map((category) => ({
    category: category.slug,
  }));
}

export async function generateMetadata(
  { params }: ItemCategoryPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { category } = await params;
  const payload = getItemsByCategorySlug(category);

  if (!payload) {
    return generatePageMetadata(
      {
        title: "Items",
        description: "Item categories for Duet Night Abyss.",
        url: "https://dna-interactive.ascencia.re/items",
      },
      parent,
    );
  }

  return generatePageMetadata(
    {
      title: `${payload.category.title} - ${payload.items.length} items`,
      description: `${payload.category.description} Search, filter, and compare localized names across ${payload.category.availableLanguages.length} languages.`,
      url: `https://dna-interactive.ascencia.re/items/${payload.category.slug}`,
      keywords: [
        "Duet Night Abyss",
        "item database",
        "multilingual",
        payload.category.displayName,
        payload.category.technicalName,
        payload.category.title,
      ],
    },
    parent,
  );
}

export default async function ItemCategoryPage({ params }: ItemCategoryPageProps) {
  const { category: categorySlug } = await params;
  const payload = getItemsByCategorySlug(categorySlug);

  if (!payload) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <ItemsSuspenseFallback
          title="Chargement des items"
          description="Initialisation des filtres, tri et pagination de la categorie."
        />
      }
    >
      <ItemsGridClient category={payload.category} items={payload.items} />
    </Suspense>
  );
}
