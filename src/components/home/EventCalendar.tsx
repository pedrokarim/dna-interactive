"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, CalendarDays, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaCornerBrackets, cn } from "@/components/dna";
import { useDominantColor } from "@/lib/color/dominant";
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

/* ------------------------------------------------------------------ couleur */

/** `#rrggbb` + alpha 0-1 → `rgba(...)`. Renvoie la couleur brute si non parsable. */
function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/* ------------------------------------------------------------------ barre */

type EventBarProps = {
  row: CalendarRow;
  minW: number;
  selected: boolean;
  rangeLabel: string;
  startLabel: string;
  onSelect: () => void;
  onHover: (e: React.MouseEvent) => void;
  onLeave: () => void;
};

/**
 * Barre d'un événement : la bannière remplit le rectangle, la couleur dominante
 * de l'image pilote la bordure/l'ombre/le voile, titre et pastille de date sont
 * incrustés par-dessus. Positionnée par date, largeur = durée (avec un minimum
 * pour que l'image reste lisible).
 */
function EventBar({ row, minW, selected, rangeLabel, startLabel, onSelect, onHover, onLeave }: EventBarProps) {
  const dominant = useDominantColor(row.image);
  // Couleur dominante de l'image → sinon teinte de catégorie.
  const accent = dominant ?? row.tint;
  const faded = row.status === "past";

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseMove={onHover}
      onMouseLeave={onLeave}
      aria-label={`${row.title} — ${rangeLabel}`}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "group absolute inset-y-[3px] overflow-hidden rounded-[4px] border text-left transition-[box-shadow,filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/70",
        selected ? "z-[3]" : "z-[1] hover:brightness-110",
        faded && "grayscale-[0.35]",
      )}
      style={{
        left: `${row.leftPct}%`,
        width: `${row.widthPct}%`,
        minWidth: minW,
        borderColor: withAlpha(accent, selected ? 0.95 : 0.55),
        boxShadow: selected
          ? `0 0 0 1px ${withAlpha(accent, 0.9)}, 0 6px 22px ${withAlpha(accent, 0.4)}`
          : `0 2px 12px ${withAlpha(accent, 0.22)}`,
        opacity: row.status === "upcoming" ? 0.9 : 1,
        background: withAlpha(accent, 0.12),
      }}
    >
      {/* bannière incrustée */}
      {row.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.image}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-[50%_28%]"
        />
      ) : null}

      {/* voile : sombre à gauche (lisibilité du texte) + teinte dominante */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, rgba(8,8,9,0.9) 0%, rgba(8,8,9,0.6) 42%, rgba(8,8,9,0.12) 100%), linear-gradient(90deg, ${withAlpha(
            accent,
            0.55,
          )} 0%, transparent 70%)`,
        }}
      />
      {/* filet dominant en bas */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: withAlpha(accent, 0.85) }} />

      {/* contenu */}
      <span className="relative flex h-full flex-col justify-between px-2.5 py-1.5">
        <span className="flex items-center gap-1.5">
          {row.overflowLeft ? <span className="text-[0.7rem] leading-none text-parch/80">‹</span> : null}
          <span
            className="rounded-[3px] border px-1.5 py-0.5 font-mono text-[0.58rem] leading-none text-parch"
            style={{ borderColor: withAlpha(accent, 0.7), background: "rgba(8,8,9,0.72)" }}
          >
            {startLabel}
          </span>
          {row.overflowRight ? <span className="ml-auto text-[0.7rem] leading-none text-parch/80">›</span> : null}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-[0.82rem] leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {row.title}
          </span>
          <span
            className="block truncate font-caps text-[0.5rem] uppercase leading-none tracking-[0.16em]"
            style={{ color: withAlpha(accent, 0.95) }}
          >
            {row.category}
          </span>
        </span>
      </span>
    </button>
  );
}

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
  const pillFmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" }), [locale]);
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
  const barH = full ? "h-14" : "h-11";
  const minW = full ? 220 : 176;
  const rowGap = full ? "gap-2" : "gap-1.5";
  const ctrlBtn =
    "flex h-8 w-8 items-center justify-center rounded-sm border border-line/25 text-parch/75 transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";

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
          className="flex items-center gap-1.5 rounded-sm border border-line/25 px-3 py-1.5 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-parch/80 transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Aujourd&apos;hui
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
                "rounded-sm border px-2.5 py-1 font-caps text-[0.55rem] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
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
                "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-caps text-[0.55rem] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
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
        <div className={full ? "min-w-[860px]" : "min-w-[680px]"}>
          {/* axe + repère aujourd'hui */}
          <div className="relative mb-2 h-4">
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

          {/* lignes */}
          {rows.length === 0 ? (
            <p className="py-8 text-center font-mono text-[0.7rem] text-muted-2">Aucun événement sur cette période.</p>
          ) : (
            <div className={cn("relative flex flex-col", rowGap)}>
              {/* repère « aujourd'hui » traversant toutes les lignes */}
              {today !== null ? (
                <span aria-hidden className="pointer-events-none absolute inset-y-0 z-[2] w-px bg-gold-bright/45" style={{ left: `${today}%` }} />
              ) : null}
              {rows.map((r) => (
                <div key={r.id} className={cn("relative rounded-[4px] bg-ink/40", barH)}>
                  <EventBar
                    row={r}
                    minW={minW}
                    selected={selected?.id === r.id}
                    rangeLabel={range(r.start, r.end)}
                    startLabel={pillFmt.format(new Date(r.start))}
                    onSelect={() => setSelected((s) => (s?.id === r.id ? null : r))}
                    onHover={(e) => setTip({ row: r, x: e.clientX, y: e.clientY })}
                    onLeave={() => setTip((t) => (t?.row.id === r.id ? null : t))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* détail de l'événement sélectionné */}
      {selected ? (
        <div className="mt-3 overflow-hidden rounded-sm border border-line/20 bg-ink/40">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 p-3">
            <span className="font-display text-sm text-parch">{selected.title}</span>
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
              <Link
                href={selected.href}
                className="ml-auto inline-flex items-center gap-1 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-gold hover:text-gold-bright"
              >
                Voir <ExternalLink className="h-3 w-3" />
              </Link>
            ) : null}
            {selected.description ? (
              <span className="w-full font-sans text-xs leading-relaxed text-parch/70">{selected.description}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-3 font-mono text-[0.6rem] text-muted-2">
          Navigue avec ◀ ▶, zoome, filtre par catégorie, survole ou clique un événement pour le détail.
        </p>
      )}

      {/* tooltip au survol (position fixe, suit le curseur → échappe l'overflow) */}
      {tip ? (
        <div
          className="pointer-events-none fixed z-[100] w-64 overflow-hidden rounded-sm border border-gold/30 bg-panel/95 shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur"
          style={{
            left: Math.min(tip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 9999) - 272),
            top: tip.y + 14,
          }}
        >
          {tip.row.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tip.row.image} alt="" aria-hidden className="h-24 w-full object-cover object-[50%_28%]" />
          ) : null}
          <div className="p-2.5">
            <div className="font-display text-sm text-parch">{tip.row.title}</div>
            <div className="mt-0.5 font-caps text-[0.5rem] uppercase tracking-[0.14em]" style={{ color: tip.row.tint }}>
              {tip.row.category}
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
          className="rounded-sm border border-line/25 px-2.5 py-1 font-caps text-[0.55rem] uppercase tracking-[0.14em] text-gold hover:border-gold hover:text-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          Plein écran →
        </Link>
      }
    />
  );
}
