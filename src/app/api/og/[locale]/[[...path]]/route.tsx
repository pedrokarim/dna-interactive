import { ImageResponse } from "next/og";
import { locales, type Locale } from "@/i18n/config";
import { loadOgFonts, OG_SIZE } from "@/app/_og/fonts";
import { resolvePageOg } from "@/app/_og/page-content";
import { PageOg } from "@/app/_og/page-og";
import { resolveOrigin } from "@/app/_og/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const [fonts, origin] = await Promise.all([loadOgFonts(), resolveOrigin()]);
  const content = await resolvePageOg(locale, path.map((segment) => decodeURIComponent(segment)), origin);
  if (!content) return new Response(null, { status: 404 });
  return new ImageResponse(<PageOg content={content} origin={origin} />, {
    ...OG_SIZE,
    fonts,
    headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
  });
}
