import { NextResponse, type NextRequest } from "next/server";
import { getCalendarEventWithHistory } from "@/lib/events/db";

export const dynamic = "force-dynamic";

/** UUID en base, slug pour la liste statique de repli. */
const EVENT_ID = /^[\w-]{1,80}$/;

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Fiche d'un événement : l'événement, toutes les éditions de sa série et les
 * derniers événements de sa catégorie. Mêmes données que la frise, donc pas
 * d'auth.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!EVENT_ID.test(id)) return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });

  const data = await getCalendarEventWithHistory(id);
  if (!data) return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
