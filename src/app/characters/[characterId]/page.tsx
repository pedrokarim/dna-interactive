import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CharacterDetailClient from "@/components/characters/CharacterDetailClient";
import CharactersSuspenseFallback from "@/components/characters/CharactersSuspenseFallback";
import {
  getAllCharacters,
  getCharacterById,
  getCharactersCatalog,
  getCharacterTranslation,
  getLevelUpCurves,
} from "@/lib/characters/catalog";
import { generatePageMetadata } from "@/lib/metadata";

type CharacterDetailPageProps = {
  params: Promise<{ characterId: string }>;
};

export function generateStaticParams() {
  const characters = getAllCharacters();
  return characters.map((character) => ({
    characterId: character.id,
  }));
}

export async function generateMetadata(
  { params }: CharacterDetailPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { characterId } = await params;
  const character = getCharacterById(characterId);

  if (!character) {
    return generatePageMetadata(
      {
        title: "Personnage introuvable",
        description: "Ce personnage n'existe pas dans la base de donnees.",
        url: "https://dna-interactive.ascencia.re/characters",
      },
      parent,
    );
  }

  const catalog = getCharactersCatalog();
  const localized = getCharacterTranslation(
    character,
    catalog.defaultDetailLanguage,
    catalog.availableLanguages,
  );
  const charName = localized.name ?? character.internalName;

  return generatePageMetadata(
    {
      title: `${charName} - ${character.element.label} ${character.weaponTags[0] ?? ""}`,
      description: `Fiche complete de ${charName} dans Duet Night Abyss : element ${character.element.label}, armes, faction, portraits et traductions multilingues.`,
      url: `https://dna-interactive.ascencia.re/characters/${character.id}`,
      image: character.portraits.gacha.publicPath ?? undefined,
      keywords: [
        "Duet Night Abyss",
        "personnage",
        "character",
        charName,
        character.internalName,
        character.element.label,
        character.element.key,
        ...character.weaponTags,
        character.camp.key,
      ],
    },
    parent,
  );
}

export default async function CharacterDetailPage({
  params,
}: CharacterDetailPageProps) {
  const { characterId } = await params;
  const character = getCharacterById(characterId);

  if (!character) {
    notFound();
  }

  const catalog = getCharactersCatalog();
  const levelUpCurves = getLevelUpCurves();

  return (
    <Suspense
      fallback={
        <CharactersSuspenseFallback
          title="Chargement du personnage"
          description="Preparation des portraits, traductions et statistiques."
        />
      }
    >
      <CharacterDetailClient
        catalog={catalog}
        character={character}
        levelUpCurves={levelUpCurves}
      />
    </Suspense>
  );
}
