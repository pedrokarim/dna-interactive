"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, CalendarDays, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaCornerBrackets, cn } from "@/components/dna";
import { useDominantColor } from "@/lib/color/dominant";
import {
  CALENDAR_ZOOMS,
  CATEGORIES,
  CATEGORY_TINT,
  FETCH_BUFFER_DAYS,
  MIN_BAR_PX,
  RANGE_EXTEND_DAYS,
  RANGE_PAD_DAYS,
  addDaysIso,
  dayTicks,
  diffDays,
  layoutBars,
  localTodayIso,
  monthBands,
  tickStepForScale,
  type CalendarBar,
  type CalendarEvent,
  type CalendarZoom,
  type EventCategory,
} from "@/lib/events/calendar";

const CATEGORY_KEY: Record<EventCategory, "categoryBanner" | "categoryWeapon" | "categoryEvent" | "categoryTrial" | "categoryReward"> = {
  Bannière: "categoryBanner",
  Arme: "categoryWeapon",
  Événement: "categoryEvent",
  Épreuve: "categoryTrial",
  Récompense: "categoryReward",
};

/** Distance au bord (px) qui déclenche l'extension de la plage rendue. */
const EDGE_TRIGGER_PX = 700;
/** Anti-rebond du chargement de données pendant le défilement (ms). */
const FETCH_DEBOUNCE_MS = 220;
/** Anti-rebond de la remontée « date au centre » vers l'URL (ms). */
const VIEW_DATE_DEBOUNCE_MS = 400;
/** Hauteur du bandeau mois + graduations (px). */
const HEADER_H = 46;

/* ------------------------------------------------------------------ couleur */

/** `#rrggbb` + alpha 0-1 → `rgba(...)`. Renvoie la couleur brute si non parsable. */
function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/* ------------------------------------------------------------------ horloge */

/**
 * Date du jour **du visiteur**, resynchronisée quand la page revient au premier
 * plan (onglet réveillé, retour sur le site) et une fois par minute pour passer
 * minuit sans rechargement.
 *
 * Le premier rendu utilise la valeur calculée côté serveur : identique au HTML
 * envoyé, donc pas d'écart d'hydratation ; l'effet corrige juste après avec le
 * fuseau réel du navigateur.
 */
function useToday(serverToday: string, override?: string): string {
  const [today, setToday] = useState(override || serverToday);

  useEffect(() => {
    // Forçage admin : la valeur d'init suffit, rien à resynchroniser.
    if (override) return;
    const sync = () => setToday(localTodayIso());
    sync();
    const timer = window.setInterval(sync, 60_000);
    const onWake = () => sync();
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, [override]);

  return today;
}

/* ------------------------------------------------------------------ barre */

type EventBarProps = {
  bar: CalendarBar;
  left: number;
  width: number;
  realWidth: number;
  top: number;
  height: number;
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
 * incrustés par-dessus. Position et largeur = dates réelles à l'échelle, avec une
 * largeur plancher pour rester lisible — le filet du bas, lui, ne couvre que la
 * durée réelle pour ne pas mentir sur la période.
 */
function EventBar({
  bar,
  left,
  width,
  realWidth,
  top,
  height,
  selected,
  rangeLabel,
  startLabel,
  onSelect,
  onHover,
  onLeave,
}: EventBarProps) {
  const t = useTranslations("homeHub");
  const dominant = useDominantColor(bar.image);
  // Couleur dominante de l'image → sinon teinte de catégorie.
  const accent = dominant ?? bar.tint;
  const faded = bar.status === "past";

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseMove={onHover}
      onMouseLeave={onLeave}
      aria-label={`${bar.title} — ${rangeLabel}`}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "group absolute overflow-hidden rounded-[4px] border text-left transition-[box-shadow,filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/70",
        selected ? "z-[3]" : "z-[1] hover:brightness-110",
        faded && "grayscale-[0.35]",
      )}
      style={{
        left,
        width,
        top,
        height,
        borderColor: withAlpha(accent, selected ? 0.95 : 0.55),
        boxShadow: selected
          ? `0 0 0 1px ${withAlpha(accent, 0.9)}, 0 6px 22px ${withAlpha(accent, 0.4)}`
          : `0 2px 12px ${withAlpha(accent, 0.22)}`,
        opacity: bar.status === "upcoming" ? 0.9 : 1,
        background: withAlpha(accent, 0.12),
      }}
    >
      {/* bannière incrustée */}
      {bar.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bar.image}
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
      {/* filet dominant en bas = durée réelle de l'événement */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-[2px]"
        style={{ width: realWidth, background: withAlpha(accent, 0.85) }}
      />

      {/* contenu */}
      <span className="relative flex h-full flex-col justify-between px-2.5 py-1.5">
        <span className="flex items-center gap-1.5">
          <span
            className="rounded-[3px] border px-1.5 py-0.5 font-mono text-[0.58rem] leading-none text-parch"
            style={{ borderColor: withAlpha(accent, 0.7), background: "rgba(8,8,9,0.72)" }}
          >
            {startLabel}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-[0.82rem] leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {bar.title}
          </span>
          <span
            className="block truncate font-caps text-[0.5rem] uppercase leading-none tracking-[0.16em]"
            style={{ color: withAlpha(accent, 0.95) }}
          >
            {t(CATEGORY_KEY[bar.category])}
          </span>
        </span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------- frise */

export type CalendarTimelineProps = {
  /** Événements de la fenêtre initiale (rendus côté serveur). */
  initialEvents: CalendarEvent[];
  /** Bornes de cette fenêtre initiale — point de départ du chargement progressif. */
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
  /** compact = home ; full = page dédiée (barres plus hautes, frise plus grande). */
  variant?: "compact" | "full";
  /** Slot à droite de la barre d'outils (ex. lien « Plein écran »). */
  headerRight?: ReactNode;
};

/**
 * Calendrier défilable : une frise horizontale sans borne. On scrolle librement
 * vers le passé ou le futur ; la plage rendue s'étend d'un an dès qu'on touche un
 * bord, et les événements sont chargés par fenêtre autour de la zone regardée
 * (jamais tout le calendrier d'un coup).
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
}: CalendarTimelineProps) {
  const locale = useLocale();
  const t = useTranslations("homeHub");
  const full = variant === "full";

  // timeZone UTC : nos dates ISO sont en UTC-minuit → même jour affiché partout.
  const dayFmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }), [locale]);
  const dayNumFmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC" }), [locale]);
  const monthFmt = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }), [locale]);
  const pillFmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" }), [locale]);
  const longFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
    [locale],
  );

  const today = useToday(serverToday, overrideToday);

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
    (px: number) => addDaysIso(rangeStart, Math.round(px / (pxPerDay || 1))),
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
        // Bornes élargies seulement après un aller-retour réussi : un échec sera
        // simplement retenté au prochain défilement.
        loadedRef.current = {
          from: from < loadedRef.current.from ? from : loadedRef.current.from,
          to: to > loadedRef.current.to ? to : loadedRef.current.to,
        };
      }
    } catch {
      // Requête annulée (défilement rapide) ou réseau K.O. → on retentera.
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

  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      const node = scrollerRef.current;
      if (node) setScrollLeft(node.scrollLeft);
    });
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Extension de la plage aux bords. On lit `scrollLeft` sur le DOM (et non un
  // état React, forcément en retard d'un événement) pour ne pas ré-étendre en
  // boucle sur une valeur périmée.
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

  // Jours ajoutés à gauche : on décale `scrollLeft` d'autant, avant peinture,
  // pour que la frise ne bouge pas d'un pixel sous le curseur.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || !scrollAdjustRef.current) return;
    el.scrollLeft += scrollAdjustRef.current;
    scrollAdjustRef.current = 0;
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

  // Date au centre de la vue → URL (page plein écran).
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
      const left = diffDays(rangeStart, iso) * pxPerDay - el.clientWidth / 2 + pxPerDay / 2;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: Math.max(0, left), behavior: smooth && !reduced ? "smooth" : "auto" });
    },
    [rangeStart, pxPerDay],
  );

  // Premier cadrage dès que la largeur est connue, puis conservation de la date
  // centrale à chaque changement de zoom.
  const centerIsoRef = useRef<string>(anchor);
  const initialisedRef = useRef(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !pxPerDay) return;
    if (!initialisedRef.current) return;
    centerIsoRef.current = offsetToIso(el.scrollLeft + el.clientWidth / 2);
  }, [scrollLeft, pxPerDay, offsetToIso]);

  useLayoutEffect(() => {
    if (!pxPerDay) return;
    if (!initialisedRef.current) {
      initialisedRef.current = true;
      centerOn(anchor, false);
      return;
    }
    centerOn(centerIsoRef.current, false);
    // Le zoom (pxPerDay) est la seule dépendance voulue : on recadre sur la date
    // du centre quand l'échelle change.
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
  const bars = useMemo(
    () => layoutBars(visibleEvents, rangeStart, today, minSpanDays),
    [visibleEvents, rangeStart, today, minSpanDays],
  );

  const laneCount = bars.reduce((max, b) => Math.max(max, b.lane + 1), 0);
  const laneH = full ? 58 : 46;
  const laneGap = 6;
  const lanesH = Math.max(laneCount, 1) * (laneH + laneGap);
  const bodyH = HEADER_H + lanesH + 8;

  const bands = useMemo(() => monthBands(rangeStart, rangeDays), [rangeStart, rangeDays]);

  // Fenêtre visible, en jours depuis le début de la plage rendue.
  const firstVisibleDay = pxPerDay ? Math.floor(scrollLeft / pxPerDay) : 0;
  const lastVisibleDay = pxPerDay ? Math.ceil((scrollLeft + viewportW) / pxPerDay) : 0;

  // Graduations : seulement autour du visible (± un écran) — une frise de
  // plusieurs années ne doit pas peupler le DOM de milliers de repères.
  const tickStep = tickStepForScale(pxPerDay);
  const tickFrom = Math.max(0, firstVisibleDay - span);
  const tickTo = Math.min(rangeDays, lastVisibleDay + span);
  const ticks = useMemo(
    () => (pxPerDay ? dayTicks(rangeStart, tickFrom, tickTo, tickStep) : []),
    [rangeStart, tickFrom, tickTo, tickStep, pxPerDay],
  );

  const todayLeft = diffDays(rangeStart, today) * pxPerDay;
  const todayOffScreen: -1 | 0 | 1 = !pxPerDay || !viewportW
    ? 0
    : todayLeft < scrollLeft
      ? -1
      : todayLeft > scrollLeft + viewportW
        ? 1
        : 0;

  const visibleFromIso = addDaysIso(rangeStart, firstVisibleDay);
  const visibleToIso = addDaysIso(rangeStart, lastVisibleDay);
  const barsOnScreen = bars.filter(
    (b) => b.offsetDays + Math.max(b.lengthDays, minSpanDays) >= firstVisibleDay && b.offsetDays <= lastVisibleDay,
  ).length;

  // Les voies sont calculées sur tout ce qui est chargé (positions stables), mais
  // on ne monte dans le DOM que les barres proches de l'écran : les bannières des
  // événements lointains ne sont ni rendues ni téléchargées.
  const renderedBars = bars.filter(
    (b) => b.offsetDays + Math.max(b.lengthDays, minSpanDays) >= tickFrom && b.offsetDays <= tickTo,
  );

  /* ------------------------------------------------------------ sélection */

  const [selected, setSelected] = useState<CalendarBar | null>(null);
  const [tip, setTip] = useState<{ bar: CalendarBar; x: number; y: number } | null>(null);

  const range = (start: string, end: string) => `${dayFmt.format(new Date(start))} – ${dayFmt.format(new Date(end))}`;

  const detailInfo = (bar: CalendarBar) => {
    if (bar.status === "upcoming") {
      const d = diffDays(today, bar.start);
      return { label: t("upcoming"), note: d > 0 ? t("startsInDays", { days: d }) : t("startsToday"), tone: "text-hydro" };
    }
    if (bar.status === "past") return { label: t("finished"), note: "", tone: "text-muted" };
    const d = diffDays(today, bar.end);
    return { label: t("live"), note: d > 0 ? t("endsInDays", { days: d }) : t("lastDay"), tone: "text-anemo" };
  };

  const ctrlBtn =
    "flex h-8 w-8 items-center justify-center rounded-sm border border-line/25 text-parch/75 transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";

  return (
    <div className="relative overflow-hidden rounded-sm border border-line/20 bg-panel/60 p-4 sm:p-5">
      <DnaCornerBrackets size={14} />

      {/* barre d'outils : navigation + zoom */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" aria-label={t("previousPeriod")} onClick={() => nudge(-1)} className={ctrlBtn}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={goToday}
          className="flex items-center gap-1.5 rounded-sm border border-line/25 px-3 py-1.5 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-parch/80 transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {t("today")}
        </button>
        <button type="button" aria-label={t("nextPeriod")} onClick={() => nudge(1)} className={ctrlBtn}>
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="ml-1 font-mono text-[0.68rem] text-muted">{range(visibleFromIso, visibleToIso)}</span>
        {loading ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin text-muted-2" /> : null}

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
              {t(z === 14 ? "twoWeeks" : z === 30 ? "oneMonth" : "twoMonths")}
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
              {t(CATEGORY_KEY[cat])}
            </button>
          );
        })}
      </div>

      {/* frise défilable */}
      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          tabIndex={0}
          role="group"
          aria-label={t("eventCalendar")}
          className="custom-scrollbar overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          style={{ maxHeight: full ? "min(68vh, 720px)" : 360 }}
        >
          <div className="relative" style={{ width: contentW || "100%", height: bodyH }}>
            {/* bandeau des mois (reste visible en défilement vertical) */}
            <div className="sticky top-0 z-[6] h-[22px] bg-panel/95 backdrop-blur-[2px]">
              {bands.map((b) => (
                <div
                  key={b.iso}
                  className="absolute top-0 h-[22px] overflow-hidden border-l border-line/20"
                  style={{ left: b.offsetDays * pxPerDay, width: b.days * pxPerDay }}
                >
                  {/* collé au bord gauche : le mois en cours reste nommé même
                      quand son bandeau commence hors écran */}
                  <span className="sticky left-0 inline-block whitespace-nowrap py-[4px] pl-2 font-caps text-[0.55rem] uppercase leading-none tracking-[0.16em] text-parch/60">
                    {monthFmt.format(new Date(b.iso))}
                  </span>
                </div>
              ))}
            </div>

            {/* graduations du jour */}
            <div className="absolute inset-x-0 z-[1]" style={{ top: 22, height: HEADER_H - 22 }}>
              {ticks.map((tick) => (
                <span
                  key={tick.iso}
                  className="absolute top-0 -translate-x-1/2 font-mono text-[0.58rem] text-muted-2"
                  style={{ left: tick.offsetDays * pxPerDay }}
                >
                  {tickStep === 1 ? dayNumFmt.format(new Date(tick.iso)) : dayFmt.format(new Date(tick.iso))}
                </span>
              ))}
            </div>

            {/* filets verticaux des graduations */}
            <div aria-hidden className="absolute inset-x-0 z-0" style={{ top: HEADER_H, bottom: 0 }}>
              {ticks.map((tick) => (
                <span
                  key={tick.iso}
                  className="absolute inset-y-0 w-px bg-line/10"
                  style={{ left: tick.offsetDays * pxPerDay }}
                />
              ))}
            </div>

            {/* repère « aujourd'hui » — traverse toute la frise */}
            {pxPerDay > 0 ? (
              <>
                <span
                  aria-hidden
                  className="pointer-events-none absolute z-[5] w-[2px] bg-gold-bright"
                  style={{
                    left: todayLeft,
                    top: 22,
                    height: bodyH - 22,
                    boxShadow: "0 0 10px 1px rgba(233,196,106,0.55)",
                  }}
                />
                <span
                  className="pointer-events-none absolute z-[7] -translate-x-1/2 whitespace-nowrap rounded-[3px] border border-gold/60 bg-ink/90 px-1.5 py-0.5 font-caps text-[0.5rem] uppercase leading-none tracking-[0.14em] text-gold-bright"
                  style={{ left: todayLeft, top: 24 }}
                >
                  {t("todayShort")}
                </span>
              </>
            ) : null}

            {/* barres */}
            {renderedBars.map((b) => {
              const realWidth = Math.max(b.lengthDays * pxPerDay, 2);
              return (
                <EventBar
                  key={b.id}
                  bar={b}
                  left={b.offsetDays * pxPerDay}
                  width={Math.max(realWidth, MIN_BAR_PX)}
                  realWidth={realWidth}
                  top={HEADER_H + b.lane * (laneH + laneGap)}
                  height={laneH}
                  selected={selected?.id === b.id}
                  rangeLabel={range(b.start, b.end)}
                  startLabel={pillFmt.format(new Date(b.start))}
                  onSelect={() => setSelected((s) => (s?.id === b.id ? null : b))}
                  onHover={(e) => setTip({ bar: b, x: e.clientX, y: e.clientY })}
                  onLeave={() => setTip((p) => (p?.bar.id === b.id ? null : p))}
                />
              );
            })}
          </div>
        </div>

        {/* rien dans la période regardée */}
        {pxPerDay > 0 && barsOnScreen === 0 ? (
          <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-mono text-[0.7rem] text-muted-2">
            {t("noEvents")}
          </p>
        ) : null}

        {/* « aujourd'hui » hors écran : raccourci pour y revenir */}
        {todayOffScreen !== 0 ? (
          <button
            type="button"
            onClick={goToday}
            className={cn(
              "absolute top-1/2 z-[8] flex -translate-y-1/2 items-center gap-1 rounded-sm border border-gold/50 bg-ink/90 px-2 py-1 font-caps text-[0.5rem] uppercase tracking-[0.14em] text-gold-bright shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-colors hover:border-gold hover:bg-ink",
              todayOffScreen === -1 ? "left-2" : "right-4",
            )}
          >
            {todayOffScreen === -1 ? <ChevronLeft className="h-3 w-3" /> : null}
            {t("todayShort")}
            {todayOffScreen === 1 ? <ChevronRight className="h-3 w-3" /> : null}
          </button>
        ) : null}
      </div>

      {/* détail de l'événement sélectionné */}
      {selected ? (
        <div className="mt-3 overflow-hidden rounded-sm border border-line/20 bg-ink/40">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 p-3">
            <span className="font-display text-sm text-parch">{selected.title}</span>
            <span className="font-caps text-[0.55rem] uppercase tracking-[0.14em] text-muted">{t(CATEGORY_KEY[selected.category])}</span>
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
                {t("view")} <ExternalLink className="h-3 w-3" />
              </Link>
            ) : null}
            {selected.description ? (
              <span className="w-full font-sans text-xs leading-relaxed text-parch/70">{selected.description}</span>
            ) : null}
            {selected.sourceUrl ? (
              <a
                href={selected.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 font-caps text-[0.55rem] uppercase tracking-[0.14em] text-muted hover:text-gold"
              >
                {t("officialAnnouncement")} <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-3 font-mono text-[0.6rem] text-muted-2">{t("calendarHint")}</p>
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
          {tip.bar.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tip.bar.image} alt="" aria-hidden className="h-24 w-full object-cover object-[50%_28%]" />
          ) : null}
          <div className="p-2.5">
            <div className="font-display text-sm text-parch">{tip.bar.title}</div>
            <div className="mt-0.5 font-caps text-[0.5rem] uppercase tracking-[0.14em]" style={{ color: tip.bar.tint }}>
              {t(CATEGORY_KEY[tip.bar.category])}
            </div>
            <div className="mt-1.5 font-mono text-[0.62rem] text-parch/75">{range(tip.bar.start, tip.bar.end)}</div>
            {(() => {
              const info = detailInfo(tip.bar);
              return (
                <div className={cn("mt-0.5 font-caps text-[0.55rem] uppercase tracking-[0.12em]", info.tone)}>
                  {info.label}
                  {info.note ? ` · ${info.note}` : ""}
                </div>
              );
            })()}
            {tip.bar.description ? (
              <p className="mt-1.5 font-sans text-[0.7rem] leading-snug text-parch/70">{tip.bar.description}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
