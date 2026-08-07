"use client";

import { useCallback, useMemo } from "react";
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { CalendarTimeline } from "@/components/calendar/CalendarTimeline";
import {
  CALENDAR_ZOOMS,
  CATEGORIES,
  DEFAULT_ZOOM,
  type CalendarEvent,
  type CalendarZoom,
  type EventCategory,
} from "@/lib/events/calendar";

function isZoom(n: number): n is CalendarZoom {
  return (CALENDAR_ZOOMS as readonly number[]).includes(n);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type CalendarPageClientProps = {
  events: CalendarEvent[];
  initialFrom: string;
  initialTo: string;
  serverToday: string;
  overrideToday?: string;
};

/**
 * Calendrier plein écran — zoom, filtres et **date regardée** dans l'URL (lien
 * partageable). La date suit le défilement en `replace` pour ne pas empiler
 * d'entrées dans l'historique du navigateur.
 */
export function CalendarPageClient({ events, initialFrom, initialTo, serverToday, overrideToday }: CalendarPageClientProps) {
  const [q, setQ] = useQueryStates(
    {
      date: parseAsString,
      span: parseAsInteger,
      cats: parseAsArrayOf(parseAsString),
    },
    { history: "replace" },
  );

  const span: CalendarZoom = q.span && isZoom(q.span) ? q.span : DEFAULT_ZOOM;
  const focusDate = q.date && ISO_DATE.test(q.date) ? q.date : undefined;
  const active = useMemo<Set<EventCategory>>(() => {
    if (!q.cats) return new Set(CATEGORIES);
    const valid = q.cats.filter((c): c is EventCategory => (CATEGORIES as string[]).includes(c));
    return valid.length ? new Set(valid) : new Set(CATEGORIES);
  }, [q.cats]);

  const onZoom = (z: CalendarZoom) => void setQ({ span: z === DEFAULT_ZOOM ? null : z });
  const onViewDateChange = useCallback((iso: string) => void setQ({ date: iso }), [setQ]);
  const toggleCat = (cat: EventCategory) => {
    const next = new Set(active);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    // toutes les catégories = pas de param (URL propre)
    void setQ({ cats: next.size === CATEGORIES.length ? null : Array.from(next) });
  };

  return (
    <CalendarTimeline
      initialEvents={events}
      initialFrom={initialFrom}
      initialTo={initialTo}
      serverToday={serverToday}
      overrideToday={overrideToday}
      span={span}
      active={active}
      onZoom={onZoom}
      onToggleCat={toggleCat}
      focusDate={focusDate}
      onViewDateChange={onViewDateChange}
      variant="full"
    />
  );
}
