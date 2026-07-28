import releaseDates from "@/data/characters/release-dates.json";

/**
 * Fenêtre pendant laquelle un personnage est considéré comme « nouveau ».
 * Alignée sur celle des items (`src/lib/items/new-releases.ts`) pour que le
 * badge veuille dire la même chose partout sur le site.
 */
const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const releaseDateMap = releaseDates as Record<string, string>;

/**
 * Date de sortie d'un personnage, ou `null` si on ne la connaît pas.
 *
 * La source est une liste curée : `Char.lua` ne porte aucune information de
 * date ni de version. Un personnage absent de la liste n'est donc jamais
 * « nouveau » — on préfère ne rien afficher plutôt que de deviner.
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
 * gardent leur ordre existant (`sortPriority`).
 *
 * Renvoie un nombre négatif d'autant plus petit que la sortie est récente, ce
 * qui permet de l'utiliser directement devant le tri habituel.
 */
export function newCharacterRank(charId: number | null | undefined, now: Date = new Date()): number {
  if (!isCharacterRecent(charId, now)) return 0;
  const date = getCharacterReleaseDate(charId);
  // -1 pour la plus récente, valeurs croissantes ensuite : on trie sur
  // l'ancienneté en jours pour départager deux nouveautés.
  const ageDays = date ? (now.getTime() - date.getTime()) / 86_400_000 : 0;
  return -1_000_000 + Math.round(ageDays);
}
