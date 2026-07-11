"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, CalendarDays, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaCornerBrackets, cn } from "@/components/dna";
import {
  CALENDAR_TODAY,
  CALENDAR_ZOOMS,
  CATEGORIES,
  CATEGORY_TINT,
  DEFAULT_ZOOM,
  addDaysIso,
  computeRows,
  defaultWindowStart,
  diffDays,
  generateTicks,
  markerPct,
  type CalendarEvent,
  type CalendarRow,
  type CalendarZoom,
  type EventCategory,
} from "@/lib/events/calendar";

const ZOOM_LABEL: Record<CalendarZoom, string> = { 14: "2 sem.", 30: "1 mois", 60: "2 mois" };

/* ------------------------------------------------------------- vue présentation */

export type CalendarViewProps = {
  windowStart: string;
  span: CalendarZoom;
  active: Set<EventCategory>;
  onShift: (days: number) => void;
  onToday: () => void;
  onZoom: (z: CalendarZoom) => void;
  onToggleCat: (cat: EventCategory) => void;
  /** Source d'événements (BDD) ; défaut = liste curée statique. */
  events?: CalendarEvent[];
  /** Date de référence « aujourd'hui » (ISO) ; défaut = CALENDAR_TODAY. */
  refToday?: string;
  /** compact = home ; full = page dédiée (barres/labels plus grands). */
  variant?: "compact" | "full";
  /** Slot à droite de la barre d'outils (ex. lien « Plein écran »). */
  headerRight?: ReactNode;
};

/** Rendu du calendrier interactif (piloté par props ; l'état de sélection est local). */
export function CalendarView({
  windowStart,
  span,
  active,
  onShift,
  onToday,
  onZoom,
  onToggleCat,
  events,
  refToday,
  variant = "compact",
  headerRight,
}: CalendarViewProps) {
  const locale = useLocale();
  // timeZone UTC : nos dates ISO sont en UTC-minuit → même jour affiché partout.
  const dayFmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }), [locale]);
  const longFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
    [locale],
  );

  const [selected, setSelected] = useState<CalendarRow | null>(null);
  const [tip, setTip] = useState<{ row: CalendarRow; x: number; y: number } | null>(null);

  const step = Math.max(3, Math.round(span / 3));
  const activeList = useMemo(() => Array.from(active), [active]);
  const ref = refToday || CALENDAR_TODAY;
  const rows = useMemo(() => computeRows(windowStart, span, activeList, ref, events), [windowStart, span, activeList, ref, events]);
  const ticks = useMemo(() => generateTicks(windowStart, span), [windowStart, span]);
  const today = markerPct(ref, windowStart, span);
  const windowEnd = addDaysIso(windowStart, span);

  const range = (start: string, end: string) => `${dayFmt.format(new Date(start))} – ${dayFmt.format(new Date(end))}`;

  const detailInfo = (row: CalendarRow) => {
    if (row.status === "upcoming") {
      const d = diffDays(ref, row.start);
      return { label: "À venir", note: d > 0 ? `démarre dans ${d} j` : "démarre aujourd'hui", tone: "text-hydro" };
    }
    if (row.status === "past") return { label: "Terminé", note: "", tone: "text-muted" };
    const d = diffDays(ref, row.end);
    return { label: "En cours", note: d > 0 ? `se termine dans ${d} j` : "dernier jour", tone: "text-anemo" };
  };

  const full = variant === "full";
  const labelW = full ? "w-64" : "w-52";
  const barH = full ? "h-7" : "h-6";
  const ctrlBtn =
    "flex h-8 w-8 items-center justify-center rounded-sm border border-line/25 text-parch/75 transition-colors hover:border-gold hover:text-gold";

  return (
    <div className="relative overflow-hidden rounded-sm border border-line/20 bg-panel/60 p-4 sm:p-5">
      <DnaCornerBrackets size={14} />

      {/* barre d'outils : navigation + zoom */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" aria-label="Période précédente" onClick={() => onShift(-step)} className={ctrlBtn}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="flex items-center gap-1.5 rounded-sm border border-line/25 px-3 py-1.5 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-parch/80 transition-colors hover:border-gold hover:text-gold"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Aujourd'hui
        </button>
        <button type="button" aria-label="Période suivante" onClick={() => onShift(step)} className={ctrlBtn}>
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="ml-1 font-mono text-[0.68rem] text-muted">{range(windowStart, windowEnd)}</span>

        <div className="ml-auto flex items-center gap-1">
          {CALENDAR_ZOOMS.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => onZoom(z)}
              className={cn(
                "rounded-sm border px-2.5 py-1 font-caps text-[0.55rem] uppercase tracking-[0.14em] transition-colors",
                span === z ? "border-gold/50 bg-gold/12 text-gold-bright" : "border-line/25 text-muted hover:border-gold/40 hover:text-gold",
              )}
            >
              {ZOOM_LABEL[z]}
            </button>
          ))}
          {headerRight}
        </div>
      </div>

      {/* filtres par catégorie */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const on = active.has(cat);
          const tint = CATEGORY_TINT[cat];
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={on}
              onClick={() => onToggleCat(cat)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-caps text-[0.55rem] uppercase tracking-[0.14em] transition-colors",
                on ? "text-parch" : "text-muted opacity-55",
              )}
              style={{ borderColor: on ? tint : "var(--color-line)", background: on ? `${tint}1f` : "transparent" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: tint }} />
              {cat}
            </button>
          );
        })}
      </div>

      {/* timeline */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className={full ? "min-w-[820px]" : "min-w-[680px]"}>
          {/* axe + repère aujourd'hui */}
          <div className="mb-2.5 flex items-center gap-3">
            <span className={cn("shrink-0", labelW)} />
            <div className="relative h-4 flex-1">
              {ticks.map((t) => (
                <span key={t.iso} className="absolute -translate-x-1/2 font-mono text-[0.58rem] text-muted-2" style={{ left: `${t.pct}%` }}>
                  {dayFmt.format(new Date(t.iso))}
                </span>
              ))}
              {today !== null ? (
                <span
                  aria-hidden
                  className="absolute -bottom-1 -translate-x-1/2 font-caps text-[0.5rem] uppercase tracking-[0.14em] text-gold-bright"
                  style={{ left: `${today}%` }}
                >
                  ▾ Auj.
                </span>
              ) : null}
            </div>
          </div>

          {/* lignes */}
          {rows.length === 0 ? (
            <p className="py-6 text-center font-mono text-[0.7rem] text-muted-2">Aucun événement sur cette période.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {rows.map((r) => {
                const isSel = selected?.id === r.id;
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className={cn("flex shrink-0 items-center gap-2", labelW)}>
                      {r.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image} alt="" aria-hidden loading="lazy" className="h-7 w-7 shrink-0 rounded-sm border object-cover" style={{ borderColor: r.tint }} />
                      ) : (
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.tint }} />
                      )}
                      <span className="truncate text-[0.72rem] text-parch/85" title={r.title}>
                        {r.title}
                      </span>
                    </span>
                    <div className={cn("relative flex-1 rounded-sm bg-ink/50", barH)}>
                      {today !== null ? (
                        <span aria-hidden className="absolute inset-y-0 w-px bg-gold-bright/40" style={{ left: `${today}%` }} />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setSelected(isSel ? null : r)}
                        onMouseMove={(e) => setTip({ row: r, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setTip((t) => (t?.row.id === r.id ? null : t))}
                        aria-label={`${r.title} — ${range(r.start, r.end)}`}
                        className={cn(
                          "absolute inset-y-[3px] flex items-center overflow-hidden rounded-[3px] border px-2 transition-[filter,box-shadow]",
                          isSel ? "z-[2] shadow-[0_0_0_1px_var(--color-gold-bright)]" : "hover:brightness-125",
                        )}
                        style={{
                          left: `${r.leftPct}%`,
                          width: `${r.widthPct}%`,
                          borderColor: r.tint,
                          background: `linear-gradient(90deg, ${r.tint}44, ${r.tint}18)`,
                          opacity: r.status === "upcoming" ? 0.7 : r.status === "past" ? 0.5 : 1,
                        }}
                      >
                        {r.overflowLeft ? <span className="mr-1 text-[0.6rem] text-parch/70">‹</span> : null}
                        <span className="truncate font-mono text-[0.6rem] text-parch/90">{range(r.start, r.end)}</span>
                        {r.overflowRight ? <span className="ml-auto pl-1 text-[0.6rem] text-parch/70">›</span> : null}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* détail de l'événement sélectionné */}
      {selected ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-sm border border-line/20 bg-ink/40 p-3">
          <span className="flex items-center gap-2">
            {selected.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.image} alt="" aria-hidden className="h-8 w-8 rounded-sm border object-cover" style={{ borderColor: selected.tint }} />
            ) : (
              <span className="h-2 w-2 rounded-full" style={{ background: selected.tint }} />
            )}
            <span className="font-display text-sm text-parch">{selected.title}</span>
          </span>
          <span className="font-caps text-[0.55rem] uppercase tracking-[0.14em] text-muted">{selected.category}</span>
          <span className="font-mono text-[0.68rem] text-parch/75">
            {longFmt.format(new Date(selected.start))} → {longFmt.format(new Date(selected.end))}
          </span>
          {(() => {
            const info = detailInfo(selected);
            return (
              <span className={cn("font-caps text-[0.58rem] uppercase tracking-[0.14em]", info.tone)}>
                {info.label}
                {info.note ? <span className="ml-1.5 text-muted normal-case tracking-normal">· {info.note}</span> : null}
              </span>
            );
          })()}
          {selected.href ? (
            <Link href={selected.href} className="ml-auto inline-flex items-center gap-1 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-gold hover:text-gold-bright">
              Voir <ExternalLink className="h-3 w-3" />
            </Link>
          ) : null}
          {selected.description ? (
            <span className="w-full font-sans text-xs leading-relaxed text-parch/70">{selected.description}</span>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 font-mono text-[0.6rem] text-muted-2">
          Navigue avec ◀ ▶, zoome, filtre par catégorie, survole ou clique un événement pour le détail.
        </p>
      )}

      {/* tooltip au survol (position fixe, suit le curseur → échappe l'overflow) */}
      {tip ? (
        <div
          className="pointer-events-none fixed z-[100] w-64 rounded-sm border border-gold/30 bg-panel/95 p-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur"
          style={{
            left: Math.min(tip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 9999) - 272),
            top: tip.y + 14,
          }}
        >
          <div className="flex items-center gap-2">
            {tip.row.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tip.row.image} alt="" aria-hidden className="h-9 w-9 shrink-0 rounded-sm border object-cover" style={{ borderColor: tip.row.tint }} />
            ) : null}
            <span className="min-w-0">
              <span className="block truncate font-display text-sm text-parch">{tip.row.title}</span>
              <span className="block font-caps text-[0.5rem] uppercase tracking-[0.14em]" style={{ color: tip.row.tint }}>
                {tip.row.category}
              </span>
            </span>
          </div>
          <div className="mt-1.5 font-mono text-[0.62rem] text-parch/75">{range(tip.row.start, tip.row.end)}</div>
          {(() => {
            const info = detailInfo(tip.row);
            return (
              <div className={cn("mt-0.5 font-caps text-[0.55rem] uppercase tracking-[0.12em]", info.tone)}>
                {info.label}
                {info.note ? ` · ${info.note}` : ""}
              </div>
            );
          })()}
          {tip.row.description ? (
            <p className="mt-1.5 font-sans text-[0.7rem] leading-snug text-parch/70">{tip.row.description}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------- conteneur home */

/** Calendrier de la home — état local. */
export function EventCalendar({ events, refToday }: { events?: CalendarEvent[]; refToday?: string }) {
  const [span, setSpan] = useState<CalendarZoom>(DEFAULT_ZOOM);
  const [windowStart, setWindowStart] = useState<string>(() => defaultWindowStart(DEFAULT_ZOOM, refToday));
  const [active, setActive] = useState<Set<EventCategory>>(() => new Set(CATEGORIES));

  const shift = (days: number) => setWindowStart((s) => addDaysIso(s, days));
  const goToday = () => setWindowStart(defaultWindowStart(span, refToday));
  const changeZoom = (z: CalendarZoom) => {
    const center = addDaysIso(windowStart, Math.round(span / 2));
    setWindowStart(addDaysIso(center, -Math.round(z / 2)));
    setSpan(z);
  };
  const toggleCat = (cat: EventCategory) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

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
      headerRight={
        <Link
          href="/calendar"
          className="rounded-sm border border-line/25 px-2.5 py-1 font-caps text-[0.55rem] uppercase tracking-[0.14em] text-gold hover:border-gold hover:text-gold-bright"
        >
          Plein écran →
        </Link>
      }
    />
  );
}
