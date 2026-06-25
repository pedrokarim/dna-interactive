import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { getCharacterById, resolveCharacterDisplayName } from "@/lib/characters/catalog";
import { loadOgFonts, OG_SIZE, OG_CONTENT_TYPE } from "@/app/_og/fonts";
import {
  OgRoot,
  PortraitBleed,
  Eyebrow,
  Title,
  getElement,
  resolveOrigin,
  truncate,
} from "@/app/_og/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Build communautaire — DNA Interactive";

type OgBuild = {
  title: string;
  note: string | null;
  characterId: string;
  element: string | null;
  voteCount: number;
  views: number;
  authorName: string | null;
};

/** Chargement minimal en lecture seule — aucune écriture (pas de compteur de vues ici). */
async function loadBuildForOg(id: string): Promise<OgBuild | null> {
  try {
    const db = getDb();
    const [row] = await db
      .select({
        title: schema.builds.title,
        note: schema.builds.note,
        characterId: schema.builds.characterId,
        element: schema.builds.element,
        voteCount: schema.builds.voteCount,
        views: schema.builds.views,
        hidden: schema.builds.hidden,
        authorName: schema.users.name,
      })
      .from(schema.builds)
      .innerJoin(schema.users, eq(schema.users.id, schema.builds.userId))
      .where(eq(schema.builds.id, id))
      .limit(1);

    if (!row || row.hidden) return null;
    return {
      title: row.title,
      note: row.note,
      characterId: row.characterId,
      element: row.element,
      voteCount: row.voteCount,
      views: row.views,
      authorName: row.authorName,
    };
  } catch (error) {
    if (isMissingTableError(error)) return null;
    return null;
  }
}

export default async function BuildOgImage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [fonts, build, origin] = await Promise.all([loadOgFonts(), loadBuildForOg(id), resolveOrigin()]);

  const character = build ? getCharacterById(build.characterId) : null;
  const element = getElement(build?.element ?? character?.element.key);

  const charName = character ? resolveCharacterDisplayName(character, locale) : null;
  const title = truncate(build?.title ?? "Build introuvable", 64);
  // bust = illustration carrée 2048² bien cadrée. Le gacha (256×1024) zoome sur
  // le haut en cover et coupe le visage → priorité au bust.
  const portraitPath =
    character?.portraits.bust?.publicPath ??
    character?.portraits.charpiece?.publicPath ??
    character?.portraits.gacha?.publicPath ??
    character?.portraits.head?.publicPath ??
    null;
  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

  return new ImageResponse(
    (
      <OgRoot hex={element.hex} origin={origin}>
        {portraitPath ? <PortraitBleed url={`${origin}${portraitPath}`} /> : null}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
            width: 760,
            height: "100%",
          }}
        >
          <Eyebrow hex={element.hex} iconUrl={element.icon ? `${origin}${element.icon}` : null} label={element.label ?? "Build"} sub={charName} />
          <Title text={title} hex={element.hex} size={title.length > 38 ? 64 : 78} />
          <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 26, color: "#cfc7d6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", width: 16, height: 16, background: element.hex, transform: "rotate(45deg)", borderRadius: 3 }} />
              <span>{fmt(build?.voteCount ?? 0)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#8a8395" }}>
              <div style={{ display: "flex", width: 16, height: 16, borderRadius: 16, border: "3px solid #6b6477" }} />
              <span>{fmt(build?.views ?? 0)} vues</span>
            </div>
            {build?.authorName ? (
              <div style={{ display: "flex", color: "#8a8395" }}>par {truncate(build.authorName, 22)}</div>
            ) : null}
          </div>
        </div>
      </OgRoot>
    ),
    { ...OG_SIZE, fonts },
  );
}
