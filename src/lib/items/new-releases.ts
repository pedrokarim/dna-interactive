import modsVersionDates from "@/data/items/mods.version-dates.json";

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const modsVersionDateMap = modsVersionDates as Record<string, string>;

export function isModReleaseVersionRecent(
  releaseVersion: number | null | undefined,
  now: Date = new Date(),
): boolean {
  if (releaseVersion == null) return false;
  const dateStr = modsVersionDateMap[String(releaseVersion)];
  if (!dateStr) return false;
  const releaseDate = new Date(dateStr);
  if (Number.isNaN(releaseDate.getTime())) return false;
  return now.getTime() - releaseDate.getTime() < NEW_WINDOW_MS;
}
