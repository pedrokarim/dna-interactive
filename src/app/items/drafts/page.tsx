import type { Metadata, ResolvingMetadata } from "next";
import { Suspense } from "react";
import DraftsGridClient from "@/components/items/DraftsGridClient";
import ItemsSuspenseFallback from "@/components/items/ItemsSuspenseFallback";
import { getDraftAvailableLanguages, getDraftRecipeSummaries } from "@/lib/items/drafts";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  _props: object,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  return generatePageMetadata(
    {
      title: "Plans de forge (Drafts) - Duet Night Abyss",
      description:
        "Base de donnees des plans de forge: recettes, ingredients, temps de fabrication et details des objets finaux.",
      url: "https://dna-interactive.ascencia.re/items/drafts",
      keywords: [
        "Duet Night Abyss",
        "draft",
        "forge",
        "plan de fabrication",
        "recipe",
        "crafting",
        "items",
      ],
    },
    parent,
  );
}

export default function DraftsPage() {
  const recipes = getDraftRecipeSummaries();
  const availableLanguages = getDraftAvailableLanguages(recipes);

  return (
    <Suspense
      fallback={
        <ItemsSuspenseFallback
          title="Chargement des drafts"
          description="Construction de la grille des recettes et des options de filtrage."
        />
      }
    >
      <DraftsGridClient
        recipes={recipes}
        availableLanguages={availableLanguages}
        defaultLanguages={["FR", "EN"]}
      />
    </Suspense>
  );
}
