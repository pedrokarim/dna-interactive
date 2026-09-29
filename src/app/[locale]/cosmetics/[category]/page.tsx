import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import CosmeticsGridClient from "@/components/cosmetics/CosmeticsGridClient";
import ItemsSuspenseFallback from "@/components/items/ItemsSuspenseFallback";
import {
  getCosmeticCategory,
  getCosmeticsByCategory,
  getCosmeticsCatalog,
  resolveCharacterRef,
  subcategoryLabel,
  toCosmeticSummary,
  type CosmeticCharacterRef,
} from "@/lib/cosmetics/catalog";
import { generatePageMetadata } from "@/lib/metadata";

type CosmeticCategoryPageProps = {
  params: Promise<{ locale: string; category: string }>;
};

export function generateStaticParams() {
  return getCosmeticsCatalog().categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata(
  { params }: CosmeticCategoryPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale, category: slug } = await params;
  const category = getCosmeticCategory(slug);
  if (!category) return generatePageMetadata({ path: "/cosmetics", key: "cosmetics" }, parent, locale);
  const t = await getTranslations({ locale, namespace: "cosmetics" });
  return generatePageMetadata(
    {
      title: t("categoryMetaTitle", { category: t(`categories.${slug}.title`), count: category.count }),
      description: t(`categories.${slug}.description`),
      path: `/cosmetics/${slug}`,
      image: category.sample ?? undefined,
      keywords: ["Duet Night Abyss", t("title"), t(`categories.${slug}.title`)],
    },
    parent,
    locale,
  );
}

export default async function CosmeticCategoryPage({ params }: CosmeticCategoryPageProps) {
  const { locale, category: slug } = await params;
  const category = getCosmeticCategory(slug);
  if (!category) notFound();

  const t = await getTranslations("cosmetics");
  const tc = await getTranslations("common");
  const lang = locale.toUpperCase();
  const items = getCosmeticsByCategory(slug).map((item) => toCosmeticSummary(item, lang));

  // Libellé du jeu quand il existe (emplacements, types d'arme), sinon celui du site.
  const subcategories = category.subcategories.map((sub) => ({
    id: sub.id,
    count: sub.count,
    label:
      subcategoryLabel(category, sub.id, lang) ??
      (t.has(`subcategories.${slug}.${sub.id}`) ? t(`subcategories.${slug}.${sub.id}`) : sub.id),
  }));

  const characterIds = [...new Set(items.flatMap((item) => item.characters))];
  const characters = characterIds
    .map((charId) => resolveCharacterRef(charId, lang))
    .filter((ref): ref is CosmeticCharacterRef => ref !== null);

  return (
    <Suspense fallback={<ItemsSuspenseFallback title={tc("loading")} />}>
      <CosmeticsGridClient
        category={{ slug, title: t(`categories.${slug}.title`), description: t(`categories.${slug}.description`) }}
        subcategories={subcategories}
        items={items}
        characters={characters}
      />
    </Suspense>
  );
}
