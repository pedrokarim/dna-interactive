"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/components/dna";
import { diffDays, type CalendarEvent } from "@/lib/events/calendar";
import { CATEGORY_KEY, categoryTint, progressOf, statusOf, useCalendarFormat } from "./calendar-ui";

/** Les événements finis depuis plus longtemps que ça ne sont pas listés. */
const RECENT_DAYS = 45;

type CalendarAgendaProps = {
  events: CalendarEvent[];
  today: string;
  dayFraction: number;
  selectedId?: string | null;
  onSelect: (id: string) => void;
};

/**
 * Vue liste du calendrier, par défaut sur téléphone : en cours (fin la plus
 * proche d'abord), à venir, puis les événements finis récemment, repliés.
 */
export function CalendarAgenda({ events, today, dayFraction, selectedId, onSelect }: CalendarAgendaProps) {
  const t = useTranslations("calendarUi");

  const live = events.filter((e) => statusOf(e, today) === "ongoing").sort((a, b) => a.end.localeCompare(b.end));
  const upcoming = events.filter((e) => statusOf(e, today) === "upcoming").sort((a, b) => a.start.localeCompare(b.start));
  const recent = events
    .filter((e) => statusOf(e, today) === "past" && diffDays(e.end, today) <= RECENT_DAYS)
    .sort((a, b) => b.end.localeCompare(a.end));

  if (!live.length && !upcoming.length && !recent.length) {
    return <p className="py-10 text-center text-sm text-muted">{t("list.empty")}</p>;
  }

  const row = (ev: CalendarEvent) => (
    <AgendaRow key={ev.id} ev={ev} today={today} dayFraction={dayFraction} selected={ev.id === selectedId} onSelect={onSelect} />
  );
  const heading = "mb-1 font-caps text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted";

  return (
    <div className="space-y-5">
      {live.length ? (
        <section>
          <h3 className={heading}>{t("list.live", { count: live.length })}</h3>
          <ul>{live.map(row)}</ul>
        </section>
      ) : null}
      {upcoming.length ? (
        <section>
          <h3 className={heading}>{t("list.upcoming", { count: upcoming.length })}</h3>
          <ul>{upcoming.map(row)}</ul>
        </section>
      ) : null}
      {recent.length ? (
        <details className="group">
          <summary className={cn(heading, "flex cursor-pointer list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden")}>
            <ChevronDown className="h-3.5 w-3.5 -rotate-90 transition-transform group-open:rotate-0" aria-hidden />
            {t("list.recent", { count: recent.length })}
          </summary>
          <ul>{recent.map(row)}</ul>
        </details>
      ) : null}
    </div>
  );
}

function AgendaRow({
  ev,
  today,
  dayFraction,
  selected,
  onSelect,
}: {
  ev: CalendarEvent;
  today: string;
  dayFraction: number;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("calendarUi");
  const tHub = useTranslations("homeHub");
  const { range, short } = useCalendarFormat();
  const status = statusOf(ev, today);
  const tint = categoryTint(ev.category);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(ev.id)}
        aria-current={selected ? "true" : undefined}
        className={cn(
          // Téléphone : deux colonnes, le temps restant passe sous les dates
          // pour laisser toute la largeur au titre.
          "grid w-full grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line/10 px-1.5 py-2 text-left transition-colors hover:bg-parch/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60 max-sm:grid-cols-[52px_minmax(0,1fr)] max-sm:items-start max-sm:gap-x-2.5 max-sm:gap-y-1",
          selected && "bg-parch/[0.05]",
        )}
      >
        <span className="relative block h-9 w-16 overflow-hidden rounded-[2px] bg-ink-2 max-sm:h-[30px] max-sm:w-[52px]">
          {ev.image ? (
            <Image src={ev.image} alt="" fill sizes="64px" quality={60} unoptimized={!ev.image.startsWith("/")} className="object-cover" />
          ) : null}
        </span>
        <span className="min-w-0">
          <span className="block break-words text-[0.92rem] leading-snug text-parch">{ev.title}</span>
          <span className="mt-0.5 flex min-w-0 items-start gap-1.5 text-[0.78rem] text-muted">
            <span aria-hidden className="mt-[5px] h-2 w-2 shrink-0 rounded-[2px]" style={{ background: tint }} />
            <span className="min-w-0 break-words">
              {tHub(CATEGORY_KEY[ev.category])} · {range(ev.start, ev.end)}
            </span>
          </span>
        </span>
        <span className="text-right text-[0.8rem] max-sm:col-start-2 max-sm:flex max-sm:items-center max-sm:gap-2 max-sm:text-left">
          {status === "ongoing" ? (
            <>
              <span className="whitespace-nowrap text-gold-bright">{t("list.remaining", { days: diffDays(today, ev.end) })}</span>
              <span className="ml-auto mt-1 block h-[3px] w-20 overflow-hidden rounded-full bg-parch/10 max-sm:m-0 max-sm:w-16">
                <span className="block h-full" style={{ width: `${progressOf(ev, today, dayFraction) * 100}%`, background: tint }} />
              </span>
            </>
          ) : status === "upcoming" ? (
            <span className="whitespace-nowrap text-hydro">{t("list.startsIn", { days: diffDays(today, ev.start) })}</span>
          ) : (
            <span className="whitespace-nowrap text-muted">{t("list.endedOn", { date: short(ev.end) })}</span>
          )}
        </span>
      </button>
    </li>
  );
}
