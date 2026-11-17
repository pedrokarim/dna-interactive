/** Types partagés du changelog. Aucun accès base ici : le client les importe aussi. */

export const CHANGELOG_TYPES = ["feature", "update", "fix", "enhancement", "security"] as const;
export type ChangelogType = (typeof CHANGELOG_TYPES)[number];

/** Une entrée telle que la page publique la consomme, déjà résolue dans une langue. */
export type ChangelogPublicEntry = {
  version: string;
  /** ISO `AAAA-MM-JJ`. */
  date: string;
  type: ChangelogType;
  title: string;
  description: string;
  items: string[];
  /** Langue vraiment servie, pour signaler un repli. */
  locale: string;
};

export type ChangelogPage = {
  entries: ChangelogPublicEntry[];
  /** À renvoyer tel quel pour avoir la suite, `null` au bout. */
  nextCursor: string | null;
  /**
   * Vrai si la table n'existe pas encore : la page prend alors la liste écrite
   * en dur plutôt qu'afficher un journal vide.
   */
  migrationPending: boolean;
};

/** Entrée de l'index des versions, pour le saut rapide. */
export type ChangelogVersionRef = {
  version: string;
  date: string;
  type: ChangelogType;
};

/** Nombre d'entrées chargées par palier de défilement. */
export const CHANGELOG_PAGE_SIZE = 6;

/**
 * Curseur de pagination : `date|version`.
 *
 * Les deux clés de tri, parce que plusieurs versions peuvent tomber le même
 * jour (trois le 24 décembre 2025) : avec la date seule, on en sauterait deux.
 */
export function encodeCursor(entry: { date: string; version: string }): string {
  return `${entry.date}|${entry.version}`;
}

export function decodeCursor(raw: string | null | undefined): { date: string; version: string } | null {
  if (!raw) return null;
  const [date, version] = raw.split("|");
  if (!date || !version) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!isValidVersion(version)) return null;
  return { date, version };
}

/**
 * Format de version accepté : des nombres séparés par des points.
 *
 * Le tri compare les versions en nombres (`string_to_array(version, '.')::int[]`)
 * pour que « 1.10.0 » passe après « 1.9.0 ». Un suffixe en lettres ferait
 * échouer la conversion.
 */
export function isValidVersion(value: string): boolean {
  return /^\d+(\.\d+){0,3}$/.test(value);
}
