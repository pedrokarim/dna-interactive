import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import CosmeticDetailClient from "@/components/cosmetics/CosmeticDetailClient";
import ItemsSuspenseFallback from "@/components/items/ItemsSuspenseFallback";
import { getCosmetic, pickText } from "@/lib/cosmetics/catalog";
import { buildCosmeticDetailView } from "@/lib/cosmetics/detail";
import { generatePageMetadata } from "@/lib/metadata";

type CosmeticDetailPageProps = {
  params: Promise<{ locale: string; category: string; id: string }>;
};

// Pas de generateStaticParams : comme les fiches d’items, les ~940 fiches (× 7 langues) sont rendues à la demande.

export async function generateMetadata(
  { params }: CosmeticDetailPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale, category, id } = await params;
  const item = getCosmetic(category, id);
  if (!item) return generatePageMetadata({ key: "cosmetics", path: "/cosmetics" }, parent, locale);
  const t = await getTranslations({ locale, namespace: "cosmetics" });
  const lang = locale.toUpperCase();
  const name = pickText(item.name, lang) ?? item.id;
  const categoryTitle = t(`categories.${category}.title`);
  return generatePageMetadata(
    {
      title: t("detailMetaTitle", { name, category: categoryTitle }),
      description: pickText(item.description, lang) ?? t("detailMetaDescription", { name, category: categoryTitle }),
      path: `/cosmetics/${category}/${id}`,
      image: item.visuals.icon ?? undefined,
      keywords: ["Duet Night Abyss", name, item.name.EN ?? name, categoryTitle],
      type: "article",
    },
    parent,
    locale,
  );
}

export default async function CosmeticDetailPage({ params }: CosmeticDetailPageProps) {
  const { locale, category, id } = await params;
  const item = getCosmetic(category, id);
  if (!item) notFound();
  const tc = await getTranslations("common");
  const view = buildCosmeticDetailView(item, locale.toUpperCase());

  return (
    <Suspense fallback={<ItemsSuspenseFallback title={tc("loading")} />}>
      <CosmeticDetailClient cosmetic={view} />
    </Suspense>
  );
}
