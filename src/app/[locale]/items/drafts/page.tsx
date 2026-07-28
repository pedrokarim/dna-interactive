import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import DraftsGridClient from "@/components/items/DraftsGridClient";
import ItemsSuspenseFallback from "@/components/items/ItemsSuspenseFallback";
import { getDraftAvailableLanguages, getDraftRecipeSummaries } from "@/lib/items/drafts";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(
    {
      key: "drafts",
      path: "/items/drafts",
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
    locale,
  );
}

export default async function DraftsPage() {
  const recipes = getDraftRecipeSummaries();
  const availableLanguages = getDraftAvailableLanguages(recipes);
  const t = await getTranslations("common");

  return (
    <Suspense
      fallback={<ItemsSuspenseFallback title={t("loading")} />}
    >
      <DraftsGridClient
        recipes={recipes}
        availableLanguages={availableLanguages}
        defaultLanguages={["FR", "EN"]}
      />
    </Suspense>
  );
}
