import { NextResponse, type NextRequest } from "next/server";
import { locales, type Locale } from "@/i18n/config";
import { getApiLocale } from "@/lib/api-locale";
import { getTheatreRotations } from "@/lib/theatre/db";
import { toRotationView } from "@/lib/theatre/featured";
import { theatreOverview } from "@/lib/theatre/rotations";

export const dynamic = "force-dynamic";

/**
 * Suivi du théâtre immersif : toutes les rotations, avec celle en cours, la
 * précédente et la prochaine connue.
 *
 * `?locale=` choisit la langue des noms ; à défaut, celle du visiteur (cookie
 * puis `Accept-Language`). Données publiques, donc pas d'auth.
 *
 * `now` est l'horloge du serveur au moment de la réponse : le client s'en sert
 * pour dire d'où viennent `current`/`previous`/`next`, et peut les recalculer
 * avec sa propre horloge à partir de `rotations`.
 */
export async function GET(request: NextRequest) {
  const requested = new URL(request.url).searchParams.get("locale");
  const locale = requested && locales.includes(requested as Locale) ? (requested as Locale) : getApiLocale(request);

  const now = Date.now();
  const rotations = (await getTheatreRotations()).map((r) => toRotationView(r, locale));
  const overview = theatreOverview(rotations, now);

  return NextResponse.json(
    {
      now: new Date(now).toISOString(),
      locale,
      current: overview.current,
      previous: overview.previous,
      next: overview.next,
      rotations: overview.rotations,
    },
    // Court : la bascule d'une rotation doit se voir dans la minute.
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
