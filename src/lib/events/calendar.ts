/**
 * Calendrier des événements en cours de Duet Night Abyss.
 *
 * Données réelles curées manuellement (patch 1.4 « Silver Torrent, Rising Star »,
 * fenêtre juillet 2026) — à rafraîchir à chaque version du jeu. Aucune source
 * tierce n'est créditée dans le front ; ce sont des faits (noms + dates) du jeu.
 *
 * Positions calculées sur une fenêtre glissante ; tout est déterministe (pas de
 * `Date.now()`), donc sûr en SSR.
 */

export type EventCategory = "Bannière" | "Arme" | "Événement" | "Épreuve" | "Récompense";

export type CalendarEvent = {
  title: string;
  category: EventCategory;
  /** ISO date (inclus). */
  start: string;
  /** ISO date (inclus). */
  end: string;
  /** À venir (démarre après « aujourd'hui »). */
  upcoming?: boolean;
};

export const CATEGORY_TINT: Record<EventCategory, string> = {
  Bannière: "var(--color-crimson-bright)",
  Arme: "var(--color-gold)",
  Événement: "var(--color-anemo)",
  Épreuve: "var(--color-electro)",
  Récompense: "var(--color-hydro)",
};

/** Fenêtre affichée (30 jours autour de la période courante). */
export const CALENDAR_WINDOW = { start: "2026-06-28", days: 30 } as const;
/** Repère « aujourd'hui » (contexte applicatif). */
export const CALENDAR_TODAY = "2026-07-11";

/** Graduations (dates réelles espacées d'une semaine). */
export const CALENDAR_TICKS: { label: string; iso: string }[] = [
  { label: "28 juin", iso: "2026-06-28" },
  { label: "5 juil", iso: "2026-07-05" },
  { label: "12 juil", iso: "2026-07-12" },
  { label: "19 juil", iso: "2026-07-19" },
  { label: "26 juil", iso: "2026-07-26" },
];

/** Événements en cours / à venir (triés par date de début). */
export const CALENDAR_EVENTS: CalendarEvent[] = [
  { title: "Grace Upon the Benign Night", category: "Bannière", start: "2026-06-02", end: "2026-07-27" },
  { title: "Summer Dreams Aflutter", category: "Bannière", start: "2026-06-02", end: "2026-07-27" },
  { title: "Firearm Feast — arme signature de Hilda", category: "Arme", start: "2026-06-30", end: "2026-07-27" },
  { title: "Silver Torrent, Rising Star — récompense", category: "Récompense", start: "2026-06-02", end: "2026-07-27" },
  { title: "Immersive Theatre : Ensemble Act", category: "Événement", start: "2026-06-18", end: "2026-07-27" },
  { title: "Starry Gleanings — commissions", category: "Événement", start: "2026-06-25", end: "2026-07-13" },
  { title: "Resonant Orisons — skins Lynn & Lady Nifle", category: "Événement", start: "2026-06-30", end: "2026-07-27" },
  { title: "Days of Tranquility — connexion", category: "Récompense", start: "2026-06-30", end: "2026-07-27" },
  { title: "Traces in the Sand — essai de Hilda", category: "Épreuve", start: "2026-06-30", end: "2026-07-27" },
  { title: "Starry Sojourn — co-op", category: "Événement", start: "2026-07-09", end: "2026-07-27" },
  { title: "Bountiful Day — Partie 2", category: "Événement", start: "2026-07-10", end: "2026-07-17" },
  { title: "Phoxhunter Summit", category: "Épreuve", start: "2026-07-15", end: "2026-07-27", upcoming: true },
];

export type CalendarRow = {
  title: string;
  category: EventCategory;
  tint: string;
  start: string;
  end: string;
  upcoming: boolean;
  leftPct: number;
  widthPct: number;
};

const DAY_MS = 86_400_000;

function offsetDays(iso: string, startIso: string): number {
  return (Date.parse(iso) - Date.parse(startIso)) / DAY_MS;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Position en % de « aujourd'hui » dans la fenêtre (ou null si hors fenêtre). */
export function todayMarkerPct(): number | null {
  const off = offsetDays(CALENDAR_TODAY, CALENDAR_WINDOW.start);
  if (off < 0 || off > CALENDAR_WINDOW.days) return null;
  return (off / CALENDAR_WINDOW.days) * 100;
}

/** Convertit les événements en barres (left%/width%) clampées sur la fenêtre. */
export function computeCalendarRows(): CalendarRow[] {
  const days = CALENDAR_WINDOW.days;
  return CALENDAR_EVENTS.map((ev) => {
    const rawLeft = clamp(offsetDays(ev.start, CALENDAR_WINDOW.start), 0, days);
    const rawRight = clamp(offsetDays(ev.end, CALENDAR_WINDOW.start), 0, days);
    const leftPct = (rawLeft / days) * 100;
    const widthPct = Math.max(2, ((rawRight - rawLeft) / days) * 100);
    return {
      title: ev.title,
      category: ev.category,
      tint: CATEGORY_TINT[ev.category],
      start: ev.start,
      end: ev.end,
      upcoming: Boolean(ev.upcoming),
      leftPct,
      widthPct,
    };
  });
}
