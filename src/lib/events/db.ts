import "server-only";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { CALENDAR_EVENTS, CATEGORIES, eventsInRange, type CalendarEvent, type EventCategory } from "./calendar";

function toCategory(value: string): EventCategory {
  return (CATEGORIES as string[]).includes(value) ? (value as EventCategory) : "Événement";
}

type Row = typeof schema.calendarEvents.$inferSelect;

function toEvent(r: Row): CalendarEvent {
  return {
    id: r.id,
    title: r.title,
    category: toCategory(r.category),
    start: r.startDate,
    end: r.endDate,
    href: r.href ?? undefined,
    image: r.image ?? undefined,
    description: r.description ?? undefined,
    sourceUrl: r.sourceUrl ?? undefined,
  };
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
    return rows.map(toEvent);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return CALENDAR_EVENTS;
  }
}

/**
 * Événements **chevauchant** `[fromIso, toIso]` — la frise ne charge que ce qui
 * l'entoure, jamais tout l'historique. Le filtre se fait en SQL (les dates sont
 * du texte ISO, donc l'ordre lexicographique = l'ordre chronologique, et
 * `idx_calendar_events_dates` s'applique). Même repli statique que ci-dessus.
 */
export async function getCalendarEventsInRange(fromIso: string, toIso: string): Promise<CalendarEvent[]> {
  const db = getDb();
  try {
    const rows = await db
      .select()
      .from(schema.calendarEvents)
      .where(
        and(
          eq(schema.calendarEvents.hidden, false),
          gte(schema.calendarEvents.endDate, fromIso),
          lte(schema.calendarEvents.startDate, toIso),
        ),
      )
      .orderBy(asc(schema.calendarEvents.startDate), asc(schema.calendarEvents.sortOrder));
    // Table vide (pas seulement « rien dans la fenêtre ») → repli statique.
    if (rows.length === 0) {
      const [any] = await db.select({ id: schema.calendarEvents.id }).from(schema.calendarEvents).limit(1);
      return any ? [] : eventsInRange(CALENDAR_EVENTS, fromIso, toIso);
    }
    return rows.map(toEvent);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return eventsInRange(CALENDAR_EVENTS, fromIso, toIso);
  }
}
