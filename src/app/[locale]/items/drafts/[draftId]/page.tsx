import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import DraftDetailClient from "@/components/items/DraftDetailClient";
import ItemsSuspenseFallback from "@/components/items/ItemsSuspenseFallback";
import {
  getDraftAvailableLanguages,
  getDraftRecipeById,
  resolveDraftItemDescription,
  resolveDraftItemName,
} from "@/lib/items/drafts";
import { generatePageMetadata } from "@/lib/metadata";

type DraftDetailPageProps = {
  params: Promise<{ locale: string; draftId: string }>;
};


export async function generateMetadata(
  { params }: DraftDetailPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale, draftId } = await params;
  const recipe = getDraftRecipeById(draftId);

  if (!recipe) {
    return generatePageMetadata(
      {
        title: "Detail plan de forge",
        description: "Plan de forge introuvable.",
        path: "/items/drafts",
      },
      parent,
      locale,
    );
  }

  const languages = getDraftAvailableLanguages();
  const productName = resolveDraftItemName(recipe.product, "FR", languages);
  const productDescription = resolveDraftItemDescription(recipe.product, "FR", languages);

  return generatePageMetadata(
    {
      title: `${productName} (Draft #${recipe.draftId})`,
      description:
        productDescription ??
        `Detail du plan de forge #${recipe.draftId} avec ingredients, couts et temps de fabrication.`,
      path: `/items/drafts/${recipe.draftId}`,
      keywords: [
        "Duet Night Abyss",
        "draft",
        "forge",
        "recipe",
        productName,
        `draft ${recipe.draftId}`,
      ],
    },
    parent,
    locale,
  );
}

export default async function DraftDetailPage({ params }: DraftDetailPageProps) {
  const { draftId } = await params;
  const recipe = getDraftRecipeById(draftId);

  if (!recipe) {
    notFound();
  }

  const availableLanguages = getDraftAvailableLanguages();

  return (
    <Suspense
      fallback={
        <ItemsSuspenseFallback
          title="Chargement du draft"
          description="Mise en place des ingredients, du produit final et des traductions."
        />
      }
    >
      <DraftDetailClient recipe={recipe} availableLanguages={availableLanguages} />
    </Suspense>
  );
}
