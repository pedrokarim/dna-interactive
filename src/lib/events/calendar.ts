/**
 * Calendrier des événements Duet Night Abyss — données + logique pure paramétrique.
 *
 * Données réelles curées (fin du patch 1.4 « Silver Torrent, Rising Star » et
 * patch 1.5 « Paradise Prelude », juillet-septembre 2026), à rafraîchir à chaque
 * version. Aucune source tierce n'est créditée au front.
 *
 * Le calendrier est une **frise défilable sans borne** : une plage rendue
 * (`rangeStart` + nombre de jours) qui s'étend à la volée quand on atteint un
 * bord, une échelle en pixels/jour pilotée par le zoom, et les événements
 * chargés par fenêtre autour de ce qu'on regarde.
 *
 * « Aujourd'hui » = **l'horloge locale du visiteur** (`localTodayIso`), rafraîchie
 * côté client. Les fonctions de ce module restent pures : la date du jour est
 * toujours passée en paramètre, jamais lue ici (SSR sûr, testable).
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
  /**
   * Lien vers l'**annonce officielle** d'où l'événement est tiré (site officiel,
   * annonce Steam de l'éditeur, PV officiel). Uniquement des sources officielles :
   * aucun agrégateur ni site concurrent. Vide tant que rien d'officiel n'est publié.
   */
  sourceUrl?: string;
};

/* Annonces officielles réutilisées par plusieurs événements. */
const SRC_V14 = "https://store.steampowered.com/news/app/3950020/view/1833968530898688";
/** Notes de version officielles 1.5 « Paradise Prelude » (source de toutes les dates 1.5). */
const SRC_V15 = "https://store.steampowered.com/news/app/3950020/view/1839041357036785";
const SRC_V15_EVENT = "https://duetnightabyss.dna-panstudio.com/dna-event/en/";
const SRC_V15_PV = "https://www.youtube.com/watch?v=c8di9Y1wV8E";
/* Annonces d'événement publiées sur le compte officiel du jeu. */
const SRC_V15_ENSEMBLE = "https://x.com/DNAbyss_EN/status/2084927398106255537";
const SRC_V15_DERBY = "https://x.com/DNAbyss_EN/status/2084489506036875471";

export const CATEGORIES: EventCategory[] = ["Bannière", "Arme", "Événement", "Épreuve", "Récompense"];

export const CATEGORY_TINT: Record<EventCategory, string> = {
  Bannière: "var(--color-crimson-bright)",
  Arme: "var(--color-gold)",
  Événement: "var(--color-anemo)",
  Épreuve: "var(--color-electro)",
  Récompense: "var(--color-hydro)",
};

/** Zooms disponibles = nombre de jours tenant dans la largeur visible. */
export const CALENDAR_ZOOMS = [14, 30, 60] as const;
export type CalendarZoom = (typeof CALENDAR_ZOOMS)[number];
export const DEFAULT_ZOOM: CalendarZoom = 30;

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "grace-benign-night", title: "Grace Upon the Benign Night", category: "Bannière", start: "2026-06-02", end: "2026-07-27", image: "/assets/official-v1.4/image-flora.webp", description: "Bannière Myriad limitée — inclut les skins de Flora et Rebecca.", sourceUrl: SRC_V14 },
  { id: "summer-dreams", title: "Summer Dreams Aflutter", category: "Bannière", start: "2026-06-02", end: "2026-07-27", image: "/assets/worldview/worldview-8.webp", description: "Bannière Myriad limitée de la saison estivale.", sourceUrl: SRC_V14 },
  { id: "firearm-feast", title: "Firearm Feast — arme signature de Hilda", category: "Arme", start: "2026-06-30", end: "2026-07-27", image: "/assets/worldview/worldview-10.webp", description: "Bannière d'arme (Secret Letters) — l'arme signature de Hilda.", sourceUrl: SRC_V14 },
  { id: "silver-torrent", title: "Silver Torrent, Rising Star — récompense", category: "Récompense", start: "2026-06-02", end: "2026-07-27", image: "/assets/worldview/worldview-6.webp", description: "Récompense de sélection : un personnage et une arme offerts.", sourceUrl: SRC_V14 },
  { id: "immersive-theatre", title: "Immersive Theatre : Ensemble Act (1.4)", category: "Événement", start: "2026-06-18", end: "2026-07-27", image: "/assets/worldview/worldview-3.webp", description: "Défi coopératif : battre le boss en équipe.", sourceUrl: SRC_V14 },
  { id: "starry-gleanings", title: "Starry Gleanings — commissions", category: "Événement", start: "2026-06-25", end: "2026-07-13", image: "/assets/worldview/worldview-4.webp", description: "Événement commissions : récompenses à accumuler.", sourceUrl: SRC_V14 },
  { id: "resonant-orisons", title: "Resonant Orisons — skins Lynn & Lady Nifle", category: "Événement", start: "2026-06-30", end: "2026-07-27", image: "/assets/worldview/worldview-9.webp", description: "Événement à durée limitée — nouveaux skins pour Lynn et Lady Nifle.", sourceUrl: SRC_V14 },
  { id: "days-tranquility", title: "Days of Tranquility — connexion", category: "Récompense", start: "2026-06-30", end: "2026-07-27", image: "/assets/worldview/worldview-5.webp", description: "Connexion sur 7 jours pour des Sabliers immaculés.", sourceUrl: SRC_V14 },
  { id: "traces-sand", title: "Traces in the Sand — essai de Hilda", category: "Épreuve", start: "2026-06-30", end: "2026-07-27", image: "/assets/worldview/worldview-11.webp", description: "Essai de personnage : teste Hilda gratuitement.", sourceUrl: SRC_V14 },
  { id: "starry-sojourn", title: "Starry Sojourn — co-op (1.4)", category: "Événement", start: "2026-07-09", end: "2026-07-27", image: "/assets/worldview/worldview-7.webp", description: "Récompenses de temps de jeu en coopération.", sourceUrl: SRC_V14 },
  { id: "bountiful-day-2", title: "Bountiful Day — Partie 2 (1.4)", category: "Événement", start: "2026-07-10", end: "2026-07-17", image: "/assets/worldview/worldview-2.webp", description: "Retour d'événement : taux de drop de Demon Wedge augmentés.", sourceUrl: SRC_V14 },
  { id: "atlasia-calling", title: "Atlasia Calling — parrainage", category: "Récompense", start: "2026-06-02", end: "2026-07-27", image: "/assets/worldview/worldview-1-3-1.webp", description: "Invite des joueurs et récupère les paliers de récompenses de parrainage.", sourceUrl: SRC_V14 },
  { id: "lunos-rail-rumpus", title: "Luno's Rail Rumpus", category: "Événement", start: "2026-06-04", end: "2026-07-25", image: "/assets/worldview/worldview-1-4-1.webp", description: "Événement coopératif ferroviaire de la saison Bloomfield.", sourceUrl: SRC_V14 },

  /* ------------------------------------------------ patch 1.5 « Paradise Prelude » */
  { id: "rabbit-in-wonderland", title: "Rabbit in Wonderland — connexion", category: "Récompense", start: "2026-07-23", end: "2026-08-04", image: "/assets/official-v1.5/key-art-ada.webp", description: "Connexion quotidienne d'ouverture de la version Paradise Prelude.", sourceUrl: SRC_V15_PV },
  { id: "paradise-prelude", title: "Paradise Prelude — événement web", category: "Récompense", start: "2026-07-23", end: "2026-09-03", image: "/assets/official-v1.5/banner-paradise-prelude.webp", description: "Événement web de la version 1.5 : Ada offerte et récompenses à réclamer.", sourceUrl: SRC_V15_EVENT },
  { id: "atlasian-hunt", title: "Atlasian Hunt — quiz", category: "Événement", start: "2026-07-27", end: "2026-08-07", image: "/assets/worldview/worldview-1-3-2.webp", description: "Chasse aux réponses sur le lore d'Atlasia, récompenses quotidiennes." },
  { id: "nocturne-in-white", title: "Nocturne in White", category: "Bannière", start: "2026-07-28", end: "2026-09-07", image: "/assets/official-v1.5/image-snowlight.webp", description: "Bannière Myriad limitée de la version 1.5 — inclut le skin « Snowlight Chase » d'Ada.", sourceUrl: SRC_V15 },
  { id: "the-best-day", title: "The Best Day — arme signature d'Ada", category: "Arme", start: "2026-07-28", end: "2026-09-07", image: "/assets/official-v1.5/image-icelake.webp", description: "Bannière d'arme (Secret Letters) : les doubles pistolets d'Ada remplacent Firearm Feast.", sourceUrl: SRC_V15 },
  { id: "immersive-theatre-ada", title: "Immersive Theatre : « Ada »", category: "Événement", start: "2026-07-28", end: "2026-08-24", image: "/assets/official-v1.5/key-art-ada.webp", description: "Rotation de 28 jours du théâtre immersif : récupère les Secret Letters d'Ada et de « The Best Day » avant la bascule du 25 août.", sourceUrl: SRC_V15 },
  { id: "oceans-distant-rhythm", title: "Ocean's Distant Rhythm — rerun skin Fushu", category: "Bannière", start: "2026-07-28", end: "2026-09-07", image: "/assets/worldview/worldview-1-3-6.webp", description: "Rerun limité de la bannière Myriad du skin de Fushu.", sourceUrl: SRC_V15 },
  { id: "bloomfield-tales-untold", title: "Bloomfield Station : Tales Untold", category: "Événement", start: "2026-07-28", end: "2026-09-07", image: "/assets/worldview/worldview-1-4-2.webp", description: "Chapitre d'histoire de la version 1.5 autour de la gare de Flodia Bloomfield.", sourceUrl: SRC_V15 },
  { id: "white-bunnies-invitation", title: "White Bunnies' Invitation — connexion", category: "Récompense", start: "2026-07-28", end: "2026-09-07", image: "/assets/worldview/worldview-1-3-3.webp", description: "Cumule tes connexions jusqu'au 7 septembre pour 10 Sabliers immaculés.", sourceUrl: SRC_V15 },
  { id: "treasure-hunt-trials", title: "Treasure Hunt Trials", category: "Épreuve", start: "2026-07-28", end: "2026-09-07", image: "/assets/worldview/worldview-1-3-8.webp", description: "Simulation calquée sur l'Incense Proving de Huaxu : franchis les paliers pour des récompenses.", sourceUrl: SRC_V15 },
  { id: "snowveil-fairytale", title: "Snowveil Fairytale — essai du skin d'Ada", category: "Événement", start: "2026-07-28", end: "2026-09-07", image: "/assets/official-v1.5/image-ada.webp", description: "Essaie la tenue hivernale d'Ada pendant toute la durée de la version 1.5." },
  { id: "bards-tome-summer-beat", title: "Bard's Tome : Summer Beat", category: "Récompense", start: "2026-07-28", end: "2026-09-07", image: "/assets/worldview/worldview-8.webp", description: "Passe saisonnier : accomplis les quêtes du Grimoire du barde pour monter les paliers de vers et récolter les récompenses." },
  { id: "great-chaos-mechapuppets", title: "Great Chaos of Mechapuppets", category: "Événement", start: "2026-07-30", end: "2026-09-07", image: "/assets/official-v1.5/image-mechapuppets.webp", description: "Événement de stratégie : déploie les pantins mécaniques et laisse le plateau trancher.", sourceUrl: SRC_V15 },
  { id: "bountiful-day-v15-p1", title: "Bountiful Day — Partie 1 (1.5)", category: "Événement", start: "2026-07-30", end: "2026-08-06", image: "/assets/worldview/worldview-1-4-3.webp", description: "Taux de drop de Demon Wedge augmentés pendant une semaine.", sourceUrl: SRC_V15 },
  { id: "immersive-theatre-ensemble-v15", title: "Immersive Theatre : Ensemble Act (1.5)", category: "Événement", start: "2026-08-06", end: "2026-09-06", image: "/assets/worldview/worldview-1-4-5.webp", description: "Co-op du théâtre immersif : prends le rôle de Lead, abats les boss en équipe et récolte les ressources de progression.", sourceUrl: SRC_V15_ENSEMBLE },
  { id: "golden-journey-derby", title: "Golden Journey : Genimon Derby", category: "Événement", start: "2026-08-06", end: "2026-08-18", image: "/assets/worldview/worldview-1-3-4.webp", description: "Courses de génimons : mise, entraîne et empoche les gains (fin le 18 août à 05:00 UTC+8).", sourceUrl: SRC_V15_DERBY },
  { id: "edge-of-trial", title: "Edge of Trial", category: "Épreuve", start: "2026-08-13", end: "2026-09-01", image: "/assets/worldview/worldview-1-4-4.webp", description: "Épreuve de combat compétitive : croise le fer et affûte ta lame (rang d'épreuve Lv. 50).", sourceUrl: SRC_V15 },
  { id: "crimson-mirage", title: "Crimson Mirage — skins Camilla & Hilda", category: "Bannière", start: "2026-08-18", end: "2026-09-29", image: "/assets/official-v1.5/image-crimson.webp", description: "Bannière de skins limitée : tenues « Nightfall Enchantress » pour Camilla et Hilda.", sourceUrl: SRC_V15 },
  { id: "starry-sojourn-v15", title: "Starry Sojourn — co-op (1.5)", category: "Événement", start: "2026-08-20", end: "2026-09-01", image: "/assets/worldview/worldview-7.webp", description: "Récompenses selon le temps passé en coop régionale pendant l'événement.", sourceUrl: SRC_V15 },
  { id: "starry-gleanings-2", title: "Starry Gleanings II — commissions", category: "Événement", start: "2026-08-20", end: "2026-09-01", image: "/assets/worldview/worldview-1-3-5.webp", description: "Retour des commissions : objectifs à accumuler pour des récompenses.", sourceUrl: SRC_V15 },
  { id: "bountiful-day-v15-p2", title: "Bountiful Day — Partie 2 (1.5)", category: "Événement", start: "2026-08-20", end: "2026-08-27", image: "/assets/worldview/worldview-1-4-3.webp", description: "Deuxième fenêtre de taux de drop de Demon Wedge augmentés.", sourceUrl: SRC_V15 },
  { id: "phoxhunter-summit", title: "Phoxhunter Summit", category: "Épreuve", start: "2026-08-26", end: "2026-09-05", image: "/assets/worldview/worldview-1.webp", description: "Épreuve compétitive de fin de version (rang d'épreuve requis).", sourceUrl: SRC_V15 },
];

/* --------------------------------------------------------------- helpers date */

const DAY_MS = 86_400_000;

/** Une date ISO `AAAA-MM-JJ` est lue comme minuit **UTC** : tous les calculs de
 *  décalage se font en jours entiers, sans piège de fuseau ni d'heure d'été. */
export function addDaysIso(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

export function diffDays(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY_MS);
}

/**
 * Date du jour **dans le fuseau de celui qui regarde** (`AAAA-MM-JJ`).
 *
 * On lit les champs locaux (pas `toISOString`, qui renverrait la date UTC et
 * décalerait d'un jour une bonne partie du globe en soirée/matinée).
 */
export function localTodayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type EventStatus = "past" | "ongoing" | "upcoming";

export function eventStatus(ev: CalendarEvent, todayIso: string): EventStatus {
  if (Date.parse(todayIso) < Date.parse(ev.start)) return "upcoming";
  if (Date.parse(todayIso) > Date.parse(ev.end)) return "past";
  return "ongoing";
}

/* --------------------------------------------------------------- frise : plage */

/** Jours ajoutés de chaque côté au premier rendu (la frise démarre déjà large). */
export const RANGE_PAD_DAYS = 540;
/** Jours ajoutés à chaque fois qu'on atteint un bord — navigation sans borne. */
export const RANGE_EXTEND_DAYS = 365;
/** Marge de préchargement autour de ce qui est visible (en jours). */
export const FETCH_BUFFER_DAYS = 45;
/** Fenêtre d'événements rendue côté serveur au premier affichage (jours avant/après). */
export const INITIAL_WINDOW_BEFORE = 120;
export const INITIAL_WINDOW_AFTER = 240;
/** Largeur mini d'une barre pour rester lisible (px) — sert aussi au calage des voies. */
export const MIN_BAR_PX = 168;

/** Pas de graduation adapté à l'échelle (en jours). */
export function tickStepForScale(pxPerDay: number): number {
  if (pxPerDay >= 46) return 1;
  if (pxPerDay >= 22) return 2;
  if (pxPerDay >= 9) return 7;
  return 14;
}

export type CalendarTick = { iso: string; offsetDays: number };

/**
 * Graduations entre deux décalages (en jours depuis `rangeStartIso`), alignées
 * sur des multiples absolus de `step` **ancrés au lundi** — les repères ne
 * bougent donc pas quand la plage rendue s'étend vers le passé.
 */
export function dayTicks(rangeStartIso: string, fromOffset: number, toOffset: number, step: number): CalendarTick[] {
  const startEpochDay = Math.round(Date.parse(rangeStartIso) / DAY_MS);
  // 1970-01-01 = jeudi ; +4 jours pour ancrer les multiples sur un lundi.
  const align = (epochDay: number) => Math.ceil((epochDay - 4) / step) * step + 4;
  const ticks: CalendarTick[] = [];
  for (let e = align(startEpochDay + fromOffset); e <= startEpochDay + toOffset; e += step) {
    ticks.push({ iso: new Date(e * DAY_MS).toISOString().slice(0, 10), offsetDays: e - startEpochDay });
  }
  return ticks;
}

export type MonthBand = { iso: string; offsetDays: number; days: number };

/** Bandeaux de mois couvrant la plage rendue (le premier est rogné à gauche). */
export function monthBands(rangeStartIso: string, totalDays: number): MonthBand[] {
  const startMs = Date.parse(rangeStartIso);
  const endMs = startMs + totalDays * DAY_MS;
  const first = new Date(startMs);
  let cursor = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1);
  const bands: MonthBand[] = [];
  while (cursor < endMs) {
    const c = new Date(cursor);
    const next = Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 1);
    const rawOffset = Math.round((cursor - startMs) / DAY_MS);
    const rawDays = Math.round((next - cursor) / DAY_MS);
    const offsetDays = Math.max(0, rawOffset);
    bands.push({ iso: new Date(cursor).toISOString().slice(0, 10), offsetDays, days: rawDays + Math.min(0, rawOffset) });
    cursor = next;
  }
  return bands;
}

/* --------------------------------------------------------------- frise : voies */

export type CalendarBar = {
  id: string;
  title: string;
  category: EventCategory;
  tint: string;
  start: string;
  end: string;
  href?: string;
  image?: string;
  description?: string;
  sourceUrl?: string;
  status: EventStatus;
  /** Décalage en jours depuis `rangeStartIso` (peut être négatif si l'événement déborde). */
  offsetDays: number;
  /** Durée en jours, bornes incluses (≥ 1). */
  lengthDays: number;
  /** Voie horizontale attribuée par le calage (0 = ligne du haut). */
  lane: number;
};

/**
 * Range les événements en **voies** : chacun prend la première voie libre à sa
 * date de début (calage glouton type Gantt). Un événement occupe au minimum
 * `minSpanDays` pour que deux barres courtes ne se chevauchent pas à l'écran.
 *
 * Le tri est total (début puis id) → même entrée, même sortie : les barres ne
 * sautent pas de voie au hasard quand un lot d'événements arrive.
 */
export function layoutBars(
  events: CalendarEvent[],
  rangeStartIso: string,
  todayIso: string,
  minSpanDays: number,
): CalendarBar[] {
  const sorted = [...events].sort((a, b) => (a.start === b.start ? a.id.localeCompare(b.id) : a.start < b.start ? -1 : 1));
  const laneEndOffset: number[] = [];

  return sorted.map((ev) => {
    const offsetDays = diffDays(rangeStartIso, ev.start);
    const lengthDays = Math.max(1, diffDays(ev.start, ev.end) + 1);
    const occupied = Math.max(lengthDays, minSpanDays);
    let lane = laneEndOffset.findIndex((end) => end <= offsetDays);
    if (lane === -1) lane = laneEndOffset.length;
    laneEndOffset[lane] = offsetDays + occupied;
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
      sourceUrl: ev.sourceUrl,
      status: eventStatus(ev, todayIso),
      offsetDays,
      lengthDays,
      lane,
    };
  });
}

/** Événements chevauchant `[fromIso, toIso]` (bornes incluses). */
export function eventsInRange(events: CalendarEvent[], fromIso: string, toIso: string): CalendarEvent[] {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  return events.filter((ev) => Date.parse(ev.end) >= from && Date.parse(ev.start) <= to);
}
