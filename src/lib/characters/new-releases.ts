import releaseDates from "@/data/characters/release-dates.json";

/**
 * Durée pendant laquelle un perso est « nouveau ». Même valeur que pour les
 * items (`src/lib/items/new-releases.ts`), pour que le badge veuille dire la
 * même chose partout.
 */
const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const releaseDateMap = releaseDates as Record<string, string>;

/**
 * Date de sortie d'un perso, ou `null` si on ne la connaît pas.
 *
 * Les dates viennent d'une liste tenue à la main, `Char.lua` n'a ni date ni
 * version. Un perso absent de la liste n'est jamais « nouveau » : on ne devine pas.
 */
export function getCharacterReleaseDate(charId: number | null | undefined): Date | null {
  if (charId == null) return null;
  const raw = releaseDateMap[String(charId)];
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Le personnage est-il sorti il y a moins de 30 jours ? */
export function isCharacterRecent(
  charId: number | null | undefined,
  now: Date = new Date(),
): boolean {
  const date = getCharacterReleaseDate(charId);
  if (!date) return false;
  const age = now.getTime() - date.getTime();
  return age >= 0 && age < NEW_WINDOW_MS;
}

/**
 * Clé de tri : les nouveautés d'abord, la plus récente en tête. Les autres
 * gardent leur ordre (`sortPriority`).
 *
 * Nombre négatif d'autant plus petit que la sortie est récente, à placer
 * directement devant le tri habituel.
 */
export function newCharacterRank(charId: number | null | undefined, now: Date = new Date()): number {
  if (!isCharacterRecent(charId, now)) return 0;
  const date = getCharacterReleaseDate(charId);
  // -1 000 000 plus l'âge en jours : deux nouveautés se départagent à
  // l'ancienneté, et restent toutes devant les autres (0).
  const ageDays = date ? (now.getTime() - date.getTime()) / 86_400_000 : 0;
  return -1_000_000 + Math.round(ageDays);
}
