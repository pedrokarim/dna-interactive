import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { CALENDAR_EVENTS, CATEGORIES, type CalendarEvent, type EventCategory } from "./calendar";

function toCategory(value: string): EventCategory {
  return (CATEGORIES as string[]).includes(value) ? (value as EventCategory) : "Événement";
}

/**
 * Événements du calendrier depuis la BDD (`calendar_events`, non masqués).
 * **Fallback** sur la liste curée statique si la table est vide ou absente
 * (jamais de calendrier vide, et ça marche avant la migration).
 */
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const db = getDb();
  try {
    const rows = await db
      .select()
      .from(schema.calendarEvents)
      .where(eq(schema.calendarEvents.hidden, false))
      .orderBy(asc(schema.calendarEvents.sortOrder), asc(schema.calendarEvents.startDate));
    if (rows.length === 0) return CALENDAR_EVENTS;
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: toCategory(r.category),
      start: r.startDate,
      end: r.endDate,
      href: r.href ?? undefined,
      image: r.image ?? undefined,
      description: r.description ?? undefined,
      sourceUrl: r.sourceUrl ?? undefined,
    }));
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return CALENDAR_EVENTS;
  }
}
