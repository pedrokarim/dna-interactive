import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ItemsGridClient from "@/components/items/ItemsGridClient";
import ItemsSuspenseFallback from "@/components/items/ItemsSuspenseFallback";
import { getItemsByCategorySlug } from "@/lib/items/catalog";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  _props: object,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  return generatePageMetadata(
    {
      title: "Favoris Demon Wedge",
      description:
        "Retrouvez vos Demon Wedges favoris sauvegardes localement, avec filtres et langues personnalisables.",
      url: "https://dna-interactive.ascencia.re/items/favoris",
    },
    parent,
  );
}

export default function ItemsFavoritesPage() {
  const payload = getItemsByCategorySlug("mods");

  if (!payload) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <ItemsSuspenseFallback
          title="Chargement des favoris"
          description="Recuperation de la selection locale et application des preferences."
        />
      }
    >
      <ItemsGridClient category={payload.category} items={payload.items} favoritesOnly />
    </Suspense>
  );
}
