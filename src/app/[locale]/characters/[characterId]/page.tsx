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
import { getCharacterBuilds } from "@/lib/characters/builds";
import { generatePageMetadata } from "@/lib/metadata";

type CharacterDetailPageProps = {
  params: Promise<{ locale: string; characterId: string }>;
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
  const { locale, characterId } = await params;
  const character = getCharacterById(characterId);

  if (!character) {
    return generatePageMetadata(
      {
        title: "Personnage introuvable",
        description: "Ce personnage n'existe pas dans la base de donnees.",
        path: "/characters",
      },
      parent,
      locale,
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
      path: `/characters/${character.id}`,
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
    locale,
  );
}

const ELEMENT_AMBIENT: Record<string, string> = {
  Fire: "rgba(239, 68, 68, 0.08)",
  Water: "rgba(96, 165, 250, 0.08)",
  Thunder: "rgba(167, 139, 250, 0.08)",
  Wind: "rgba(52, 211, 153, 0.08)",
  Light: "rgba(251, 191, 36, 0.07)",
  Dark: "rgba(129, 140, 248, 0.08)",
};

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
  const ambientColor = ELEMENT_AMBIENT[character.element.key] ?? ELEMENT_AMBIENT.Water;

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 90% 80%, ${ambientColor}, transparent)`,
        }}
      />
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
          builds={getCharacterBuilds(character.id)}
        />
      </Suspense>
    </>
  );
}
