import "server-only";
import { and, asc, eq, gte, lte, or, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingColumnError, isMissingTableError } from "@/lib/db-errors";
import {
  CALENDAR_EVENTS,
  CATEGORIES,
  eventHistory,
  eventSeries,
  eventsInRange,
  type CalendarEvent,
  type EventCategory,
  type EventHistory,
} from "./calendar";

function toCategory(value: string): EventCategory {
  return (CATEGORIES as string[]).includes(value) ? (value as EventCategory) : "Événement";
}

const table = schema.calendarEvents;

/** Colonnes lues par le site. `series` à part : elle peut manquer avant sa migration. */
const BASE_COLUMNS = {
  id: table.id,
  title: table.title,
  category: table.category,
  startDate: table.startDate,
  endDate: table.endDate,
  image: table.image,
  href: table.href,
  description: table.description,
  sourceUrl: table.sourceUrl,
};

type Row = {
  id: string;
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  image: string | null;
  href: string | null;
  description: string | null;
  sourceUrl: string | null;
  series: string | null;
};

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
    series: r.series ?? undefined,
  };
}

/**
 * Lecture des événements visibles. Si la colonne `series` n'existe pas encore
 * (code déployé avant `db:migrate:calendar-series`), on relit sans elle : la
 * série est alors déduite du titre, et le calendrier reste affiché.
 */
async function selectEvents(where: SQL | undefined, orderBy: SQL[]): Promise<Row[]> {
  const db = getDb();
  const visible = where ? and(eq(table.hidden, false), where) : eq(table.hidden, false);
  try {
    return await db
      .select({ ...BASE_COLUMNS, series: table.series })
      .from(table)
      .where(visible)
      .orderBy(...orderBy);
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;
    const rows = await db
      .select(BASE_COLUMNS)
      .from(table)
      .where(visible)
      .orderBy(...orderBy);
    return rows.map((r) => ({ ...r, series: null }));
  }
}

/** La table contient-elle au moins une ligne (masquée ou non) ? */
async function tableHasRows(): Promise<boolean> {
  const [any] = await getDb().select({ id: table.id }).from(table).limit(1);
  return Boolean(any);
}

/**
 * Événements non masqués de `calendar_events`. Si la table est vide ou absente,
 * on sert la liste curée statique : le calendrier n'est jamais vide, même avant
 * la migration.
 */
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const rows = await selectEvents(undefined, [asc(table.sortOrder), asc(table.startDate)]);
    if (rows.length === 0) return CALENDAR_EVENTS;
    return rows.map(toEvent);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return CALENDAR_EVENTS;
  }
}

/**
 * Événements qui chevauchent `[fromIso, toIso]`, pour que la frise ne charge
 * que ce qui l'entoure. Filtre en SQL : les dates sont du texte ISO, l'ordre
 * alphabétique est donc l'ordre chronologique et `idx_calendar_events_dates`
 * sert. Même repli statique que ci-dessus.
 */
export async function getCalendarEventsInRange(fromIso: string, toIso: string): Promise<CalendarEvent[]> {
  try {
    const rows = await selectEvents(and(gte(table.endDate, fromIso), lte(table.startDate, toIso)), [
      asc(table.startDate),
      asc(table.sortOrder),
    ]);
    // Repli statique seulement si toute la table est vide, pas juste la fenêtre.
    if (rows.length === 0) {
      return (await tableHasRows()) ? [] : eventsInRange(CALENDAR_EVENTS, fromIso, toIso);
    }
    return rows.map(toEvent);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return eventsInRange(CALENDAR_EVENTS, fromIso, toIso);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Un événement et son historique (éditions de la même série, derniers
 * événements de sa catégorie), pour la fiche de la frise. `null` si
 * l'identifiant ne correspond à rien de visible.
 *
 * Les identifiants en base sont des UUID ; ceux de la liste statique (repli
 * quand la table est vide) sont des slugs.
 */
export async function getCalendarEventWithHistory(
  id: string,
): Promise<({ event: CalendarEvent } & EventHistory) | null> {
  const fromStatic = () => {
    const event = CALENDAR_EVENTS.find((e) => e.id === id);
    return event ? { event, ...eventHistory(event, CALENDAR_EVENTS) } : null;
  };

  try {
    if (!UUID.test(id)) return (await tableHasRows()) ? null : fromStatic();
    const [row] = await selectEvents(eq(table.id, id), [asc(table.startDate)]);
    if (!row) return null;
    const event = toEvent(row);
    const series = eventSeries(event);
    // shortcut: toute la catégorie est relue pour retrouver la série déduite du titre ; filtrer sur `series` seul quand chaque ligne aura la sienne
    const candidates = await selectEvents(or(eq(table.category, row.category), eq(table.series, series)), [
      asc(table.startDate),
    ]).catch(async (error) => {
      // Sans la colonne `series`, la catégorie seule suffit (la série vient du titre).
      if (!isMissingColumnError(error)) throw error;
      return selectEvents(eq(table.category, row.category), [asc(table.startDate)]);
    });
    return { event, ...eventHistory(event, candidates.map(toEvent)) };
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return fromStatic();
  }
}
