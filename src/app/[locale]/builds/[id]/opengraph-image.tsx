import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { getCharacterById, resolveCharacterDisplayName } from "@/lib/characters/catalog";
import { ELEMENTS, type ElementKey } from "@/components/dna/elements";
import { loadOgFonts, OG_SIZE, OG_CONTENT_TYPE } from "@/app/_og/fonts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Build communautaire — DNA Interactive";

const FALLBACK_HEX = "#a48ed0";

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

async function resolveOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    }
  } catch {
    /* headers() indisponible (build statique) → fallback prod */
  }
  return "https://dna.ascencia.re";
}

function truncate(value: string, max: number): string {
  const clean = value.trim();
  // ASCII "..." plutôt que "…" : le glyphe ellipsis n'existe pas dans les
  // fontes embarquées et déclencherait un fetch de police dynamique.
  return clean.length > max ? `${clean.slice(0, max - 3).trimEnd()}...` : clean;
}

export default async function BuildOgImage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [fonts, build, origin] = await Promise.all([
    loadOgFonts(),
    loadBuildForOg(id),
    resolveOrigin(),
  ]);

  const character = build ? getCharacterById(build.characterId) : null;
  const elementKey = (build?.element ?? character?.element.key ?? "") as ElementKey;
  const element = ELEMENTS[elementKey];
  const hex = element?.hex ?? FALLBACK_HEX;

  const charName = character ? resolveCharacterDisplayName(character, locale) : null;
  const title = truncate(build?.title ?? "Build introuvable", 64);
  const portraitPath =
    character?.portraits.gacha?.publicPath ??
    character?.portraits.bust?.publicPath ??
    character?.portraits.head?.publicPath ??
    null;
  const portraitUrl = portraitPath ? `${origin}${portraitPath}` : null;
  const elementIconUrl = element ? `${origin}${element.icon}` : null;
  const logoUrl = `${origin}/assets/images/logo_optimized.png`;

  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#0b0a0f",
          fontFamily: "Jost",
          overflow: "hidden",
        }}
      >
        {/* Teinte élémentaire en fond */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: `radial-gradient(120% 120% at 78% 18%, ${hex}59 0%, ${hex}1f 34%, #0b0a0f 70%)`,
          }}
        />
        {/* Portrait du personnage, débordant à droite avec fondu */}
        {portraitUrl ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 560,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portraitUrl}
              width={560}
              height={630}
              alt=""
              style={{ width: 560, height: 630, objectFit: "cover", objectPosition: "top center" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                background:
                  "linear-gradient(90deg, #0b0a0f 0%, rgba(11,10,15,0.55) 28%, rgba(11,10,15,0) 62%)",
              }}
            />
          </div>
        ) : null}

        {/* Liseré supérieur élémentaire */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            display: "flex",
            background: `linear-gradient(90deg, ${hex} 0%, ${hex}00 70%)`,
          }}
        />

        {/* Colonne texte */}
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
          {/* En-tête : élément + auteur */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {elementIconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={elementIconUrl} width={44} height={44} alt="" style={{ width: 44, height: 44 }} />
            ) : null}
            <div
              style={{
                display: "flex",
                fontFamily: "Cinzel",
                fontSize: 26,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: hex,
              }}
            >
              {element?.label ?? "Build"}
            </div>
            {charName ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", width: 6, height: 6, borderRadius: 6, background: "#6b6477" }} />
                <div style={{ display: "flex", fontSize: 26, color: "#9b94a8" }}>{charName}</div>
              </div>
            ) : null}
          </div>

          {/* Titre */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Cinzel",
                fontSize: title.length > 38 ? 64 : 78,
                fontWeight: 700,
                lineHeight: 1.05,
                color: "#f4efe6",
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                width: 120,
                height: 4,
                background: `linear-gradient(90deg, ${hex}, ${hex}00)`,
              }}
            />
          </div>

          {/* Pied : stats + marque */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 26, color: "#cfc7d6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* losange = vote (forme dessinée, pas un glyphe) */}
                <div
                  style={{
                    display: "flex",
                    width: 16,
                    height: 16,
                    background: hex,
                    transform: "rotate(45deg)",
                    borderRadius: 3,
                  }}
                />
                <span>{fmt(build?.voteCount ?? 0)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#8a8395" }}>
                {/* anneau = vues */}
                <div
                  style={{
                    display: "flex",
                    width: 16,
                    height: 16,
                    borderRadius: 16,
                    border: "3px solid #6b6477",
                  }}
                />
                <span>{fmt(build?.views ?? 0)} vues</span>
              </div>
              {build?.authorName ? (
                <div style={{ display: "flex", color: "#8a8395" }}>par {truncate(build.authorName, 22)}</div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Marque DNA en bas à droite (logo + wordmark sur la même ligne) */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 56,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} width={48} height={48} alt="" style={{ width: 48, height: 48 }} />
          <div
            style={{
              display: "flex",
              fontFamily: "Cinzel",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 1,
              color: "#f4efe6",
            }}
          >
            DNA Interactive
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
