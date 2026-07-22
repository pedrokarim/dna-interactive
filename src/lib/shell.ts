import { CONTACT_INFO, NAVIGATION } from "@/lib/constants";

/**
 * Configuration de la coquille applicative (`AppShell`) : navigation de la
 * barre latérale, fils d'Ariane et routes servies sans coquille.
 *
 * Module volontairement sans composant ni hook : il est importé aussi bien par
 * le layout serveur (résolution des pastilles, du fil d'Ariane) que par la
 * barre latérale côté client. Les icônes vivent dans `AppShell`, associées par
 * `key`, pour que ce fichier reste sérialisable.
 */

export type ShellBadge = "new" | "beta";

export type ShellNavEntry = {
  /** Clé de traduction dans le namespace `nav`. */
  key: string;
  href: string;
  /** Pastille affichée à droite du libellé, tant que `badgeUntil` n'est pas passé. */
  badge?: ShellBadge;
  /** Date ISO (incluse) après laquelle la pastille disparaît d'elle-même. */
  badgeUntil?: string;
  external?: boolean;
};

/** Sections applicatives — le cœur du hub. */
export const SHELL_NAV_PRIMARY: ShellNavEntry[] = [
  { key: "home", href: NAVIGATION.home },
  { key: "map", href: NAVIGATION.map },
  { key: "calendar", href: NAVIGATION.calendar },
  { key: "characters", href: NAVIGATION.characters },
  { key: "items", href: NAVIGATION.items },
  { key: "builder", href: NAVIGATION.builder, badge: "new", badgeUntil: "2026-10-01" },
  { key: "builds", href: NAVIGATION.builds },
  { key: "commissions", href: NAVIGATION.commissions, badge: "beta", badgeUntil: "2026-12-31" },
  { key: "codes", href: NAVIGATION.codes },
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
 * Pastilles encore valides à la date donnée. Résolu côté serveur puis passé en
 * prop à la coquille : la comparaison de dates ne doit pas se faire pendant le
 * rendu client, sinon serveur et client peuvent diverger à l'hydratation.
 */
export function resolveShellBadges(now: Date): Record<string, ShellBadge> {
  const badges: Record<string, ShellBadge> = {};
  for (const entry of [...SHELL_NAV_PRIMARY, ...SHELL_NAV_SECONDARY, ...SHELL_NAV_EXTERNAL]) {
    if (!entry.badge) continue;
    if (entry.badgeUntil && now > new Date(`${entry.badgeUntil}T23:59:59Z`)) continue;
    badges[entry.key] = entry.badge;
  }
  return badges;
}

/* ------------------------------------------------------------ fil d'Ariane */

/** Fil d'Ariane mono de la topbar, par préfixe de route (correspondance la plus longue). */
const SHELL_BREADCRUMBS: Record<string, string> = {
  "/": "//COMMUNITY.HUB",
  "/about": "//ABOUT.PROJECT",
  "/admin/calendar": "//ADMIN.CALENDAR",
  "/builder": "//BUILD.FORGE",
  "/builds": "//SHARED.LOADOUTS",
  "/calendar": "//EVENT.CALENDAR",
  "/changelog": "//PATCH.NOTES",
  "/characters": "//OPERATOR.DATABASE",
  "/codes": "//REDEEM.CODES",
  "/commissions": "//COVERT.OPS.LIVE",
  "/confidentialite": "//PRIVACY.POLICY",
  "/contact": "//CONTACT.CHANNEL",
  "/forgot-password": "//ACCOUNT.RESET",
  "/items": "//GEAR.DATABASE",
  "/login": "//ACCOUNT.LOGIN",
  "/profile": "//ACCOUNT.PROFILE",
  "/reset-password": "//ACCOUNT.RESET",
  "/signup": "//ACCOUNT.SIGNUP",
  "/support": "//SUPPORT.DESK",
  "/verify-email": "//ACCOUNT.VERIFY",
};

const DEFAULT_BREADCRUMB = "//COMMUNITY.HUB";

/** `pathname` sans préfixe de locale → fil d'Ariane de la topbar. */
export function resolveBreadcrumb(pathname: string): string {
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
 * Routes servies **sans** coquille : la carte occupe l'écran entier, l'admin a
 * son propre châssis, et `/features` reste sur la page marketing historique.
 */
const SHELL_EXCLUDED_PREFIXES = ["/map", "/features", "/admin"];

/** Sous-routes qui rattrapent une exclusion ci-dessus. */
const SHELL_INCLUDED_PREFIXES = ["/admin/calendar"];

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
