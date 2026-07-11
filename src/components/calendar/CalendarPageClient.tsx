"use client";

import { useMemo } from "react";
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { CalendarView } from "@/components/home/EventCalendar";
import {
  CALENDAR_ZOOMS,
  CATEGORIES,
  DEFAULT_ZOOM,
  addDaysIso,
  defaultWindowStart,
  type CalendarEvent,
  type CalendarZoom,
  type EventCategory,
} from "@/lib/events/calendar";

function isZoom(n: number): n is CalendarZoom {
  return (CALENDAR_ZOOMS as readonly number[]).includes(n);
}

/** Calendrier plein écran — état (fenêtre / zoom / filtres) synchronisé dans l'URL. */
export function CalendarPageClient({ events, refToday }: { events?: CalendarEvent[]; refToday?: string }) {
  const [q, setQ] = useQueryStates({
    start: parseAsString,
    span: parseAsInteger,
    cats: parseAsArrayOf(parseAsString),
  });

  const span: CalendarZoom = q.span && isZoom(q.span) ? q.span : DEFAULT_ZOOM;
  const windowStart = q.start ?? defaultWindowStart(span, refToday);
  const active = useMemo<Set<EventCategory>>(() => {
    if (!q.cats) return new Set(CATEGORIES);
    const valid = q.cats.filter((c): c is EventCategory => (CATEGORIES as string[]).includes(c));
    return valid.length ? new Set(valid) : new Set(CATEGORIES);
  }, [q.cats]);

  const shift = (days: number) => void setQ({ start: addDaysIso(windowStart, days) });
  const goToday = () => void setQ({ start: defaultWindowStart(span, refToday) });
  const changeZoom = (z: CalendarZoom) => {
    const center = addDaysIso(windowStart, Math.round(span / 2));
    void setQ({ start: addDaysIso(center, -Math.round(z / 2)), span: z });
  };
  const toggleCat = (cat: EventCategory) => {
    const next = new Set(active);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    // fenêtre complète = pas de param (URL propre)
    void setQ({ cats: next.size === CATEGORIES.length ? null : Array.from(next) });
  };

  return (
    <CalendarView
      windowStart={windowStart}
      span={span}
      active={active}
      onShift={shift}
      onToday={goToday}
      onZoom={changeZoom}
      onToggleCat={toggleCat}
      events={events}
      refToday={refToday}
      variant="full"
    />
  );
}
