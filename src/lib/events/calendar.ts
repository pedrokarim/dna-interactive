/**
 * Calendrier des événements Duet Night Abyss — données + logique pure paramétrique.
 *
 * Données réelles curées (patch 1.4 « Silver Torrent, Rising Star », juillet 2026),
 * à rafraîchir à chaque version. Aucune source tierce n'est créditée au front.
 *
 * Tout est déterministe (pas de `Date.now()`) : le calendrier se déplace/zoome via
 * des fenêtres (start ISO + span en jours), sûr en SSR. « Aujourd'hui » = date de
 * référence du monde du jeu (`CALENDAR_TODAY`), pas l'horloge système.
 */

export type EventCategory = "Bannière" | "Arme" | "Événement" | "Épreuve" | "Récompense";

export type CalendarEvent = {
  id: string;
  title: string;
  category: EventCategory;
  start: string; // ISO date (inclus)
  end: string; // ISO date (inclus)
  href?: string;
  /**
   * Bannière (key art) qui remplit la barre du timeline. Idéalement une image
   * **paysage** ; une image carrée est recadrée (`object-cover`). La couleur
   * dominante en est extraite côté client pour teinter la barre.
   */
  image?: string;
  /** Infos affichées au survol / dans le détail. */
  description?: string;
};

export const CATEGORIES: EventCategory[] = ["Bannière", "Arme", "Événement", "Épreuve", "Récompense"];

export const CATEGORY_TINT: Record<EventCategory, string> = {
  Bannière: "var(--color-crimson-bright)",
  Arme: "var(--color-gold)",
  Événement: "var(--color-anemo)",
  Épreuve: "var(--color-electro)",
  Récompense: "var(--color-hydro)",
};

/** « Aujourd'hui » dans le monde du jeu (contexte applicatif). */
export const CALENDAR_TODAY = "2026-07-11";

/** Zooms disponibles (span en jours). */
export const CALENDAR_ZOOMS = [14, 30, 60] as const;
export type CalendarZoom = (typeof CALENDAR_ZOOMS)[number];
export const DEFAULT_ZOOM: CalendarZoom = 30;

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "grace-benign-night", title: "Grace Upon the Benign Night", category: "Bannière", start: "2026-06-02", end: "2026-07-27", image: "/assets/official-v1.4/image-flora.webp", description: "Bannière Myriad limitée — inclut les skins de Flora et Rebecca." },
  { id: "summer-dreams", title: "Summer Dreams Aflutter", category: "Bannière", start: "2026-06-02", end: "2026-07-27", image: "/assets/worldview/worldview-8.webp", description: "Bannière Myriad limitée de la saison estivale." },
  { id: "firearm-feast", title: "Firearm Feast — arme signature de Hilda", category: "Arme", start: "2026-06-30", end: "2026-07-27", image: "/assets/worldview/worldview-10.webp", description: "Bannière d'arme (Secret Letters) — l'arme signature de Hilda." },
  { id: "silver-torrent", title: "Silver Torrent, Rising Star — récompense", category: "Récompense", start: "2026-06-02", end: "2026-07-27", image: "/assets/worldview/worldview-6.webp", description: "Récompense de sélection : un personnage et une arme offerts." },
  { id: "immersive-theatre", title: "Immersive Theatre : Ensemble Act", category: "Événement", start: "2026-06-18", end: "2026-07-27", image: "/assets/worldview/worldview-3.webp", description: "Défi coopératif : battre le boss en équipe." },
  { id: "starry-gleanings", title: "Starry Gleanings — commissions", category: "Événement", start: "2026-06-25", end: "2026-07-13", image: "/assets/worldview/worldview-4.webp", description: "Événement commissions : récompenses à accumuler." },
  { id: "resonant-orisons", title: "Resonant Orisons — skins Lynn & Lady Nifle", category: "Événement", start: "2026-06-30", end: "2026-07-27", image: "/assets/worldview/worldview-9.webp", description: "Événement à durée limitée — nouveaux skins pour Lynn et Lady Nifle." },
  { id: "days-tranquility", title: "Days of Tranquility — connexion", category: "Récompense", start: "2026-06-30", end: "2026-07-27", image: "/assets/worldview/worldview-5.webp", description: "Connexion sur 7 jours pour des Sabliers immaculés." },
  { id: "traces-sand", title: "Traces in the Sand — essai de Hilda", category: "Épreuve", start: "2026-06-30", end: "2026-07-27", image: "/assets/worldview/worldview-11.webp", description: "Essai de personnage : teste Hilda gratuitement." },
  { id: "starry-sojourn", title: "Starry Sojourn — co-op", category: "Événement", start: "2026-07-09", end: "2026-07-27", image: "/assets/worldview/worldview-7.webp", description: "Récompenses de temps de jeu en coopération." },
  { id: "bountiful-day-2", title: "Bountiful Day — Partie 2", category: "Événement", start: "2026-07-10", end: "2026-07-17", image: "/assets/worldview/worldview-2.webp", description: "Retour d'événement : taux de drop de Demon Wedge augmentés." },
  { id: "phoxhunter-summit", title: "Phoxhunter Summit", category: "Épreuve", start: "2026-07-15", end: "2026-07-27", image: "/assets/worldview/worldview-1.webp", description: "Épreuve compétitive à venir." },
];

/* --------------------------------------------------------------- helpers date */

const DAY_MS = 86_400_000;

export function addDaysIso(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

export function diffDays(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY_MS);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Fenêtre par défaut (centrée sur la date de référence pour un span donné). */
export function defaultWindowStart(spanDays: number, refIso: string = CALENDAR_TODAY): string {
  return addDaysIso(refIso, -Math.round(spanDays * 0.45));
}

export type EventStatus = "past" | "ongoing" | "upcoming";

export function eventStatus(ev: CalendarEvent, refIso: string = CALENDAR_TODAY): EventStatus {
  if (Date.parse(refIso) < Date.parse(ev.start)) return "upcoming";
  if (Date.parse(refIso) > Date.parse(ev.end)) return "past";
  return "ongoing";
}

/* --------------------------------------------------------------- calculs fenêtre */

export type CalendarRow = {
  id: string;
  title: string;
  category: EventCategory;
  tint: string;
  start: string;
  end: string;
  href?: string;
  image?: string;
  description?: string;
  status: EventStatus;
  leftPct: number;
  widthPct: number;
  overflowLeft: boolean;
  overflowRight: boolean;
};

/** Barres visibles dans la fenêtre [windowStart, windowStart+spanDays], filtrées par catégorie. */
export function computeRows(
  windowStartIso: string,
  spanDays: number,
  categories?: EventCategory[],
  refIso: string = CALENDAR_TODAY,
  sourceEvents: CalendarEvent[] = CALENDAR_EVENTS,
): CalendarRow[] {
  const windowEndIso = addDaysIso(windowStartIso, spanDays);
  const catSet = categories && categories.length > 0 ? new Set(categories) : null;

  return sourceEvents.filter((ev) => {
    if (catSet && !catSet.has(ev.category)) return false;
    // garder ce qui chevauche la fenêtre
    return Date.parse(ev.end) >= Date.parse(windowStartIso) && Date.parse(ev.start) <= Date.parse(windowEndIso);
  }).map((ev) => {
    const startOff = diffDays(windowStartIso, ev.start);
    const endOff = diffDays(windowStartIso, ev.end);
    const left = clamp(startOff, 0, spanDays);
    const right = clamp(endOff, 0, spanDays);
    return {
      id: ev.id,
      title: ev.title,
      category: ev.category,
      tint: CATEGORY_TINT[ev.category],
      start: ev.start,
      end: ev.end,
      href: ev.href,
      image: ev.image,
      description: ev.description,
      status: eventStatus(ev, refIso),
      leftPct: (left / spanDays) * 100,
      widthPct: Math.max(1.5, ((right - left) / spanDays) * 100),
      overflowLeft: startOff < 0,
      overflowRight: endOff > spanDays,
    };
  });
}

export type CalendarTick = { iso: string; pct: number };

/** Graduations réparties dans la fenêtre (pas adapté au zoom). */
export function generateTicks(windowStartIso: string, spanDays: number): CalendarTick[] {
  const step = spanDays <= 14 ? 3 : spanDays <= 30 ? 7 : 14;
  const ticks: CalendarTick[] = [];
  for (let d = 0; d <= spanDays; d += step) {
    ticks.push({ iso: addDaysIso(windowStartIso, d), pct: (d / spanDays) * 100 });
  }
  return ticks;
}

/** Position en % d'une date dans la fenêtre (ou null si hors fenêtre). */
export function markerPct(iso: string, windowStartIso: string, spanDays: number): number | null {
  const off = diffDays(windowStartIso, iso);
  if (off < 0 || off > spanDays) return null;
  return (off / spanDays) * 100;
}
