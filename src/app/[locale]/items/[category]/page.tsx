import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import ItemsGridClient from "@/components/items/ItemsGridClient";
import ItemsSuspenseFallback from "@/components/items/ItemsSuspenseFallback";
import { getItemCatalog, getItemsByCategorySlug } from "@/lib/items/catalog";
import { generatePageMetadata } from "@/lib/metadata";

type ItemCategoryPageProps = {
  params: Promise<{ locale: string; category: string }>;
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
  const { locale, category } = await params;
  const payload = getItemsByCategorySlug(category);

  if (!payload) {
    return generatePageMetadata(
      {
        title: "Items",
        description: "Item categories for Duet Night Abyss.",
        path: "/items",
      },
      parent,
      locale,
    );
  }

  return generatePageMetadata(
    {
      title: `${payload.category.title} - ${payload.items.length} items`,
      description: `${payload.category.description} Search, filter, and compare localized names across ${payload.category.availableLanguages.length} languages.`,
      path: `/items/${payload.category.slug}`,
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
    locale,
  );
}

export default async function ItemCategoryPage({ params }: ItemCategoryPageProps) {
  const { category: categorySlug } = await params;
  const payload = getItemsByCategorySlug(categorySlug);

  if (!payload) {
    notFound();
  }

  const t = await getTranslations("common");

  return (
    <Suspense
      fallback={<ItemsSuspenseFallback title={t("loading")} />}
    >
      <ItemsGridClient category={payload.category} items={payload.items} />
    </Suspense>
  );
}
