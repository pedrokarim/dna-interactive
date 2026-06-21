import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import ItemsGridClient from "@/components/items/ItemsGridClient";
import ItemsSuspenseFallback from "@/components/items/ItemsSuspenseFallback";
import { getItemsByCategorySlug } from "@/lib/items/catalog";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(
    {
      title: "Favoris Demon Wedge",
      description:
        "Retrouvez vos Demon Wedges favoris sauvegardes localement, avec filtres et langues personnalisables.",
      path: "/items/favoris",
    },
    parent,
    locale,
  );
}

export default async function ItemsFavoritesPage() {
  const payload = getItemsByCategorySlug("mods");

  if (!payload) {
    notFound();
  }

  const t = await getTranslations("common");

  return (
    <Suspense
      fallback={<ItemsSuspenseFallback title={t("loading")} />}
    >
      <ItemsGridClient category={payload.category} items={payload.items} favoritesOnly />
    </Suspense>
  );
}
