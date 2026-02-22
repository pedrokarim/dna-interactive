import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import DraftDetailClient from "@/components/items/DraftDetailClient";
import {
  getDraftAvailableLanguages,
  getDraftRecipeById,
  getDraftRecipes,
  resolveDraftItemDescription,
  resolveDraftItemName,
} from "@/lib/items/drafts";
import { generatePageMetadata } from "@/lib/metadata";

type DraftDetailPageProps = {
  params: Promise<{ draftId: string }>;
};

export function generateStaticParams() {
  const recipes = getDraftRecipes();
  return recipes.map((recipe) => ({
    draftId: `${recipe.draftId}`,
  }));
}

export async function generateMetadata(
  { params }: DraftDetailPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { draftId } = await params;
  const recipe = getDraftRecipeById(draftId);

  if (!recipe) {
    return generatePageMetadata(
      {
        title: "Detail plan de forge",
        description: "Plan de forge introuvable.",
        url: "https://dna-interactive.ascencia.re/items/drafts",
      },
      parent,
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
      url: `https://dna-interactive.ascencia.re/items/drafts/${recipe.draftId}`,
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
  );
}

export default async function DraftDetailPage({ params }: DraftDetailPageProps) {
  const { draftId } = await params;
  const recipe = getDraftRecipeById(draftId);

  if (!recipe) {
    notFound();
  }

  const availableLanguages = getDraftAvailableLanguages();

  return <DraftDetailClient recipe={recipe} availableLanguages={availableLanguages} />;
}

