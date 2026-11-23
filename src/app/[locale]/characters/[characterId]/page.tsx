import type { Metadata, ResolvingMetadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import CharacterDetailClient from "@/components/characters/CharacterDetailClient";
import CharactersSuspenseFallback from "@/components/characters/CharactersSuspenseFallback";
import {
  getAllCharacters,
  getCharacterById,
  getCharacterSlug,
  getCharactersCatalog,
  getCharacterSkills,
  getCharacterTranslation,
  getLevelUpCurves,
} from "@/lib/characters/catalog";
import { getCharacterBuilds } from "@/lib/characters/builds";
import { getUpcomingCharacter, getUpcomingText } from "@/lib/characters/upcoming";
import { UpcomingCharacterPage } from "@/components/characters/UpcomingCharacterPage";
import { generatePageMetadata } from "@/lib/metadata";

type CharacterDetailPageProps = {
  params: Promise<{ locale: string; characterId: string }>;
};

export function generateStaticParams() {
  const characters = getAllCharacters();
  return characters.map((character) => ({
    characterId: getCharacterSlug(character),
  }));
}

export async function generateMetadata(
  { params }: CharacterDetailPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale, characterId } = await params;
  const character = getCharacterById(characterId);

  // Personnage annoncé mais pas encore dans les données du jeu : même URL,
  // métadonnées à part. Dès qu'il entre dans characters.json, on ne passe plus ici.
  const upcoming = character ? null : getUpcomingCharacter(characterId);
  if (upcoming) {
    const tUpcoming = await getTranslations({ locale, namespace: "upcomingPage" });
    const upcomingName = getUpcomingText(upcoming, locale).name;
    const upcomingElement = ELEMENT_LABEL[upcoming.element] ?? upcoming.element;
    return generatePageMetadata(
      {
        title: tUpcoming("metaTitle", { name: upcomingName, element: upcomingElement, version: upcoming.version }),
        description: tUpcoming("metaDescription", { name: upcomingName, version: upcoming.version }),
        path: `/characters/${upcoming.slug}`,
        keywords: [
          "Duet Night Abyss",
          upcoming.name,
          upcoming.internalName,
          `version ${upcoming.version}`,
          ...upcoming.weaponTags,
        ],
      },
      parent,
      locale,
    );
  }

  if (!character) {
    const tMeta = await getTranslations({ locale, namespace: "metadata" });
    return generatePageMetadata(
      {
        title: tMeta("characterNotFoundTitle"),
        description: tMeta("characterNotFoundDescription"),
        path: "/characters",
      },
      parent,
      locale,
    );
  }

  const catalog = getCharactersCatalog();
  const localized = getCharacterTranslation(
    character,
    locale.toUpperCase(),
    [catalog.defaultDetailLanguage, ...catalog.availableLanguages],
  );
  const charName = localized.name ?? character.internalName;
  const slug = getCharacterSlug(character);
  const tMeta = await getTranslations({ locale, namespace: "metadata" });
  // Avec un build, le titre reprend ce que les joueurs tapent (« <nom> build »,
  // Demon Wedges, armes). Sans build, il n'annonce pas ce que la page n'a pas.
  const hasBuild = getCharacterBuilds(character.id, locale.toUpperCase()).some((build) => !build.legacy);
  const element = character.element.label;

  return generatePageMetadata(
    {
      title: hasBuild
        ? tMeta("characterBuildTitle", { name: charName })
        : `${charName} - ${element} ${character.weaponTags[0] ?? ""}`,
      description: hasBuild
        ? tMeta("characterBuildDescription", { name: charName, element })
        : tMeta("characterDescription", { name: charName, element }),
      path: `/characters/${slug}`,
      dynamicOgImage: true, // image OG fournie par opengraph-image.tsx
      discordEmbed: true,
      keywords: [
        "Duet Night Abyss",
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

const ELEMENT_LABEL: Record<string, string> = {
  Fire: "Pyro",
  Water: "Hydro",
  Thunder: "Electro",
  Wind: "Anemo",
  Light: "Lumino",
  Dark: "Umbro",
};

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
  const { locale, characterId } = await params;
  const character = getCharacterById(characterId);

  if (!character) {
    // Avant le 404, on regarde si le personnage est juste annoncé. Dans ce cas
    // la fiche « à venir » prend déjà l'URL définitive.
    const upcoming = getUpcomingCharacter(characterId);
    if (upcoming) {
      return <UpcomingCharacterPage character={upcoming} curves={getLevelUpCurves().curves} locale={locale} />;
    }
    notFound();
  }

  const canonicalSlug = getCharacterSlug(character);
  if (characterId !== canonicalSlug) {
    // Ancien slug (`char-xxx`) : redirection 308, pour que Google lâche
    // l'ancienne adresse et arrête de l'explorer.
    permanentRedirect(`/${locale}/characters/${canonicalSlug}`);
  }

  const catalog = getCharactersCatalog();
  const levelUpCurves = getLevelUpCurves();
  const ambientColor = ELEMENT_AMBIENT[character.element.key] ?? ELEMENT_AMBIENT.Water;
  const t = await getTranslations("common");

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
          <CharactersSuspenseFallback title={t("loading")} />
        }
      >
        <CharacterDetailClient
          catalog={catalog}
          character={character}
          levelUpCurves={levelUpCurves}
          builds={getCharacterBuilds(character.id, locale.toUpperCase())}
          skillSet={getCharacterSkills(character.charId)}
        />
      </Suspense>
    </>
  );
}
