import { NextRequest, NextResponse } from "next/server";
import { getChangelogPage, getChangelogVersionIndex } from "@/lib/changelog/db";
import { CHANGELOG_PAGE_SIZE, isValidVersion } from "@/lib/changelog/types";
import { locales, defaultLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

/**
 * Journal des versions, page par page.
 *
 * `?cursor=` continue le défilement, `?start=` saute à une version.
 * `?index=1` renvoie plutôt la liste légère des versions, pour le sélecteur
 * de saut rapide.
 *
 * Public, sans auth, mais la page est bornée : pas de journal entier d'un coup.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const rawLocale = searchParams.get("locale");
  const locale = locales.includes(rawLocale as (typeof locales)[number]) ? rawLocale! : defaultLocale;

  if (searchParams.get("index")) {
    const versions = await getChangelogVersionIndex();
    return NextResponse.json({ versions }, { headers: { "Cache-Control": "public, max-age=60" } });
  }

  const start = searchParams.get("start");
  if (start && !isValidVersion(start)) {
    return NextResponse.json({ error: "Version invalide." }, { status: 400 });
  }

  // `Number(null)` vaut 0 : sans ce test, un `limit` absent donnait une page
  // d'un seul élément.
  const rawLimit = searchParams.get("limit");
  const parsedLimit = rawLimit === null ? Number.NaN : Number(rawLimit);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(Math.trunc(parsedLimit), 20)
    : CHANGELOG_PAGE_SIZE;

  const page = await getChangelogPage({
    locale,
    cursor: searchParams.get("cursor"),
    startAt: start,
    limit,
  });

  return NextResponse.json(page, { headers: { "Cache-Control": "public, max-age=60" } });
}
