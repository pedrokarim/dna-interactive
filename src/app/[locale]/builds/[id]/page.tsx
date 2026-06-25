import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isMissingTableError } from "@/lib/db-errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCharacterById } from "@/lib/characters/catalog";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { NAVIGATION } from "@/lib/constants";
import { BuildPageClient } from "@/components/community-builds/BuildPageClient";
import type { CommunityBuildPayload } from "@/lib/community-builds/validation";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ locale: string; id: string }> };

type LoadedBuild = {
  id: string;
  userId: string;
  characterId: string;
  element: string | null;
  title: string;
  note: string | null;
  payload: CommunityBuildPayload;
  voteCount: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  authorName: string | null;
  authorImage: string | null;
  votedByMe: boolean;
  editableByMe: boolean;
};

async function loadBuild(id: string, { countView }: { countView: boolean }): Promise<LoadedBuild | null> {
  const user = await getCurrentUser();
  const db = getDb();
  try {
    const [row] = await db
      .select({
        id: schema.builds.id,
        userId: schema.builds.userId,
        characterId: schema.builds.characterId,
        element: schema.builds.element,
        title: schema.builds.title,
        note: schema.builds.note,
        payload: schema.builds.payload,
        voteCount: schema.builds.voteCount,
        views: schema.builds.views,
        hidden: schema.builds.hidden,
        createdAt: schema.builds.createdAt,
        updatedAt: schema.builds.updatedAt,
        authorName: schema.users.name,
        authorImage: schema.users.image,
      })
      .from(schema.builds)
      .innerJoin(schema.users, eq(schema.users.id, schema.builds.userId))
      .where(eq(schema.builds.id, id))
      .limit(1);

    if (!row) return null;

    const editableByMe = user?.id === row.userId || user?.role === "admin";
    if (row.hidden && !editableByMe) return null;

    let views = row.views;
    if (countView && !editableByMe) {
      const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
      const viewerKey = user?.id ?? ip;
      if (checkRateLimit(`build:view:${id}:${viewerKey}`, 1, 30 * 60 * 1000).ok) {
        await db.update(schema.builds).set({ views: sql`${schema.builds.views} + 1` }).where(eq(schema.builds.id, id));
        views += 1;
      }
    }

    let votedByMe = false;
    if (user) {
      const [vote] = await db
        .select({ buildId: schema.buildVotes.buildId })
        .from(schema.buildVotes)
        .where(and(eq(schema.buildVotes.buildId, id), eq(schema.buildVotes.userId, user.id)))
        .limit(1);
      votedByMe = Boolean(vote);
    }

    return {
      id: row.id,
      userId: row.userId,
      characterId: row.characterId,
      element: row.element,
      title: row.title,
      note: row.note,
      payload: row.payload as CommunityBuildPayload,
      voteCount: row.voteCount,
      views,
      createdAt: String(row.createdAt),
      updatedAt: String(row.updatedAt),
      authorName: row.authorName,
      authorImage: row.authorImage,
      votedByMe,
      editableByMe,
    };
  } catch (error) {
    if (isMissingTableError(error)) return null;
    // id mal formé (uuid invalide) ou autre → 404 propre
    return null;
  }
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { id } = await params;
  const build = await loadBuild(id, { countView: false });
  if (!build) return { title: "Build introuvable" };
  const character = getCharacterById(build.characterId);
  const charName = character?.element ? character.internalName : "";
  const description =
    build.note ?? `Build communautaire Duet Night Abyss${charName ? ` pour ${charName}` : ""}.`;
  // og:title/og:description doivent être explicitement repris ici, sinon ils
  // héritent du bloc openGraph générique du layout racine (les réseaux
  // afficheraient le titre du site au lieu du titre du build). L'image OG
  // dynamique reste fournie par opengraph-image.tsx.
  return {
    title: build.title,
    description,
    openGraph: { title: build.title, description },
    twitter: { title: build.title, description },
  };
}

export default async function CommunityBuildPage({ params }: RouteParams) {
  const { locale, id } = await params;
  const build = await loadBuild(id, { countView: true });
  if (!build) notFound();

  const character = getCharacterById(build.characterId);
  if (!character) notFound();

  const characterElement = build.element ?? character.element.key;

  return (
    <main className="min-h-screen bg-ink text-parch">
      <SiteHeader active={NAVIGATION.builds} />
      <section className="container mx-auto px-4 py-6 md:px-6">
        <BuildPageClient
          build={build}
          character={character}
          characterElement={characterElement}
          lang={locale.toUpperCase()}
        />
      </section>
      <SiteFooter active={NAVIGATION.builds} />
    </main>
  );
}
