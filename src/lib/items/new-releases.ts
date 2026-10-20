import itemsFirstSeen from "@/data/items/first-seen.json";
import modsVersionDates from "@/data/items/mods.version-dates.json";
import type { ItemRecord } from "@/lib/items/types";

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const modsVersionDateMap = modsVersionDates as Record<string, string>;
/** Objets que le jeu ne date pas, relevés par `scripts/items-first-seen.mjs`. */
const firstSeenMap = itemsFirstSeen.items as Record<string, string>;

function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinWindow(date: Date | null, now: Date): boolean {
  if (!date) return false;
  const age = now.getTime() - date.getTime();
  return age >= 0 && age < NEW_WINDOW_MS;
}

/**
 * Date de sortie d'un objet, ou `null` si on ne la connaît pas.
 *
 * Demon Wedges et armes : leur version de sortie (`releaseVersion`), datée par
 * `mods.version-dates.json`. Ressources, poissons et Géniemons : le jeu ne les
 * date pas, on reprend la mise à jour où ils sont apparus sur le site.
 */
export function getItemReleaseDate(item: ItemRecord): Date | null {
  const releaseVersion = item.stats.releaseVersion;
  if (releaseVersion != null) return parseDate(modsVersionDateMap[String(releaseVersion)]);
  return parseDate(firstSeenMap[item.id]);
}

/** L'objet est-il sorti il y a moins de 30 jours ? Même fenêtre que les personnages. */
export function isItemRecent(item: ItemRecord, now: Date = new Date()): boolean {
  return isWithinWindow(getItemReleaseDate(item), now);
}
