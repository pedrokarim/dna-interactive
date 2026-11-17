"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ExternalLink, Loader2, LocateFixed, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/components/dna";
import { useDialogA11y } from "@/components/dna/useDialogA11y";
import { diffDays, versionAt, type CalendarEvent, type EventHistory } from "@/lib/events/calendar";
import {
  CATEGORY_KEY,
  CATEGORY_SLUG,
  STATUS_TONE,
  categoryTint,
  lengthOf,
  progressOf,
  statusOf,
  useCalendarFormat,
} from "./calendar-ui";

type SheetData = { event: CalendarEvent } & EventHistory;

type CalendarEventSheetProps = {
  /** Identifiant de l'événement affiché. */
  eventId: string;
  /** Données déjà chargées par la frise : affichées sans attendre l'API. */
  initialEvent?: CalendarEvent;
  today: string;
  dayFraction: number;
  onClose: () => void;
  /** Ouvre un autre événement (édition précédente…) dans la même fiche. */
  onSelect: (id: string) => void;
  /** Ferme la fiche et amène la frise sur l'événement. */
  onLocate: (event: CalendarEvent) => void;
};

/** Libellé du lien vers la page liée, d'après sa route. */
function hrefLabelKey(href: string) {
  if (href.startsWith("/characters")) return "sheet.characterPage" as const;
  if (href.startsWith("/items/weapons")) return "sheet.weaponPage" as const;
  if (href.startsWith("/cosmetics")) return "sheet.cosmeticsPage" as const;
  return "sheet.page" as const;
}

const isExternal = (src: string) => !src.startsWith("/");

/**
 * Fiche d'un événement du calendrier : panneau à droite sur PC, modal qui
 * monte du bas sur téléphone. Le haut de la fiche (image, statut, dates,
 * description, liens) s'affiche tout de suite avec les données de la frise ;
 * l'historique (éditions de la même série, derniers événements de la
 * catégorie) arrive de `/api/calendar/events/[id]`.
 */
export function CalendarEventSheet({
  eventId,
  initialEvent,
  today,
  dayFraction,
  onClose,
  onSelect,
  onLocate,
}: CalendarEventSheetProps) {
  const t = useTranslations("calendarUi");
  const tHub = useTranslations("homeHub");
  const tCommon = useTranslations("common");
  const { fmt, date, short, statusText } = useCalendarFormat();

  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useDialogA11y(panelRef, { onClose });

  const [state, setState] = useState<{ id: string; data?: SheetData; error?: "missing" | "failed" }>({ id: eventId });

  useEffect(() => {
    const controller = new AbortController();
    scrollRef.current?.scrollTo({ top: 0 });
    fetch(`/api/calendar/events/${encodeURIComponent(eventId)}`, { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 404) return setState({ id: eventId, error: "missing" });
        if (!res.ok) return setState({ id: eventId, error: "failed" });
        setState({ id: eventId, data: (await res.json()) as SheetData });
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name !== "AbortError") setState({ id: eventId, error: "failed" });
      });
    return () => controller.abort();
  }, [eventId]);

  const current = state.id === eventId ? state : { id: eventId };
  const ev = current.data?.event ?? (initialEvent?.id === eventId ? initialEvent : undefined);
  const history = current.data;

  const tint = ev ? categoryTint(ev.category) : "var(--color-gold)";
  const status = ev ? statusOf(ev, today) : "ongoing";
  const version = ev ? versionAt(ev.start) : null;

  const editions = history?.editions ?? [];
  const rank = ev ? editions.findIndex((e) => e.id === ev.id) + 1 : 0;
  const before = ev ? editions.filter((e) => e.start < ev.start).reverse() : [];
  const next = ev ? editions.find((e) => e.start > ev.start) : undefined;

  let summary = "";
  if (ev && editions.length > 1) {
    const month = fmt.monthYear.format(date(editions[0].start));
    const gaps = editions.slice(1).map((e, i) => diffDays(editions[i].start, e.start));
    const average = Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length);
    summary =
      editions.length >= 3
        ? t("sheet.summaryWithAverage", { count: editions.length, month, average })
        : t("sheet.summary", { count: editions.length, month });
    if (before.length) summary += ` ${t("sheet.previousGap", { days: diffDays(before[0].end, ev.start) })}`;
  }

  return (
    <div className="fixed inset-0 z-[200]">
      <div aria-hidden className="dna-fade-in absolute inset-0 bg-black/65" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-sheet-title"
        tabIndex={-1}
        style={{ "--tint": tint } as CSSProperties}
        className={cn(
          "dna-sheet absolute flex flex-col bg-panel shadow-[0_0_60px_rgba(0,0,0,0.55)] outline-none",
          // PC : panneau pleine hauteur à droite. Téléphone : modal posée en bas.
          "inset-y-0 right-0 w-full max-w-[480px] border-l border-line/25",
          "max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:max-h-[92dvh] max-md:max-w-none max-md:rounded-t-xl max-md:border-l-0 max-md:border-t",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={tCommon("close")}
          className="absolute right-3 top-3 z-[2] grid h-9 w-9 place-items-center rounded-sm border border-line/30 bg-ink/85 text-parch transition-colors hover:border-gold hover:text-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 max-md:top-7"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        {/* poignée : repère la modal sur téléphone */}
        <div aria-hidden className="hidden h-5 shrink-0 max-md:block">
          <span className="mx-auto mt-2 block h-1 w-10 rounded-full bg-muted-2" />
        </div>

        <div ref={scrollRef} className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="relative aspect-video w-full bg-ink-2">
            {ev?.image ? (
              <Image
                src={ev.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                quality={75}
                unoptimized={isExternal(ev.image)}
                className="object-cover object-[50%_28%]"
              />
            ) : null}
          </div>

          <div className="min-w-0 px-5 pb-8 pt-4 max-md:px-4">
            {ev ? (
              <>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem] text-muted">
                  <span className="inline-flex items-center gap-1.5 text-parch">
                    <span aria-hidden className="h-2 w-2 rounded-[2px]" style={{ background: tint }} />
                    {tHub(CATEGORY_KEY[ev.category])}
                  </span>
                  {version ? <span>{t("sheet.version", { version: version.version, name: version.name })}</span> : null}
                  {editions.length > 1 && rank > 0 ? <span>{t("sheet.edition", { rank })}</span> : null}
                </div>

                <h2 id="calendar-sheet-title" className="mt-1.5 break-words font-display text-[1.75rem] font-semibold leading-tight text-parch max-md:text-2xl">
                  {ev.title}
                </h2>
                <p className={cn("mt-1 text-[0.92rem]", STATUS_TONE[status])}>{statusText(ev, today)}</p>

                {status === "ongoing" ? (
                  <div className="mt-3">
                    <div className="h-1 overflow-hidden rounded-full bg-parch/10">
                      <div className="h-full" style={{ width: `${progressOf(ev, today, dayFraction) * 100}%`, background: tint }} />
                    </div>
                    <div className="mt-1 flex justify-between text-[0.76rem] text-muted">
                      <span>{short(ev.start)}</span>
                      <span>{short(ev.end)}</span>
                    </div>
                  </div>
                ) : null}

                <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-line/15 py-3">
                  {[
                    [t("sheet.start"), fmt.withWeekday.format(date(ev.start))],
                    [t("sheet.end"), fmt.withWeekday.format(date(ev.end))],
                    [t("sheet.duration"), t("days", { days: lengthOf(ev) })],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="font-caps text-[0.62rem] uppercase tracking-[0.14em] text-muted">{label}</dt>
                      <dd className="mt-0.5 break-words text-[0.9rem] text-parch">{value}</dd>
                    </div>
                  ))}
                </dl>

                {ev.description ? <p className="mt-4 text-[0.93rem] leading-relaxed text-parch/85">{ev.description}</p> : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {ev.href ? (
                    <Link
                      href={ev.href}
                      className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-gold/60 bg-gold/10 px-3 text-sm text-gold-bright transition-colors hover:border-gold hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                    >
                      {t(hrefLabelKey(ev.href))}
                    </Link>
                  ) : null}
                  {ev.sourceUrl ? (
                    <a
                      href={ev.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line/30 px-3 text-sm text-parch transition-colors hover:border-gold hover:text-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                    >
                      {tHub("officialAnnouncement")}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onLocate(ev)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line/30 px-3 text-sm text-parch transition-colors hover:border-gold hover:text-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                  >
                    <LocateFixed className="h-3.5 w-3.5" aria-hidden />
                    {t("sheet.locate")}
                  </button>
                </div>
              </>
            ) : current.error ? null : (
              <div className="h-40" />
            )}

            {current.error ? (
              <p className="mt-4 text-sm text-muted">{current.error === "missing" ? t("sheet.notFound") : t("sheet.error")}</p>
            ) : !history ? (
              <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t("sheet.loading")}
              </p>
            ) : ev ? (
              <>
                {editions.length > 1 ? (
                  <section className="mt-7">
                    <h3 className="font-caps text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
                      {before.length ? t("sheet.previousEditionsCount", { count: before.length }) : t("sheet.previousEditions")}
                    </h3>
                    <p className="mt-1 text-[0.85rem] text-muted">{summary}</p>
                    {before.length ? (
                      <ul className="mt-1">
                        {before.map((e) => (
                          <MiniRow key={e.id} ev={e} today={today} onSelect={onSelect} />
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-[0.85rem] text-muted">{t("sheet.firstEdition")}</p>
                    )}
                  </section>
                ) : null}
                {next ? (
                  <section className="mt-6">
                    <h3 className="font-caps text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">{t("sheet.nextEdition")}</h3>
                    <ul className="mt-1">
                      <MiniRow ev={next} today={today} onSelect={onSelect} />
                    </ul>
                  </section>
                ) : null}
                {history.previousInCategory.length ? (
                  <section className="mt-6">
                    <h3 className="font-caps text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
                      {t(`previousOf.${CATEGORY_SLUG[ev.category]}`)}
                    </h3>
                    <ul className="mt-1">
                      {history.previousInCategory.map((e) => (
                        <MiniRow key={e.id} ev={e} today={today} onSelect={onSelect} />
                      ))}
                    </ul>
                  </section>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Ligne compacte d'un autre événement, qui s'ouvre dans la même fiche. */
function MiniRow({ ev, today, onSelect }: { ev: CalendarEvent; today: string; onSelect: (id: string) => void }) {
  const t = useTranslations("calendarUi");
  const { range } = useCalendarFormat();
  const version = versionAt(ev.start);
  const status = statusOf(ev, today);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(ev.id)}
        className="grid w-full grid-cols-[56px_minmax(0,1fr)] items-center gap-2.5 border-b border-line/10 px-1 py-2 text-left transition-colors hover:bg-parch/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60"
      >
        <span className="relative block h-8 w-14 overflow-hidden rounded-[2px] bg-ink-2">
          {ev.image ? (
            <Image src={ev.image} alt="" fill sizes="64px" quality={60} unoptimized={isExternal(ev.image)} className="object-cover" />
          ) : null}
        </span>
        <span className="min-w-0">
          <span className="block break-words text-[0.9rem] leading-snug text-parch">{ev.title}</span>
          <span className="block text-[0.76rem] text-muted">
            {range(ev.start, ev.end)} · {t("days", { days: lengthOf(ev) })}
            {version ? ` · ${t("sheet.versionShort", { version: version.version })}` : ""}
            {status === "ongoing" ? <span className="text-anemo"> · {t("sheet.tagLive")}</span> : null}
            {status === "upcoming" ? <span className="text-hydro"> · {t("sheet.tagUpcoming")}</span> : null}
          </span>
        </span>
      </button>
    </li>
  );
}
