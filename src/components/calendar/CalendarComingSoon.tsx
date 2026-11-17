"use client";

import { useTranslations } from "next-intl";
import { diffDays, type CalendarEvent } from "@/lib/events/calendar";
import { categoryTint, statusOf } from "./calendar-ui";

/** Horizon des deux listes (jours). */
const ENDING_WITHIN = 5;
const STARTING_WITHIN = 7;

type CalendarComingSoonProps = {
  events: CalendarEvent[];
  today: string;
  onSelect: (id: string) => void;
};

/**
 * Ce qui se termine et ce qui commence dans les prochains jours : la question
 * qu'on se pose en ouvrant le calendrier, avant même de lire la frise.
 */
export function CalendarComingSoon({ events, today, onSelect }: CalendarComingSoonProps) {
  const t = useTranslations("calendarUi");

  const ending = events
    .filter((e) => statusOf(e, today) === "ongoing" && diffDays(today, e.end) <= ENDING_WITHIN)
    .sort((a, b) => a.end.localeCompare(b.end));
  const starting = events
    .filter((e) => statusOf(e, today) === "upcoming" && diffDays(today, e.start) <= STARTING_WITHIN)
    .sort((a, b) => a.start.localeCompare(b.start));

  const column = (title: string, list: CalendarEvent[], when: (e: CalendarEvent) => number, empty: string) => (
    <section className="min-w-0">
      <h2 className="mb-2 flex items-baseline gap-2 font-caps text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
        {title}
        {list.length ? <span className="font-sans text-[0.8rem] tracking-normal text-parch">{list.length}</span> : null}
      </h2>
      <ul className="border-t border-line/10">
        {list.length ? (
          list.map((ev) => (
            <li key={ev.id}>
              <button
                type="button"
                onClick={() => onSelect(ev.id)}
                className="grid w-full grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-line/10 px-1 py-2 text-left transition-colors hover:bg-parch/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60"
              >
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: categoryTint(ev.category) }} />
                <span className="min-w-0 break-words text-[0.95rem] text-parch">{ev.title}</span>
                <span className="whitespace-nowrap text-[0.82rem] text-gold-bright">{t("soon.when", { days: when(ev) })}</span>
              </button>
            </li>
          ))
        ) : (
          <li className="px-1 py-2 text-[0.85rem] text-muted">{empty}</li>
        )}
      </ul>
    </section>
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
      {column(t("soon.ending"), ending, (e) => diffDays(today, e.end), t("soon.noneEnding"))}
      {column(t("soon.starting"), starting, (e) => diffDays(today, e.start), t("soon.noneStarting"))}
    </div>
  );
}
