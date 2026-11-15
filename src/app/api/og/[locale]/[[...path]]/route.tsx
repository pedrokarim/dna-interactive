import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { locales, type Locale } from "@/i18n/config";
import { loadOgFonts, OG_SIZE } from "@/app/_og/fonts";
import { CommissionsOg } from "@/app/_og/commissions-og";
import { resolvePageOg } from "@/app/_og/page-content";
import { PageOg } from "@/app/_og/page-og";
import { resolveOrigin } from "@/app/_og/shared";
import { getCommissionsPreview } from "@/lib/commissions/preview";
import { optimizedImageUrl } from "@/lib/images/optimized";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

/**
 * La rotation en cours, en tableau. Elle change à chaque heure pleine : le
 * cache s'arrête à la prochaine rotation. `null` si elle n'est pas à jour.
 */
async function commissionsImage(locale: string, origin: string): Promise<ImageResponse | null> {
  const preview = await getCommissionsPreview(locale).catch(() => null);
  if (!preview) return null;
  const [fonts, t, tc] = await Promise.all([
    loadOgFonts(),
    getTranslations({ locale, namespace: "discordEmbed" }),
    getTranslations({ locale, namespace: "commissions" }),
  ]);
  const content = {
    eyebrow: tc("eyebrow"),
    title: t("rotation", { time: preview.hour }),
    categories: preview.categories,
    rows: preview.rows.map((row) => ({
      region: row.region,
      cells: row.cells.map((cell) =>
        cell.map((objective) => ({
          label: objective.label,
          art: objective.art ? `${origin}${optimizedImageUrl(objective.art, 96)}` : null,
        })),
      ),
    })),
  };
  return new ImageResponse(<CommissionsOg content={content} origin={origin} />, {
    ...OG_SIZE,
    fonts,
    headers: { "Cache-Control": `public, max-age=${preview.secondsLeft}` },
  });
}

/**
 * Image Open Graph (1 200 × 630) d'une page qui n'a pas la sienne :
 * `/api/og/fr/planner` pour `/fr/planner`. `generatePageMetadata` y renvoie
 * par défaut ; les fiches personnage, build et objet gardent leur
 * `opengraph-image.tsx`.
 *
 * Sous `/api` pour échapper au middleware de langue, qui redirigerait l'adresse.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; path?: string[] }> },
) {
  const { locale, path = [] } = await params;
  if (!locales.includes(locale as Locale)) return new Response(null, { status: 404 });
  const segments = path.map((segment) => decodeURIComponent(segment));
  const origin = await resolveOrigin();

  if (segments.length === 1 && segments[0] === "commissions") {
    const image = await commissionsImage(locale, origin);
    if (image) return image;
  }

  const [fonts, content] = await Promise.all([loadOgFonts(), resolvePageOg(locale, segments, origin)]);
  if (!content) return new Response(null, { status: 404 });
  return new ImageResponse(<PageOg content={content} origin={origin} />, {
    ...OG_SIZE,
    fonts,
    // Commissions sans rotation à jour : image de repli, gardée peu de temps.
    headers: { "Cache-Control": segments[0] === "commissions" ? "public, max-age=300" : DAY_CACHE },
  });
}
