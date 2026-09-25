/**
 * Badges « Nouveau » / « Bêta » du site — LE fichier à éditer.
 *
 * Une entrée par fonctionnalité. La même clé pilote la pastille de la barre
 * latérale ET le badge de la carte correspondante sur l'accueil (bento) : on
 * ne déclare un badge qu'ici, jamais dans les composants.
 *
 * - `badge` : "new" (Nouveau) ou "beta" (Bêta).
 * - `until` : dernier jour d'affichage, inclus (AAAA-MM-JJ). Passé cette date,
 *   le badge disparaît tout seul, sans redéploiement de code à faire.
 *   Sans `until`, le badge reste jusqu'à ce qu'on retire la ligne.
 * - `monthsAfter("2026-09-25", 3)` pour écrire « 3 mois après la sortie ».
 *
 * Pour retirer un badge : supprimer la ligne (ou la commenter).
 * Pour prolonger : repousser `until`.
 */

export type FeatureBadge = "new" | "beta";

export type FeatureBadgeRule = { badge: FeatureBadge; until?: string };

/**
 * Fonctionnalités qui peuvent porter un badge. Les clés de la barre latérale
 * sont celles de `SHELL_NAV_PRIMARY` (`src/lib/shell.ts`) ; `weapons`,
 * `genimons` et `drafts` n'existent que comme cartes de l'accueil.
 */
export type FeatureKey =
  | "map"
  | "calendar"
  | "characters"
  | "items"
  | "weapons"
  | "genimons"
  | "drafts"
  | "builder"
  | "builds"
  | "commissions";

/** Date ISO située `months` mois après `from` (même jour du mois). */
export function monthsAfter(from: string, months: number): string {
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

export const FEATURE_BADGES: Partial<Record<FeatureKey, FeatureBadgeRule>> = {
  // Refonte de la carte interactive (façon carte HoYoLAB), sortie le 25/09/2026.
  map: { badge: "new", until: monthsAfter("2026-09-25", 1) },

  // Builder de builds.
  builder: { badge: "new", until: monthsAfter("2026-09-25", 6) },

  // Builds de la communauté.
  builds: { badge: "new", until: monthsAfter("2026-09-25", 2) },

  // Arsenal (armes, dont les armes de calamité) — carte de l'accueil.
  weapons: { badge: "new", until: monthsAfter("2026-09-25", 2) },

  // Commissions : fonction encore en rodage.
  commissions: { badge: "beta", until: "2026-12-31" },

  // Sans badge pour l'instant — décommenter pour en afficher un :
  // calendar: { badge: "new", until: monthsAfter("2026-09-25", 2) },
  // characters: { badge: "new", until: monthsAfter("2026-09-25", 2) },
  // items: { badge: "new", until: monthsAfter("2026-09-25", 2) },
};

/**
 * Badges encore valides à la date donnée. À appeler CÔTÉ SERVEUR, puis passer
 * le résultat en prop : comparer des dates pendant le rendu client ferait
 * diverger serveur et client à l'hydratation autour de minuit.
 */
export function resolveFeatureBadges(now: Date): Partial<Record<FeatureKey, FeatureBadge>> {
  const out: Partial<Record<FeatureKey, FeatureBadge>> = {};
  for (const [key, rule] of Object.entries(FEATURE_BADGES) as [FeatureKey, FeatureBadgeRule][]) {
    if (rule.until && now > new Date(`${rule.until}T23:59:59Z`)) continue;
    out[key] = rule.badge;
  }
  return out;
}
