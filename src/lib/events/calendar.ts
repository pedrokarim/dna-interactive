/**
 * Calendrier des événements Duet Night Abyss — données + logique pure paramétrique.
 *
 * Données réelles curées (patch 1.5 « Paradise Prelude » et patch 1.6
 * « Paradise's 22nd White Bunny », juillet-novembre 2026), à rafraîchir à chaque
 * version. Dates recoupées le 12 septembre 2026 sur les notes de version
 * officielles et les annonces du compte officiel du jeu. Les événements de la
 * 1.4, terminés le 27 juillet, ont quitté cette liste (ils restent en base).
 *
 * **Convention de dates** : `start`/`end` sont des jours **inclus**. Les
 * événements ferment à une heure précise (UTC+8, fuseau serveur) : une clôture
 * le 1ᵉʳ septembre à 05:00 laisse donc `end` au 1ᵉʳ septembre (l'événement est
 * encore ouvert ce jour-là), tandis qu'une clôture le 5 septembre à 00:00 met
 * `end` au 4 septembre. L'heure exacte est rappelée dans `description` dès
 * qu'elle risque d'induire en erreur.
 *
 * La version 1.6 « Paradise's 22nd White Bunny » est sortie le **8 septembre
 * 2026**. Ses périodes viennent toutes des notes de version officielles. Falsi
 * n'a **pas** de bannière Myriad : elle s'obtient via ses Secret Letters au
 * théâtre immersif (jusqu'au 29 septembre à 10:00 UTC+8) ou en boutique. Une
 * entrée « Where the Long Road Leads » la présentait à tort comme une bannière :
 * elle a été retirée. Aucune source tierce n'est créditée au front.
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
/** Notes de version officielles 1.5 « Paradise Prelude » (source de toutes les dates 1.5). */
const SRC_V15 = "https://store.steampowered.com/news/app/3950020/view/1839041357036785";
const SRC_V15_EVENT = "https://duetnightabyss.dna-panstudio.com/dna-event/en/";
const SRC_V15_PV = "https://www.youtube.com/watch?v=c8di9Y1wV8E";
/* Annonces d'événement publiées sur le compte officiel du jeu. */
const SRC_V15_ENSEMBLE = "https://x.com/DNAbyss_EN/status/2084927398106255537";
const SRC_V15_DERBY = "https://x.com/DNAbyss_EN/status/2084489506036875471";
const SRC_V15_EDGE = "https://x.com/DNAbyss_EN/status/2087388611805397497";
const SRC_V15_SOJOURN = "https://x.com/DNAbyss_EN/status/2089562936113279405";
const SRC_V15_GLEANINGS = "https://x.com/DNAbyss_EN/status/2089925328202326067";
const SRC_V15_BOUNTIFUL = "https://x.com/DNAbyss_EN/status/2089910242180034671";
const SRC_V15_PHOXHUNTER = "https://x.com/DNAbyss_EN/status/2091737265458586108";
/* Annonces de la version 1.6 « Paradise's 22nd White Bunny » (sortie le 8 septembre 2026). */
const SRC_V16_BARDS_TOME = "https://x.com/DNAbyss_EN/status/2094349488383197537";
const SRC_V16_CIVIC = "https://x.com/DNAbyss_EN/status/2094666568365953062";
/** Notes de version officielles 1.6 (source de toutes les périodes 1.6). */
const SRC_V16 = "https://steamcommunity.com/games/3950020/announcements/detail/676256891013171560";

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
  /* ------------------------------------------------ patch 1.5 « Paradise Prelude » */
  { id: "rabbit-in-wonderland", title: "Rabbit in Wonderland — connexion", category: "Récompense", start: "2026-07-23", end: "2026-08-04", image: "/assets/official-v1.5/key-art-ada.webp", description: "Connexion quotidienne d'ouverture de la version Paradise Prelude.", sourceUrl: SRC_V15_PV },
  { id: "paradise-prelude", title: "Paradise Prelude — événement web", category: "Récompense", start: "2026-07-23", end: "2026-09-03", image: "/assets/official-v1.5/banner-paradise-prelude.webp", description: "Événement web de la version 1.5 : Ada offerte et récompenses à réclamer.", sourceUrl: SRC_V15_EVENT },
  { id: "atlasian-hunt", title: "Atlasian Hunt — quiz", category: "Événement", start: "2026-07-27", end: "2026-08-07", image: "/assets/worldview/worldview-1-3-2.webp", description: "Chasse aux réponses sur le lore d'Atlasia, récompenses quotidiennes." },
  { id: "nocturne-in-white", title: "Nocturne in White", category: "Bannière", start: "2026-07-28", end: "2026-09-07", image: "/assets/official-v1.5/image-snowlight.webp", description: "Bannière Myriad limitée de la version 1.5 — inclut le skin « Snowlight Chase » d'Ada.", sourceUrl: SRC_V15 },
  { id: "the-best-day", title: "The Best Day — arme signature d'Ada", category: "Arme", start: "2026-07-28", end: "2026-08-18", image: "/assets/official-v1.5/image-icelake.webp", description: "Secret Letters des doubles pistolets d'Ada, en vente au Memento pendant la rotation « Ada » du théâtre immersif (jusqu'au 18 août à 10:00 UTC+8).", sourceUrl: SRC_V15 },
  { id: "immersive-theatre-ada", title: "Immersive Theatre : « Ada »", category: "Événement", start: "2026-07-28", end: "2026-08-18", image: "/assets/official-v1.5/key-art-ada.webp", description: "Rotation du théâtre immersif : récupère les Secret Letters d'Ada et de « The Best Day » au Memento avant la bascule du 18 août à 10:00 UTC+8.", sourceUrl: SRC_V15 },
  { id: "oceans-distant-rhythm", title: "Ocean's Distant Rhythm — rerun skin Fushu", category: "Bannière", start: "2026-07-28", end: "2026-09-07", image: "/assets/worldview/worldview-1-3-6.webp", description: "Rerun limité de la bannière Myriad du skin de Fushu.", sourceUrl: SRC_V15 },
  { id: "bloomfield-tales-untold", title: "Bloomfield Station : Tales Untold", category: "Événement", start: "2026-07-28", end: "2026-09-07", image: "/assets/worldview/worldview-1-4-2.webp", description: "Chapitre d'histoire de la version 1.5 autour de la gare de Flodia Bloomfield.", sourceUrl: SRC_V15 },
  { id: "white-bunnies-invitation", title: "White Bunnies' Invitation — connexion", category: "Récompense", start: "2026-07-28", end: "2026-09-07", image: "/assets/worldview/worldview-1-3-3.webp", description: "Cumule tes connexions jusqu'au 7 septembre pour 10 Sabliers immaculés.", sourceUrl: SRC_V15 },
  { id: "treasure-hunt-trials", title: "Treasure Hunt Trials", category: "Épreuve", start: "2026-07-28", end: "2026-09-08", image: "/assets/worldview/worldview-1-3-8.webp", description: "Simulation calquée sur l'Incense Proving de Huaxu : franchis les paliers pour des récompenses (clôture le 8 septembre à 05:00 UTC+8).", sourceUrl: SRC_V15 },
  { id: "snowveil-fairytale", title: "Snowveil Fairytale — essai du skin d'Ada", category: "Événement", start: "2026-07-28", end: "2026-09-07", image: "/assets/official-v1.5/image-ada.webp", description: "Essaie la tenue hivernale d'Ada pendant toute la durée de la version 1.5." },
  { id: "bards-tome-summer-beat", title: "Bard's Tome : Summer Beat", category: "Récompense", start: "2026-07-28", end: "2026-09-07", image: "/assets/worldview/worldview-8.webp", description: "Passe saisonnier : accomplis les quêtes du Grimoire du barde pour monter les paliers de vers et récolter les récompenses." },
  { id: "great-chaos-mechapuppets", title: "Great Chaos of Mechapuppets", category: "Événement", start: "2026-07-30", end: "2026-09-07", image: "/assets/official-v1.5/image-mechapuppets.webp", description: "Événement de stratégie : déploie les pantins mécaniques et laisse le plateau trancher.", sourceUrl: SRC_V15 },
  { id: "bountiful-day-v15-p1", title: "Bountiful Day — Partie 1 (1.5)", category: "Événement", start: "2026-07-30", end: "2026-08-06", image: "/assets/worldview/worldview-1-4-3.webp", description: "Taux de drop de Demon Wedge augmentés pendant une semaine.", sourceUrl: SRC_V15 },
  { id: "immersive-theatre-ensemble-v15", title: "Immersive Theatre : Ensemble Act (1.5)", category: "Événement", start: "2026-08-06", end: "2026-09-06", image: "/assets/worldview/worldview-1-4-5.webp", description: "Co-op du théâtre immersif : prends le rôle de Lead, abats les boss en équipe et récolte les ressources de progression.", sourceUrl: SRC_V15_ENSEMBLE },
  { id: "golden-journey-derby", title: "Golden Journey : Genimon Derby", category: "Événement", start: "2026-08-06", end: "2026-08-18", image: "/assets/worldview/worldview-1-3-4.webp", description: "Courses de génimons : mise, entraîne et empoche les gains (fin le 18 août à 05:00 UTC+8).", sourceUrl: SRC_V15_DERBY },
  { id: "edge-of-trial", title: "Edge of Trial", category: "Épreuve", start: "2026-08-13", end: "2026-09-01", image: "/assets/worldview/worldview-1-4-4.webp", description: "Épreuve de combat compétitive : croise le fer et affûte ta lame (rang d'épreuve Lv. 50, fin le 1ᵉʳ septembre à 05:00 UTC+8).", sourceUrl: SRC_V15_EDGE },
  { id: "crimson-mirage", title: "Crimson Mirage — skins Camilla & Hilda", category: "Bannière", start: "2026-08-18", end: "2026-09-29", image: "/assets/official-v1.5/image-crimson.webp", description: "Bannière de skins limitée : tenues « Nightfall Enchantress » pour Camilla et Hilda.", sourceUrl: SRC_V15 },
  { id: "starry-sojourn-v15", title: "Starry Sojourn — co-op (1.5)", category: "Événement", start: "2026-08-20", end: "2026-09-01", image: "/assets/worldview/worldview-7.webp", description: "Cumule du temps de jeu en zone coopérative pour réclamer les récompenses de l’événement.", sourceUrl: SRC_V15_SOJOURN },
  { id: "starry-gleanings-2", title: "Starry Gleanings II — commissions", category: "Événement", start: "2026-08-20", end: "2026-09-01", image: "/assets/worldview/worldview-1-3-5.webp", description: "Retour des commissions : accomplis-les pendant l’événement pour ouvrir les cadeaux Starglow.", sourceUrl: SRC_V15_GLEANINGS },
  { id: "bountiful-day-v15-p2", title: "Bountiful Day — Partie 2 (1.5)", category: "Événement", start: "2026-08-20", end: "2026-08-27", image: "/assets/worldview/worldview-1-4-3.webp", description: "Deuxième fenêtre de bonus : les commissions du Manuel du Noctoyager rapportent davantage de Demon Wedges.", sourceUrl: SRC_V15_BOUNTIFUL },
  { id: "phoxhunter-summit", title: "Phoxhunter Summit", category: "Épreuve", start: "2026-08-26", end: "2026-09-04", image: "/assets/worldview/worldview-1.webp", description: "Épreuve compétitive de fin de version en deux temps : phase de groupes, puis classement Apex pour des Phoxcoins à dépenser en boutique. Tous les ennemis sont faibles à l’Hydro ; clôture le 5 septembre à 00:00 UTC+8.", sourceUrl: SRC_V15_PHOXHUNTER },

  /* ------------------------------------- patch 1.6 « Paradise's 22nd White Bunny » */
  /* Sortie le 8 septembre 2026. Toutes les périodes viennent des notes de version
     officielles (SRC_V16). Falsi n'a PAS de bannière Myriad : elle s'obtient via ses
     Secret Letters au théâtre immersif, ou en boutique. */
  { id: "bards-tome-rimeveil-nocturne", title: "Bard's Tome : Rimeveil Nocturne", category: "Récompense", start: "2026-09-08", end: "2026-10-19", image: "/assets/events/bards-tome-rimeveil-nocturne.webp", description: "Passe saisonnier de la version 1.6 : monte les paliers du Grimoire du barde pour la posture « Crystal Heart » et le skin d'arme « Emberfrost » (clôture le 19 octobre à 17:00 UTC+8).", sourceUrl: SRC_V16_BARDS_TOME },
  { id: "civic-ordinance", title: "Civic Ordinance — skins thématiques", category: "Événement", start: "2026-09-08", end: "2026-10-19", image: "/assets/events/civic-ordinance.webp", description: "Remise à durée limitée en boutique sur la gamme de skins « Civic Ordinance » : première vague de neuf personnages, à échanger contre des Plumules.", sourceUrl: SRC_V16_CIVIC },
  { id: "parade-itinerary", title: "Parade Itinerary", category: "Événement", start: "2026-09-08", end: "2026-10-19", image: "/assets/events/parade-itinerary.webp", description: "Événement principal de la version 1.6 : à travers monts et forêts, une ville étrange t'accueille dans un paradis de rêve (fin le 19 octobre à 17:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "immersive-theatre-falsi", title: "Immersive Theatre : « Falsi »", category: "Événement", start: "2026-09-08", end: "2026-09-29", href: "/characters/falsi", image: "/assets/worldview/worldview-1-6-1.webp", description: "Rotation du théâtre immersif : récupère les Secret Letters de Falsi et de « Stifled Howl » au Memento avant la bascule du 29 septembre à 10:00 UTC+8. Falsi s'achète aussi en boutique.", sourceUrl: SRC_V16 },
  { id: "stifled-howl", title: "Stifled Howl – arme de Falsi", category: "Arme", start: "2026-09-08", end: "2026-09-29", href: "/items/weapons/weapons-10405", image: "/assets/worldview/worldview-10.webp", description: "Secret Letters des doubles lames de Falsi, en vente au Memento pendant la rotation « Falsi » du théâtre immersif (jusqu'au 29 septembre à 10:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "way-of-the-penitent", title: "Way of the Penitent – connexion", category: "Récompense", start: "2026-09-08", end: "2026-10-19", image: "/assets/worldview/worldview-1-6-3.webp", description: "Connexion cumulée de la version 1.6 (fin le 19 octobre à 17:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "treasure-hunt-trials-v16", title: "Treasure Hunt Trials (1.6)", category: "Épreuve", start: "2026-09-08", end: "2026-10-20", image: "/assets/worldview/worldview-1-3-8.webp", description: "Simulation calquée sur l'Incense Proving de Huaxu : franchis les paliers pour des récompenses (clôture le 20 octobre à 05:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "opulent-rebate", title: "Opulent Rebate", category: "Récompense", start: "2026-09-08", end: "2026-10-19", image: "/assets/worldview/worldview-5.webp", description: "Événement de remboursement à durée limitée (fin le 19 octobre à 17:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "better-luno-than-never", title: "Better Luno than Never", category: "Épreuve", start: "2026-09-08", end: "2026-09-29", image: "/assets/worldview/worldview-1-4-1.webp", description: "Défi à durée limitée : Lulu Lunoloot se rend, ses Phoxenes à la main, et implore ta clémence. À toi de trancher (fin le 29 septembre à 05:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "vibrant-strokes", title: "Vibrant Strokes", category: "Événement", start: "2026-09-08", end: "2026-10-19", image: "/assets/worldview/worldview-9.webp", description: "Événement à durée limitée de la version 1.6 (fin le 19 octobre à 17:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "moments-in-frames", title: "Moments in Frames", category: "Événement", start: "2026-09-10", end: "2026-09-29", image: "/assets/worldview/worldview-3.webp", description: "Un photographe itinérant, près du Sanctuaire, te fait découvrir les Notes d'image : une autre façon de garder trace de ton voyage (fin le 29 septembre à 05:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "bountiful-day-v16-p1", title: "Bountiful Day – Partie 1 (1.6)", category: "Événement", start: "2026-09-10", end: "2026-09-17", image: "/assets/worldview/worldview-1-4-3.webp", description: "Les commissions du Manuel du Noctoyager rapportent davantage de Demon Wedges (fin le 17 septembre à 05:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "starry-sojourn-v16", title: "Starry Sojourn – co-op (1.6)", category: "Événement", start: "2026-09-17", end: "2026-09-30", image: "/assets/worldview/worldview-7.webp", description: "Cumule du temps de jeu en coopération pour réclamer les récompenses de l'événement (fin le 30 septembre à 05:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "immersive-theatre-ensemble-v16", title: "Immersive Theatre : Ensemble Act (1.6)", category: "Événement", start: "2026-09-17", end: "2026-10-18", image: "/assets/worldview/worldview-1-4-5.webp", description: "Co-op du théâtre immersif : abats les boss en équipe. Jusqu'à 3 salles gratuites par semaine avec multiplicateur de récompenses fixe, remise à zéro le vendredi (fin le 18 octobre à 17:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "starry-gleanings-v16", title: "Starry Gleanings – commissions (1.6)", category: "Événement", start: "2026-09-24", end: "2026-10-12", image: "/assets/worldview/worldview-4.webp", description: "Accomplis des commissions pendant l'événement pour ouvrir les cadeaux (fin le 12 octobre à 05:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "sanguine-plume", title: "Sanguine Plume – arme de calamité", category: "Arme", start: "2026-09-29", end: "2026-10-19", href: "/items/weapons/weapons-20298", image: "/assets/worldview/worldview-1-3-6.webp", description: "Rotation « Blueprint : Sanguine Plume » du théâtre immersif. Dès le 29 septembre à 10:00 UTC+8, le Blueprint et le Prototype de ces doubles pistolets de calamité entrent définitivement au Memento.", sourceUrl: SRC_V16 },
  { id: "capriccio-of-whimsy", title: "Capriccio of Whimsy – skins Berenica & Psyche", category: "Bannière", start: "2026-09-29", end: "2026-11-09", image: "/assets/worldview/worldview-8.webp", description: "Nouveaux skins pour Berenica et Psyche : « la danseuse tourne sans fin, et le bal ne s'éteint jamais » (fin le 9 novembre à 17:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "bountiful-day-v16-p2", title: "Bountiful Day – Partie 2 (1.6)", category: "Événement", start: "2026-10-01", end: "2026-10-08", image: "/assets/worldview/worldview-1-4-3.webp", description: "Deuxième fenêtre de bonus de Demon Wedges sur les commissions du Manuel du Noctoyager (fin le 8 octobre à 05:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "treasured-remnants", title: "Treasured Remnants", category: "Événement", start: "2026-10-01", end: "2026-10-13", image: "/assets/worldview/worldview-1-4-2.webp", description: "De vieux objets patinés par le temps, qui ne retrouvent leur éclat qu'entre les mains de ceux qui en ont besoin (fin le 13 octobre à 05:00 UTC+8).", sourceUrl: SRC_V16 },
  { id: "phoxhunter-summit-v16", title: "Phoxhunter Summit (1.6)", category: "Épreuve", start: "2026-10-07", end: "2026-10-16", image: "/assets/worldview/worldview-1.webp", description: "Épreuve compétitive de fin de version. Les contres élémentaires ont été retirés pour cette édition (clôture le 17 octobre à 00:00 UTC+8).", sourceUrl: SRC_V16 },
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
