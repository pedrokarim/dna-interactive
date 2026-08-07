"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CalendarTimeline } from "@/components/calendar/CalendarTimeline";
import {
  CATEGORIES,
  DEFAULT_ZOOM,
  type CalendarEvent,
  type CalendarZoom,
  type EventCategory,
} from "@/lib/events/calendar";

export type EventCalendarProps = {
  /** Événements de la fenêtre initiale, rendus côté serveur. */
  events: CalendarEvent[];
  initialFrom: string;
  initialTo: string;
  serverToday: string;
  /** Forçage admin de la date de référence (vide = horloge du visiteur). */
  overrideToday?: string;
};

/** Calendrier de la home — zoom et filtres en état local, frise défilable partagée. */
export function EventCalendar({ events, initialFrom, initialTo, serverToday, overrideToday }: EventCalendarProps) {
  const t = useTranslations("homeHub");
  const [span, setSpan] = useState<CalendarZoom>(DEFAULT_ZOOM);
  const [active, setActive] = useState<Set<EventCategory>>(() => new Set(CATEGORIES));

  const toggleCat = (cat: EventCategory) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  return (
    <CalendarTimeline
      initialEvents={events}
      initialFrom={initialFrom}
      initialTo={initialTo}
      serverToday={serverToday}
      overrideToday={overrideToday}
      span={span}
      active={active}
      onZoom={setSpan}
      onToggleCat={toggleCat}
      headerRight={
        <Link
          href="/calendar"
          className="rounded-sm border border-line/25 px-2.5 py-1 font-caps text-[0.55rem] uppercase tracking-[0.14em] text-gold hover:border-gold hover:text-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          {t("fullScreen")} →
        </Link>
      }
    />
  );
}
