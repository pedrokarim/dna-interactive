import type { Metadata, ResolvingMetadata } from "next";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import HomeHubClient, { type HomeBuildCard, type HomeCode } from "@/components/home/HomeHubClient";
import { GAME_CODES } from "@/lib/store";
import { getAllCharacters, getCharacterById, resolveCharacterDisplayName } from "@/lib/characters/catalog";
import { getItemCatalog } from "@/lib/items/catalog";
import { getTopBuilds, getBuildsTotal } from "@/lib/community-builds/list";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.home, parent, locale);
}

// Élément (jeu) → teinte du design system.
const ELEMENT_TINT: Record<string, string> = {
  Fire: "var(--color-pyro)",
  Water: "var(--color-hydro)",
  Thunder: "var(--color-electro)",
  Wind: "var(--color-anemo)",
  Light: "var(--color-lumino)",
  Dark: "var(--color-umbro)",
};

/** Home hub — carte, base de données, builder et outils, câblés sur les vraies données. */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const langCode = locale.toUpperCase();
  const fmt = new Intl.NumberFormat(locale);

  const characters = getAllCharacters();
  const catalog = getItemCatalog();
  const itemsTotal = catalog.categories.reduce((sum, c) => sum + (c.itemCount ?? 0), 0);

  const [topBuilds, buildsTotal] = await Promise.all([getTopBuilds(8), getBuildsTotal()]);

  const builds: HomeBuildCard[] = topBuilds.map((b) => {
    const ch = getCharacterById(b.characterId);
    const name = ch ? resolveCharacterDisplayName(ch, langCode) ?? ch.internalName : b.characterId;
    const portrait =
      ch?.portraits.gacha.publicPath ?? ch?.portraits.head.publicPath ?? ch?.portraits.icon.publicPath ?? null;
    const elementKey = b.element ?? ch?.element.key ?? null;
    return {
      id: b.id,
      title: b.title,
      character: name,
      tags: b.tags,
      views: b.views,
      votes: b.voteCount,
      author: b.authorName ?? "?",
      portrait,
      tint: (elementKey && ELEMENT_TINT[elementKey]) || "var(--color-gold)",
    };
  });

  const codes: HomeCode[] = GAME_CODES.filter((c) => !c.expired)
    .slice(0, 3)
    .map((c) => ({ code: c.code, reward: c.rewards.join(" · ") }));

  return (
    <HomeHubClient
      codes={codes}
      builds={builds}
      communityCount={fmt.format(buildsTotal)}
      stats={{
        characters: fmt.format(characters.length),
        items: fmt.format(itemsTotal),
        builds: fmt.format(buildsTotal),
      }}
    />
  );
}
