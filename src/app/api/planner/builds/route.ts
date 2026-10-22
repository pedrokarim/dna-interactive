import { NextResponse } from "next/server";
import { getApiLocale } from "@/lib/api-locale";
import { locales, type Locale } from "@/i18n/config";
import { listPlannerBuilds, resolvePlannerBuild } from "@/lib/planner/build-source";

export const dynamic = "force-dynamic";

const TARGET = /^(char-[a-z0-9-]{1,60}|weapons-\d{1,9})$/;
const ELEMENT = /^[A-Za-z]{1,20}$/;

/**
 * Builds du planificateur, en lecture seule et sans compte :
 * - `?target=char-aote&element=Wind` → builds proposés pour la cible ;
 * - `?key=official:…|community:…|weapon:…` → build réduit, prêt à importer.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  // La langue de la page qui appelle, à défaut celle du cookie.
  const asked = url.searchParams.get("locale");
  const locale = asked && locales.includes(asked as Locale) ? asked : getApiLocale(request);

  const key = url.searchParams.get("key");
  if (key) {
    if (key.length > 160) return NextResponse.json({ build: null }, { status: 400 });
    const build = await resolvePlannerBuild(key, locale);
    return NextResponse.json({ build }, { status: build ? 200 : 404 });
  }

  const target = url.searchParams.get("target") ?? "";
  const element = url.searchParams.get("element");
  if (!TARGET.test(target) || (element && !ELEMENT.test(element))) {
    return NextResponse.json({ builds: [] }, { status: 400 });
  }
  return NextResponse.json({ builds: await listPlannerBuilds(target, element, locale) });
}
