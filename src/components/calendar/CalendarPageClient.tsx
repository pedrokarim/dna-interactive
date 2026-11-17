"use client";

import { useCallback, useMemo } from "react";
import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { CalendarComingSoon } from "@/components/calendar/CalendarComingSoon";
import { CalendarTimeline, type CalendarView } from "@/components/calendar/CalendarTimeline";
import { useToday } from "@/components/calendar/calendar-ui";
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
const VIEWS = ["timeline", "list"] as const;

export type CalendarPageClientProps = {
  events: CalendarEvent[];
  initialFrom: string;
  initialTo: string;
  /** Événements autour d'aujourd'hui, pour « Se terminent / Commencent bientôt ». */
  soonEvents: CalendarEvent[];
  serverToday: string;
  overrideToday?: string;
};

/**
 * Calendrier plein écran. Zoom, filtres, vue, date affichée et fiche ouverte
 * vivent dans l'URL pour que le lien se partage. La date suit le défilement en
 * `replace`. Ouvrir une fiche fait un `push`, pour que le bouton Retour du
 * téléphone la referme.
 */
export function CalendarPageClient({
  events,
  initialFrom,
  initialTo,
  soonEvents,
  serverToday,
  overrideToday,
}: CalendarPageClientProps) {
  const [q, setQ] = useQueryStates(
    {
      date: parseAsString,
      span: parseAsInteger,
      cats: parseAsArrayOf(parseAsString),
      view: parseAsStringLiteral(VIEWS),
      event: parseAsString,
    },
    { history: "replace" },
  );
  const { today } = useToday(serverToday, overrideToday);

  const span: CalendarZoom = q.span && isZoom(q.span) ? q.span : DEFAULT_ZOOM;
  const focusDate = q.date && ISO_DATE.test(q.date) ? q.date : undefined;
  const active = useMemo<Set<EventCategory>>(() => {
    if (!q.cats) return new Set(CATEGORIES);
    const valid = q.cats.filter((c): c is EventCategory => (CATEGORIES as string[]).includes(c));
    return valid.length ? new Set(valid) : new Set(CATEGORIES);
  }, [q.cats]);

  const onZoom = (z: CalendarZoom) => void setQ({ span: z === DEFAULT_ZOOM ? null : z });
  const onViewDateChange = useCallback((iso: string) => void setQ({ date: iso }), [setQ]);
  const onViewChange = useCallback((view: CalendarView) => void setQ({ view }), [setQ]);
  const onSelect = useCallback(
    (id: string | null) => void setQ({ event: id }, { history: id ? "push" : "replace" }),
    [setQ],
  );
  const toggleCat = (cat: EventCategory) => {
    const next = new Set(active);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    // toutes les catégories = pas de param (URL propre)
    void setQ({ cats: next.size === CATEGORIES.length ? null : Array.from(next) });
  };

  return (
    <div className="space-y-6">
      <CalendarComingSoon events={soonEvents.filter((e) => active.has(e.category))} today={today} onSelect={onSelect} />
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
        view={q.view}
        onViewChange={onViewChange}
        selectedId={q.event}
        onSelect={onSelect}
      />
    </div>
  );
}
