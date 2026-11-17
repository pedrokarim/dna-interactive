"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { DnaCornerBrackets, cn } from "@/components/dna";
import {
  CALENDAR_ZOOMS,
  CATEGORIES,
  FETCH_BUFFER_DAYS,
  GAME_VERSIONS,
  MIN_BAR_PX,
  RANGE_EXTEND_DAYS,
  RANGE_PAD_DAYS,
  addDaysIso,
  dayTicks,
  diffDays,
  layoutBars,
  monthBands,
  tickStepForScale,
  type CalendarBar,
  type CalendarEvent,
  type CalendarZoom,
  type EventCategory,
} from "@/lib/events/calendar";
import { CalendarAgenda } from "./CalendarAgenda";
import { CalendarEventSheet } from "./CalendarEventSheet";
import { CATEGORY_KEY, CATEGORY_SLUG, STATUS_TONE, categoryTint, useCalendarFormat, useToday } from "./calendar-ui";

/** Distance au bord (px) qui déclenche l'extension de la plage rendue. */
const EDGE_TRIGGER_PX = 700;
/** Anti-rebond du chargement de données pendant le défilement (ms). */
const FETCH_DEBOUNCE_MS = 220;
/** Anti-rebond de la remontée « date au centre » vers l'URL (ms). */
const VIEW_DATE_DEBOUNCE_MS = 400;
/** Bandeau des mois (22 px) + graduations (24 px), collé en haut de la frise. */
const HEADER_H = 46;
/** Rangée des repères de version, sous le bandeau. */
const VERSION_ROW_H = 24;
const LANE_H = 30;
const LANE_GAP = 4;
/** Place réservée au nom du mois quand il suit le défilement (px). */
const MONTH_LABEL_W = 150;

export type CalendarView = "timeline" | "list";

/* ------------------------------------------------------------ largeur d'écran */

const NARROW_QUERY = "(max-width: 767px)";
function subscribeNarrow(onChange: () => void) {
  const mq = window.matchMedia(NARROW_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
/** Écran de téléphone. Toujours faux au rendu serveur, la mise en page suit le CSS de toute façon. */
function useNarrow() {
  return useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
}

/* ------------------------------------------------------------------- barre */

type EventBarProps = {
  bar: CalendarBar;
  left: number;
  width: number;
  top: number;
  selected: boolean;
  label: string;
  onSelect: (id: string) => void;
  onHover: (bar: CalendarBar, x: number, y: number) => void;
  onLeave: () => void;
};

/**
 * Barre d'un événement : aplat à la couleur de sa catégorie, vignette et titre.
 * L'étiquette est en sticky : si l'événement a commencé avant la zone affichée,
 * le titre reste au bord gauche de la frise au lieu de sortir de l'écran.
 */
function EventBar({ bar, left, width, top, selected, label, onSelect, onHover, onLeave }: EventBarProps) {
  const tint = bar.tint;
  const upcoming = bar.status === "upcoming";
  const style: CSSProperties = {
    left,
    width,
    top,
    height: LANE_H,
    background: `color-mix(in srgb, ${tint} ${selected ? 30 : upcoming ? 7 : 17}%, var(--color-panel))`,
    borderColor: `color-mix(in srgb, ${tint} ${selected ? 100 : 50}%, transparent)`,
    boxShadow: selected ? `0 0 0 1px ${tint}, 0 4px 18px color-mix(in srgb, ${tint} 35%, transparent)` : undefined,
  };

  return (
    <button
      type="button"
      data-event-id={bar.id}
      onClick={() => onSelect(bar.id)}
      onMouseMove={(e) => onHover(bar, e.clientX, e.clientY)}
      onMouseLeave={onLeave}
      aria-label={label}
      aria-current={selected ? "true" : undefined}
      style={style}
      className={cn(
        // `overflow-clip` et pas `hidden` : avec `hidden`, la barre deviendrait le
        // conteneur de défilement de l'étiquette sticky, au lieu de la frise.
        "absolute flex items-center overflow-clip rounded-[3px] border text-left transition-[background-color,border-color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/70",
        upcoming && "border-dashed",
        bar.status === "past" && !selected && "opacity-45 hover:opacity-85",
        selected ? "z-[3]" : "z-[1] hover:brightness-110",
      )}
    >
      <span className="sticky left-1 flex min-w-0 items-center gap-1.5 pl-[3px] pr-2" style={{ maxWidth: width - 4 }}>
        <span className="relative block h-[22px] w-[22px] shrink-0 overflow-hidden rounded-[2px] bg-ink-2">
          {bar.image ? (
            <Image
              src={bar.image}
              alt=""
              fill
              sizes="24px"
              quality={60}
              unoptimized={!bar.image.startsWith("/")}
              className="object-cover"
            />
          ) : null}
        </span>
        <span className="min-w-0 truncate text-[0.84rem] leading-none text-parch">{bar.title}</span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------- frise */

export type CalendarTimelineProps = {
  /** Événements de la fenêtre initiale (rendus côté serveur). */
  initialEvents: CalendarEvent[];
  /** Bornes de cette fenêtre, d'où part le chargement au défilement. */
  initialFrom: string;
  initialTo: string;
  /** Date du jour côté serveur : sert au premier rendu, remplacée par l'horloge du visiteur. */
  serverToday: string;
  /** Forçage admin de la date de référence (vide = horloge du visiteur). */
  overrideToday?: string;
  /** Zoom = nombre de jours visibles à l'écran. */
  span: CalendarZoom;
  active: Set<EventCategory>;
  onZoom: (z: CalendarZoom) => void;
  onToggleCat: (cat: EventCategory) => void;
  /** Date à cadrer à l'ouverture (lien partagé) ; défaut = aujourd'hui. */
  focusDate?: string;
  /** Remonte la date au centre de la vue (pour la garder dans l'URL). */
  onViewDateChange?: (iso: string) => void;
  /** compact = accueil ; full = page dédiée (frise plus haute). */
  variant?: "compact" | "full";
  /** Slot à droite de la barre d'outils (ex. lien « Plein écran »). */
  headerRight?: ReactNode;
  /** Frise ou liste ; `null` = liste sur téléphone, frise au-delà. */
  view: CalendarView | null;
  onViewChange: (view: CalendarView) => void;
  /** Événement dont la fiche est ouverte. `onSelect` doit garder la même identité. */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

/**
 * Frise horizontale sans borne, rangée par catégorie. On défile librement vers
 * le passé ou le futur : la plage rendue s'agrandit d'un an quand on touche un
 * bord, et les événements se chargent par fenêtre autour de la zone vue, jamais
 * tout d'un coup. Un clic sur un événement ouvre sa fiche.
 */
export function CalendarTimeline({
  initialEvents,
  initialFrom,
  initialTo,
  serverToday,
  overrideToday,
  span,
  active,
  onZoom,
  onToggleCat,
  focusDate,
  onViewDateChange,
  variant = "compact",
  headerRight,
  view,
  onViewChange,
  selectedId,
  onSelect,
}: CalendarTimelineProps) {
  const t = useTranslations("homeHub");
  const tc = useTranslations("calendarUi");
  const full = variant === "full";
  const { fmt, date, short, range, statusText } = useCalendarFormat();
  const { today, dayFraction } = useToday(serverToday, overrideToday);
  const narrow = useNarrow();
  const effectiveView: CalendarView = view ?? (narrow ? "list" : "timeline");

  /* ------------------------------------------------------------ plage rendue */

  // Ancre fixe du premier rendu : identique serveur/client (pas d'horloge ici).
  const anchor = focusDate || serverToday;
  const [rangeStart, setRangeStart] = useState(() => addDaysIso(anchor, -RANGE_PAD_DAYS));
  const [rangeDays, setRangeDays] = useState(RANGE_PAD_DAYS * 2);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  /** Correction de `scrollLeft` à appliquer après un ajout de jours à gauche. */
  const scrollAdjustRef = useRef(0);
  const rafRef = useRef(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportW, setViewportW] = useState(0);

  const pxPerDay = viewportW > 0 ? viewportW / span : 0;
  const contentW = rangeDays * pxPerDay;

  const offsetToIso = useCallback(
    (px: number) => addDaysIso(rangeStart, Math.floor(px / (pxPerDay || 1))),
    [rangeStart, pxPerDay],
  );

  /* ------------------------------------------------------------ données */

  const [eventsById, setEventsById] = useState<Map<string, CalendarEvent>>(
    () => new Map(initialEvents.map((e) => [e.id, e])),
  );
  const loadedRef = useRef({ from: initialFrom, to: initialTo });
  const abortRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);

  const syncWindow = useCallback(async (needFrom: string, needTo: string) => {
    const { from: lf, to: lt } = loadedRef.current;
    const gaps: [string, string][] = [];
    if (needFrom < lf) gaps.push([needFrom, addDaysIso(lf, -1)]);
    if (needTo > lt) gaps.push([addDaysIso(lt, 1), needTo]);
    if (gaps.length === 0) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    try {
      for (const [from, to] of gaps) {
        const res = await fetch(`/api/calendar/events?from=${from}&to=${to}`, { signal: ac.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { events: CalendarEvent[] };
        setEventsById((prev) => {
          const next = new Map(prev);
          for (const ev of data.events) next.set(ev.id, ev);
          return next;
        });
        // On n'élargit les bornes qu'après une réponse réussie : un échec sera
        // retenté au prochain défilement.
        loadedRef.current = {
          from: from < loadedRef.current.from ? from : loadedRef.current.from,
          to: to > loadedRef.current.to ? to : loadedRef.current.to,
        };
      }
    } catch {
      // Requête annulée (défilement rapide) ou réseau coupé : on retentera.
    } finally {
      if (abortRef.current === ac) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* ------------------------------------------------------------ mesure */

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => setViewportW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* --------------------------------------------- défilement → état dérivé */

  const [tip, setTip] = useState<{ bar: CalendarBar; x: number; y: number } | null>(null);

  const handleScroll = useCallback(() => {
    setTip(null);
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      const node = scrollerRef.current;
      if (node) setScrollLeft(node.scrollLeft);
    });
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Extension de la plage aux bords. On lit `scrollLeft` sur le DOM : l'état
  // React a un événement de retard, et on ré-étendrait en boucle sur une valeur
  // périmée.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !pxPerDay || scrollAdjustRef.current) return;
    if (el.scrollLeft < EDGE_TRIGGER_PX) {
      scrollAdjustRef.current = RANGE_EXTEND_DAYS * pxPerDay;
      setRangeStart((s) => addDaysIso(s, -RANGE_EXTEND_DAYS));
      setRangeDays((d) => d + RANGE_EXTEND_DAYS);
    } else if (contentW - el.scrollLeft - el.clientWidth < EDGE_TRIGGER_PX) {
      setRangeDays((d) => d + RANGE_EXTEND_DAYS);
    }
  }, [scrollLeft, pxPerDay, contentW]);

  // Jours ajoutés à gauche : on décale `scrollLeft` d'autant avant la peinture,
  // sinon la frise saute sous le curseur.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || !scrollAdjustRef.current) return;
    el.scrollLeft += scrollAdjustRef.current;
    scrollAdjustRef.current = 0;
    setScrollLeft(el.scrollLeft);
  }, [rangeStart]);

  // Chargement des événements autour de ce qu'on regarde.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !pxPerDay) return;
    const timer = window.setTimeout(() => {
      const fromDay = Math.floor(el.scrollLeft / pxPerDay) - FETCH_BUFFER_DAYS;
      const toDay = Math.ceil((el.scrollLeft + el.clientWidth) / pxPerDay) + FETCH_BUFFER_DAYS;
      void syncWindow(addDaysIso(rangeStart, fromDay), addDaysIso(rangeStart, toDay));
    }, FETCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [scrollLeft, pxPerDay, rangeStart, syncWindow]);

  // Date au centre de la vue, remontée dans l'URL (page plein écran).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !pxPerDay || !onViewDateChange) return;
    const timer = window.setTimeout(() => {
      onViewDateChange(offsetToIso(el.scrollLeft + el.clientWidth / 2));
    }, VIEW_DATE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [scrollLeft, pxPerDay, onViewDateChange, offsetToIso]);

  /* ------------------------------------------------------------ cadrage */

  const centerOn = useCallback(
    (iso: string, smooth: boolean) => {
      const el = scrollerRef.current;
      if (!el || !pxPerDay) return;
      const left = (diffDays(rangeStart, iso) + 0.5) * pxPerDay - el.clientWidth / 2;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const animate = smooth && !reduced;
      el.scrollTo({ left: Math.max(0, left), behavior: animate ? "smooth" : "auto" });
      // Sans animation, on met l'état à jour tout de suite, sans attendre
      // l'événement `scroll`, pour la période affichée et les barres rendues.
      if (!animate) setScrollLeft(el.scrollLeft);
    },
    [rangeStart, pxPerDay],
  );

  // Premier cadrage dès que la largeur est connue, puis on garde la date du
  // centre à chaque changement de zoom.
  const centerIsoRef = useRef<string>(anchor);
  const initialisedRef = useRef(false);
  /** Date à cadrer dès que la frise aura une largeur (« Placer sur la frise » depuis la liste). */
  const pendingCenterRef = useRef<string | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !pxPerDay || !initialisedRef.current) return;
    centerIsoRef.current = offsetToIso(el.scrollLeft + el.clientWidth / 2);
  }, [scrollLeft, pxPerDay, offsetToIso]);

  useLayoutEffect(() => {
    if (!pxPerDay) return;
    if (pendingCenterRef.current) {
      initialisedRef.current = true;
      centerIsoRef.current = pendingCenterRef.current;
      pendingCenterRef.current = null;
    } else if (!initialisedRef.current) {
      initialisedRef.current = true;
      centerIsoRef.current = anchor;
    }
    centerOn(centerIsoRef.current, false);
    // Seule dépendance voulue : le zoom (pxPerDay). On recadre sur la date du
    // centre quand l'échelle change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pxPerDay]);

  const goToday = useCallback(() => {
    centerIsoRef.current = today;
    centerOn(today, true);
  }, [centerOn, today]);

  const nudge = useCallback((direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.6, behavior: reduced ? "auto" : "smooth" });
  }, []);

  /* ------------------------------------------------------------ rendu data */

  const visibleEvents = useMemo(
    () => Array.from(eventsById.values()).filter((ev) => active.has(ev.category)),
    [eventsById, active],
  );

  const minSpanDays = pxPerDay > 0 ? Math.ceil(MIN_BAR_PX / pxPerDay) : 1;

  /** Une section par catégorie active, avec ses propres voies. */
  const sections = useMemo(
    () =>
      CATEGORIES.filter((cat) => active.has(cat)).map((cat) => {
        const bars = layoutBars(
          visibleEvents.filter((ev) => ev.category === cat),
          rangeStart,
          today,
          minSpanDays,
        );
        return {
          category: cat,
          bars,
          lanes: bars.reduce((max, b) => Math.max(max, b.lane + 1), 0),
          live: bars.filter((b) => b.status === "ongoing").length,
        };
      }),
    [active, visibleEvents, rangeStart, today, minSpanDays],
  );

  const [collapsed, setCollapsed] = useState<Set<EventCategory>>(() => new Set());
  const toggleSection = (cat: EventCategory) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  const bands = useMemo(() => monthBands(rangeStart, rangeDays), [rangeStart, rangeDays]);

  // Fenêtre visible, en jours depuis le début de la plage rendue.
  const firstVisibleDay = pxPerDay ? Math.floor(scrollLeft / pxPerDay) : 0;
  const lastVisibleDay = pxPerDay ? Math.ceil((scrollLeft + viewportW) / pxPerDay) : 0;

  // Graduations seulement autour du visible (un écran de chaque côté), sinon
  // une frise de plusieurs années mettrait des milliers de repères dans le DOM.
  const tickStep = tickStepForScale(pxPerDay);
  const tickFrom = Math.max(0, firstVisibleDay - span);
  const tickTo = Math.min(rangeDays, lastVisibleDay + span);
  const ticks = useMemo(
    () => (pxPerDay ? dayTicks(rangeStart, tickFrom, tickTo, tickStep) : []),
    [rangeStart, tickFrom, tickTo, tickStep, pxPerDay],
  );

  // Curseur à l'heure actuelle dans la colonne du jour, pas sur son bord gauche.
  const todayOffset = diffDays(rangeStart, today);
  const todayLeft = (todayOffset + dayFraction) * pxPerDay;
  const todayOffScreen: -1 | 0 | 1 = !pxPerDay || !viewportW
    ? 0
    : todayLeft < scrollLeft
      ? -1
      : todayLeft > scrollLeft + viewportW
        ? 1
        : 0;

  const visibleFromIso = addDaysIso(rangeStart, firstVisibleDay);
  const visibleToIso = addDaysIso(rangeStart, Math.max(firstVisibleDay, lastVisibleDay - 1));
  const onScreen = (b: CalendarBar, from: number, to: number) =>
    b.offsetDays + Math.max(b.lengthDays, minSpanDays) >= from && b.offsetDays <= to;
  const barsOnScreen = sections.reduce(
    (n, s) => n + s.bars.filter((b) => onScreen(b, firstVisibleDay, lastVisibleDay)).length,
    0,
  );

  const versionMarks = GAME_VERSIONS.map((v) => ({ ...v, offset: diffDays(rangeStart, v.start) })).filter(
    (v) => v.offset >= tickFrom && v.offset <= tickTo,
  );

  /* ------------------------------------------------------------ fiche */

  const closeSheet = useCallback(() => onSelect(null), [onSelect]);

  const locate = useCallback(
    (ev: CalendarEvent) => {
      onSelect(null);
      const target = today >= ev.start && today <= ev.end ? today : ev.start;
      if (effectiveView !== "timeline") {
        pendingCenterRef.current = target;
        onViewChange("timeline");
      } else {
        centerIsoRef.current = target;
        centerOn(target, true);
      }
      // Une fois la fiche fermée et le défilement horizontal fini, on amène la
      // barre à l'écran (la frise défile aussi en hauteur) et on lui donne le
      // focus pour que le clavier reparte de là.
      window.setTimeout(() => {
        const el = scrollerRef.current;
        const bar = el?.querySelector<HTMLElement>(`[data-event-id="${CSS.escape(ev.id)}"]`);
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (bar) {
          bar.scrollIntoView({ block: "center", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
          bar.focus({ preventScroll: true });
        } else {
          el?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
        }
      }, 650);
    },
    [onSelect, onViewChange, effectiveView, today, centerOn],
  );

  /* ------------------------------------------------------------ rendu */

  const ctrlBtn =
    "flex h-8 w-8 items-center justify-center rounded-sm border border-line/25 text-parch/75 transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";
  const segBtn = (on: boolean) =>
    cn(
      "h-8 border-l border-line/25 px-3 text-[0.8rem] transition-colors first:border-l-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60",
      on ? "bg-gold/12 text-gold-bright" : "text-muted hover:text-gold",
    );
  // Mode auto : la liste remplace la frise sur téléphone, en CSS pour éviter un
  // saut à l'hydratation. Un choix explicite s'applique sur tous les écrans.
  const timelineOnly = view === null ? "max-md:hidden" : view === "list" ? "hidden" : "";
  const listOnly = view === null ? "md:hidden" : view === "timeline" ? "hidden" : "";

  const scrollerHeight = full ? "max(440px, calc(100dvh - 230px))" : "420px";

  return (
    <div className="relative min-w-0 rounded-sm border border-line/20 bg-panel/60 p-4 sm:p-5">
      <DnaCornerBrackets size={14} />

      {/* barre d'outils */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className={cn("flex min-w-0 items-center gap-2", timelineOnly)}>
          <button type="button" aria-label={t("previousPeriod")} onClick={() => nudge(-1)} className={ctrlBtn}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="flex h-8 items-center gap-1.5 rounded-sm border border-line/25 px-3 text-[0.82rem] text-parch/85 transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {t("today")}
          </button>
          <button type="button" aria-label={t("nextPeriod")} onClick={() => nudge(1)} className={ctrlBtn}>
            <ChevronRight className="h-4 w-4" />
          </button>
          {pxPerDay ? (
            <span className="ml-1 min-w-0 truncate text-[0.9rem] text-parch" aria-live="polite">
              {range(visibleFromIso, visibleToIso)}
            </span>
          ) : null}
          {loading ? <Loader2 aria-hidden className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-2" /> : null}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div role="group" aria-label={tc("zoom")} className={cn("flex overflow-hidden rounded-sm border border-line/25", timelineOnly)}>
            {CALENDAR_ZOOMS.map((z) => (
              <button key={z} type="button" aria-pressed={span === z} onClick={() => onZoom(z)} className={segBtn(span === z)}>
                {t(z === 14 ? "twoWeeks" : z === 30 ? "oneMonth" : "twoMonths")}
              </button>
            ))}
          </div>
          <div role="group" aria-label={tc("view")} className="flex overflow-hidden rounded-sm border border-line/25">
            {(["timeline", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={effectiveView === v}
                onClick={() => onViewChange(v)}
                className={segBtn(effectiveView === v)}
              >
                {tc(v === "timeline" ? "viewTimeline" : "viewList")}
              </button>
            ))}
          </div>
          {headerRight}
        </div>
      </div>

      {/* filtres par catégorie */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const on = active.has(cat);
          const tint = categoryTint(cat);
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={on}
              onClick={() => onToggleCat(cat)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-[0.8rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                on ? "text-parch" : "border-line/15 text-muted",
              )}
              style={
                on
                  ? {
                      borderColor: `color-mix(in srgb, ${tint} 45%, transparent)`,
                      background: `color-mix(in srgb, ${tint} 10%, transparent)`,
                    }
                  : undefined
              }
            >
              <span className="h-2 w-2 rounded-[2px]" style={{ background: tint, opacity: on ? 1 : 0.35 }} />
              {tc(`plural.${CATEGORY_SLUG[cat]}`)}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------- frise */}
      <div className={cn("relative", timelineOnly)}>
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          tabIndex={0}
          role="group"
          aria-label={t("eventCalendar")}
          className="custom-scrollbar relative overflow-auto border-t border-line/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          style={{ maxHeight: scrollerHeight }}
        >
          <div className="relative" style={{ width: contentW || "100%" }}>
            {/* bandeau des mois + graduations, collé en haut au défilement vertical */}
            <div className="sticky top-0 z-[6] bg-panel" style={{ height: HEADER_H }}>
              {bands.map((b) => {
                const bandLeft = b.offsetDays * pxPerDay;
                const bandWidth = b.days * pxPerDay;
                // Le nom du mois reste au bord gauche quand son bandeau commence
                // hors écran. Décalage calculé à la main : un `sticky` dans ce
                // bandeau, déjà sticky en haut, ne suit pas le défilement horizontal.
                const shift = Math.max(0, Math.min(scrollLeft - bandLeft, bandWidth - MONTH_LABEL_W));
                return (
                  <div
                    key={b.iso}
                    className="absolute top-0 h-[22px] overflow-hidden border-l border-line/25"
                    style={{ left: bandLeft, width: bandWidth }}
                  >
                    <span
                      className="block whitespace-nowrap px-2 pt-[5px] font-caps text-[0.66rem] uppercase leading-none tracking-[0.14em] text-parch"
                      style={{ transform: `translateX(${shift}px)` }}
                    >
                      {fmt.monthYear.format(date(b.iso))}
                    </span>
                  </div>
                );
              })}
              {/* graduations : libellé centré sur la colonne de son jour */}
              {ticks.map((tick) =>
                Math.abs(tick.offsetDays - todayOffset) * pxPerDay < 30 ? null : (
                  <span
                    key={tick.iso}
                    className="absolute top-[25px] -translate-x-1/2 whitespace-nowrap text-[0.72rem] tabular-nums text-muted-2"
                    style={{ left: (tick.offsetDays + 0.5) * pxPerDay }}
                  >
                    {tickStep === 1 ? fmt.dayNumber.format(date(tick.iso)) : short(tick.iso)}
                  </span>
                ),
              )}
              {pxPerDay > 0 ? (
                <span
                  className="absolute top-[23px] -translate-x-1/2 whitespace-nowrap rounded-[2px] bg-gold-bright px-1 text-[0.72rem] font-semibold tabular-nums text-ink"
                  style={{ left: (todayOffset + 0.5) * pxPerDay }}
                >
                  {tickStep === 1 ? fmt.dayNumber.format(date(today)) : short(today)}
                </span>
              ) : null}
            </div>

            {/* fonds : passé assombri, filets des graduations, repères de version */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-0" style={{ top: HEADER_H }}>
              {pxPerDay > 0 ? <span className="absolute inset-y-0 left-0 bg-ink/25" style={{ width: Math.max(0, todayLeft) }} /> : null}
              {ticks.map((tick) => (
                <span key={tick.iso} className="absolute inset-y-0 w-px bg-line/[0.07]" style={{ left: tick.offsetDays * pxPerDay }} />
              ))}
              {bands.map((b) => (
                <span key={b.iso} className="absolute inset-y-0 w-px bg-line/20" style={{ left: b.offsetDays * pxPerDay }} />
              ))}
              {versionMarks.map((v) => (
                <span key={v.version} className="absolute inset-y-0 border-l border-dashed border-gold/45" style={{ left: v.offset * pxPerDay }} />
              ))}
            </div>

            {/* repère « maintenant », sur toute la hauteur de la frise */}
            {pxPerDay > 0 ? (
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 z-[5] w-[2px] -translate-x-1/2 bg-gold-bright opacity-60 shadow-[0_0_8px_rgba(233,196,106,0.5)]"
                style={{ left: todayLeft, top: HEADER_H - 4 }}
              />
            ) : null}

            {/* rangée des versions */}
            <div className="relative z-[2]" style={{ height: VERSION_ROW_H }}>
              {versionMarks.map((v) => (
                <span key={v.version} className="absolute top-1" style={{ left: v.offset * pxPerDay + 4 }}>
                  <span className="block whitespace-nowrap rounded-[2px] border border-line/30 bg-panel px-1.5 py-0.5 font-caps text-[0.6rem] uppercase leading-none tracking-[0.12em] text-gold">
                    {tc("versionMark", { version: v.version })}
                  </span>
                </span>
              ))}
            </div>

            {/* une section par catégorie */}
            {sections.map((section) => {
              const folded = collapsed.has(section.category);
              const tint = categoryTint(section.category);
              const rendered = section.bars.filter((b) => onScreen(b, tickFrom, tickTo));
              return (
                <section key={section.category} className="relative z-[1] pb-1">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.category)}
                    aria-expanded={!folded}
                    className="sticky left-0 mt-1 inline-flex h-8 items-center gap-2 rounded-[2px] bg-panel pl-1 pr-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                  >
                    <ChevronDown className={cn("h-3.5 w-3.5 text-muted transition-transform", folded && "-rotate-90")} aria-hidden />
                    <span aria-hidden className="h-2 w-2 rounded-[2px]" style={{ background: tint }} />
                    <span className="font-caps text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-parch">
                      {tc(`plural.${CATEGORY_SLUG[section.category]}`)}
                    </span>
                    <span className="text-[0.8rem] text-muted">{tc("liveCount", { count: section.live })}</span>
                  </button>
                  {folded ? null : (
                    <div className="relative" style={{ height: Math.max(section.lanes, 1) * (LANE_H + LANE_GAP) }}>
                      {rendered.map((b) => {
                        const width = Math.max(b.lengthDays * pxPerDay - 2, MIN_BAR_PX);
                        return (
                          <EventBar
                            key={b.id}
                            bar={b}
                            left={b.offsetDays * pxPerDay + 1}
                            width={width}
                            top={b.lane * (LANE_H + LANE_GAP)}
                            selected={selectedId === b.id}
                            label={`${b.title}, ${range(b.start, b.end)}`}
                            onSelect={(id) => {
                              setTip(null);
                              onSelect(id);
                            }}
                            onHover={(bar, x, y) => setTip({ bar, x, y })}
                            onLeave={() => setTip(null)}
                          />
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        {/* rien dans la période regardée */}
        {pxPerDay > 0 && barsOnScreen === 0 ? (
          <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-muted-2">
            {t("noEvents")}
          </p>
        ) : null}

        {/* « aujourd'hui » hors écran : raccourci pour y revenir */}
        {todayOffScreen !== 0 ? (
          <button
            type="button"
            onClick={goToday}
            className={cn(
              "absolute top-[58px] z-[8] flex h-8 items-center gap-1 rounded-sm border border-gold/60 bg-ink/90 px-2.5 text-[0.8rem] text-gold-bright shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-colors hover:border-gold",
              todayOffScreen === -1 ? "left-2" : "right-4",
            )}
          >
            {todayOffScreen === -1 ? <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> : null}
            {t("today")}
            {todayOffScreen === 1 ? <ChevronRight className="h-3.5 w-3.5" aria-hidden /> : null}
          </button>
        ) : null}
      </div>

      {/* ------------------------------------------------------- liste */}
      <div className={listOnly}>
        <CalendarAgenda
          events={visibleEvents}
          today={today}
          dayFraction={dayFraction}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>

      {/* infobulle au survol (position fixe : échappe au défilement de la frise) */}
      {tip ? <BarTooltip bar={tip.bar} x={tip.x} y={tip.y} today={today} statusText={statusText} range={range} /> : null}

      {selectedId ? (
        <CalendarEventSheet
          eventId={selectedId}
          initialEvent={eventsById.get(selectedId)}
          today={today}
          dayFraction={dayFraction}
          onClose={closeSheet}
          onSelect={onSelect}
          onLocate={locate}
        />
      ) : null}
    </div>
  );
}

function BarTooltip({
  bar,
  x,
  y,
  today,
  statusText,
  range,
}: {
  bar: CalendarBar;
  x: number;
  y: number;
  today: string;
  statusText: (ev: CalendarBar, today: string) => string;
  range: (a: string, b: string) => string;
}) {
  const t = useTranslations("homeHub");
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 264, h: 180 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setSize({ w: el.offsetWidth, h: el.offsetHeight });
  }, [bar.id]);

  const left = Math.min(x + 14, window.innerWidth - size.w - 8);
  const top = y + 16 + size.h > window.innerHeight ? y - size.h - 12 : y + 16;

  return (
    <div
      ref={ref}
      role="tooltip"
      className="pointer-events-none fixed z-[100] w-64 overflow-hidden rounded-sm border border-line/30 bg-panel shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
      style={{ left, top }}
    >
      {bar.image ? (
        <span className="relative block h-24 w-full bg-ink-2">
          <Image src={bar.image} alt="" fill sizes="256px" quality={65} unoptimized={!bar.image.startsWith("/")} className="object-cover object-[50%_28%]" />
        </span>
      ) : null}
      <div className="p-2.5">
        <div className="break-words text-sm font-medium text-parch">{bar.title}</div>
        <div className="mt-0.5 text-[0.78rem] text-muted">
          {t(CATEGORY_KEY[bar.category])} · {range(bar.start, bar.end)}
        </div>
        <div className={cn("mt-0.5 text-[0.78rem]", STATUS_TONE[bar.status])}>{statusText(bar, today)}</div>
      </div>
    </div>
  );
}
