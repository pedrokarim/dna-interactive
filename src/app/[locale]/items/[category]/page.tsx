import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import ItemsGridClient from "@/components/items/ItemsGridClient";
import ItemsSuspenseFallback from "@/components/items/ItemsSuspenseFallback";
import { getItemCatalog, getItemsByCategorySlug } from "@/lib/items/catalog";
import { generatePageMetadata } from "@/lib/metadata";
import { localizeItemCategory } from "@/lib/items/category-i18n";

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

  const localized = await localizeItemCategory(payload.category, locale);
  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  return generatePageMetadata(
    {
      title: `${localized.title} - ${payload.items.length} items`,
      description: `${localized.description} ${tMeta("itemCategorySearch", { count: localized.availableLanguages.length })}`,
      path: `/items/${payload.category.slug}`,
      keywords: [
        "Duet Night Abyss",
        "item database",
        "multilingual",
        localized.displayName,
        localized.technicalName,
        localized.title,
      ],
    },
    parent,
    locale,
  );
}

export default async function ItemCategoryPage({ params }: ItemCategoryPageProps) {
  const { locale, category: categorySlug } = await params;
  const payload = getItemsByCategorySlug(categorySlug);

  if (!payload) {
    notFound();
  }

  const t = await getTranslations("common");

  return (
    <Suspense
      fallback={<ItemsSuspenseFallback title={t("loading")} />}
    >
      <ItemsGridClient category={await localizeItemCategory(payload.category, locale)} items={payload.items} />
    </Suspense>
  );
}
