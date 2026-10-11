import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import ItemsGridClient from "@/components/items/ItemsGridClient";
import ItemsSuspenseFallback from "@/components/items/ItemsSuspenseFallback";
import { getItemsByCategorySlug } from "@/lib/items/catalog";
import { generatePageMetadata } from "@/lib/metadata";
import { localizeItemCategory } from "@/lib/items/category-i18n";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return generatePageMetadata(
    {
      title: t("favoritesTitle"),
      description: t("favoritesDescription"),
      path: "/items/favoris",
    },
    parent,
    locale,
  );
}

export default async function ItemsFavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const payload = getItemsByCategorySlug("mods");

  if (!payload) {
    notFound();
  }

  const t = await getTranslations("common");

  return (
    <Suspense
      fallback={<ItemsSuspenseFallback title={t("loading")} />}
    >
      <ItemsGridClient category={await localizeItemCategory(payload.category, locale)} items={payload.items} favoritesOnly />
    </Suspense>
  );
}
