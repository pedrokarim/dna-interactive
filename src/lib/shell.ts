import { CONTACT_INFO, NAVIGATION } from "@/lib/constants";
import { resolveFeatureBadges, type FeatureBadge } from "@/config/feature-badges";

/**
 * Config de la coquille (`AppShell`) : navigation de la barre latérale, fils
 * d'Ariane et routes servies sans coquille.
 *
 * Pas de composant ni de hook ici, exprès : le layout serveur (pastilles, fil
 * d'Ariane) et la barre latérale client importent tous deux ce module. Les
 * icônes sont dans `AppShell`, reliées par `key`, pour que ce fichier reste
 * sérialisable.
 */

/** Badges « Nouveau » / « Bêta » : déclarés dans `src/config/feature-badges.ts`, nulle part ailleurs. */
export type ShellBadge = FeatureBadge;

export type ShellNavEntry = {
  /** Clé de traduction dans le namespace `nav`. */
  key: string;
  href: string;
  external?: boolean;
};

/** Sections principales du hub. */
export const SHELL_NAV_PRIMARY: ShellNavEntry[] = [
  { key: "home", href: NAVIGATION.home },
  { key: "map", href: NAVIGATION.map },
  { key: "calendar", href: NAVIGATION.calendar },
  { key: "theatre", href: NAVIGATION.theatre },
  { key: "characters", href: NAVIGATION.characters },
  { key: "items", href: NAVIGATION.items },
  { key: "cosmetics", href: NAVIGATION.cosmetics },
  { key: "builder", href: NAVIGATION.builder },
  { key: "builds", href: NAVIGATION.builds },
  { key: "planner", href: NAVIGATION.planner },
  { key: "commissions", href: NAVIGATION.commissions },
];

/** Pages « à propos du site ». */
export const SHELL_NAV_SECONDARY: ShellNavEntry[] = [
  { key: "features", href: NAVIGATION.features },
  { key: "changelog", href: NAVIGATION.changelog },
  { key: "about", href: NAVIGATION.about },
  { key: "support", href: NAVIGATION.support },
  { key: "contact", href: NAVIGATION.contact },
];

/** Liens sortants (nouvel onglet). */
export const SHELL_NAV_EXTERNAL: ShellNavEntry[] = [
  { key: "discord", href: CONTACT_INFO.discord.url, external: true },
  { key: "twitter", href: CONTACT_INFO.twitter.url, external: true },
];

/**
 * Pastilles encore valides à la date donnée. Calculé côté serveur et passé en
 * prop à la coquille : comparer des dates au rendu client ferait diverger
 * serveur et client à l'hydratation.
 */
export function resolveShellBadges(now: Date): Record<string, ShellBadge> {
  // Les clés de navigation sont les clés de fonctionnalité de feature-badges.
  return resolveFeatureBadges(now) as Record<string, ShellBadge>;
}

/* ------------------------------------------------------------ fil d'Ariane */

/**
 * Fil d'Ariane de la topbar, par préfixe de route (le plus long gagne). Rendu
 * par `DnaSectionMark` : losange + capitales.
 *
 * Le vocabulaire vient des données du jeu (Hall, Sceau, Tome, Chronique,
 * Atlasia…). Il remplace les vieux libellés `//OPERATOR.DATABASE` en monospace,
 * repris d'une maquette pour Arknights Endfield.
 *
 * Les valeurs sont des clés `shell.breadcrumbs.<clé>`, traduites dans les 7
 * langues.
 */
const SHELL_BREADCRUMBS: Record<string, BreadcrumbKey> = {
  "/": "hall",
  "/about": "colophon",
  "/admin/calendar": "almanacStewardship",
  "/admin/theatre": "theaterStewardship",
  "/builder": "forge",
  "/builds": "scores",
  "/calendar": "almanac",
  "/changelog": "register",
  "/characters": "choir",
  "/commissions": "commissions",
  "/confidentialite": "privacy",
  "/contact": "missive",
  "/cosmetics": "wardrobe",
  "/cosmetics/banners": "myriad",
  "/forgot-password": "threshold",
  "/items": "reliquary",
  "/items/drafts": "workHall",
  "/items/genimons": "genimons",
  "/items/weapons": "arsenal",
  "/login": "threshold",
  "/notifications": "chronicle",
  "/planner": "logbook",
  "/profile": "seal",
  "/reset-password": "threshold",
  "/signup": "pact",
  "/support": "patronage",
  "/theatre": "theater",
  "/verify-email": "threshold",
};

/** Clé de message `shell.breadcrumbs.<clé>` d'un repère de section. */
export type BreadcrumbKey =
  | "hall"
  | "colophon"
  | "almanacStewardship"
  | "theaterStewardship"
  | "forge"
  | "scores"
  | "almanac"
  | "register"
  | "choir"
  | "commissions"
  | "privacy"
  | "missive"
  | "wardrobe"
  | "myriad"
  | "threshold"
  | "reliquary"
  | "workHall"
  | "genimons"
  | "arsenal"
  | "chronicle"
  | "seal"
  | "pact"
  | "patronage"
  | "theater"
  | "logbook"
  | "atlas";

const DEFAULT_BREADCRUMB: BreadcrumbKey = "hall";

/** `pathname` sans préfixe de locale → clé du fil d'Ariane de la topbar. */
export function resolveBreadcrumb(pathname: string): BreadcrumbKey {
  let best = DEFAULT_BREADCRUMB;
  let bestLength = -1;
  for (const [prefix, label] of Object.entries(SHELL_BREADCRUMBS)) {
    if (!matchesPrefix(pathname, prefix)) continue;
    if (prefix.length > bestLength) {
      best = label;
      bestLength = prefix.length;
    }
  }
  return best;
}

/* -------------------------------------------------------------- exclusions */

/**
 * Routes servies sans coquille : la carte prend tout l'écran, l'admin a son
 * propre cadre, et `/features` garde l'ancienne page marketing.
 */
const SHELL_EXCLUDED_PREFIXES = ["/map", "/features", "/admin"];

/** Sous-routes qui rattrapent une exclusion ci-dessus. */
const SHELL_INCLUDED_PREFIXES = ["/admin/calendar", "/admin/theatre"];

/** La coquille (barre latérale + topbar + pied de page) s'applique-t-elle ici ? */
export function shellAppliesTo(pathname: string): boolean {
  if (SHELL_INCLUDED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) return true;
  return !SHELL_EXCLUDED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

/** `/items` couvre `/items` et `/items/…`, mais pas `/itemsets`. */
function matchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
