import { NextResponse, type NextRequest } from "next/server";
import { getCalendarEventsInRange } from "@/lib/events/db";
import { addDaysIso, diffDays } from "@/lib/events/calendar";

export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Garde-fou : une requête ne peut pas ratisser plus large que ça (≈ 5 ans). */
const MAX_SPAN_DAYS = 1830;

function isValid(iso: string | null): iso is string {
  return !!iso && ISO_DATE.test(iso) && !Number.isNaN(Date.parse(iso));
}

/**
 * Fenêtre d'événements du calendrier : `?from=AAAA-MM-JJ&to=AAAA-MM-JJ`.
 *
 * La frise appelle cet endpoint au fil du défilement pour ne charger que ce qui
 * entoure la période regardée. Données publiques (mêmes que le rendu serveur),
 * donc pas d'auth ; la plage est bornée pour qu'on ne puisse pas demander le
 * siècle entier d'un coup.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!isValid(from) || !isValid(to)) {
    return NextResponse.json({ error: "Paramètres `from` et `to` requis au format AAAA-MM-JJ." }, { status: 400 });
  }
  if (diffDays(from, to) < 0) {
    return NextResponse.json({ error: "`to` doit être postérieur à `from`." }, { status: 400 });
  }

  const cappedTo = diffDays(from, to) > MAX_SPAN_DAYS ? addDaysIso(from, MAX_SPAN_DAYS) : to;
  const events = await getCalendarEventsInRange(from, cappedTo);

  return NextResponse.json(
    { from, to: cappedTo, events },
    // Court, mais suffisant pour absorber les allers-retours de défilement.
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
