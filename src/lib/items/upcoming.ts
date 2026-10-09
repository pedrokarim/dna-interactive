import { GAME_VERSION } from "@/lib/constants";

/**
 * Au-delà de ce seuil, `ReleaseVersion` n'est plus une version mais la
 * sentinelle du jeu pour « non programmé » (`990`, `9990`, `999990`).
 */
const UNSCHEDULED_RELEASE_THRESHOLD = 900;

/** `"1.6"` → `160`, l'échelle de `ReleaseVersion` dans les tables du jeu. */
function toReleaseScale(version: string): number {
  const [major, minor = "0"] = version.split(".");
  return Number(major) * 100 + Number(minor) * 10;
}

/**
 * La version à laquelle un objet est attendu, quand elle est postérieure à
 * celle que couvre le site : `170` → `"1.7"`. Rend `null` pour un objet déjà
 * sorti, sans version, ou non programmé.
 *
 * Ces objets sont déjà décrits dans les données mais personne ne peut encore
 * les obtenir : on les montre, étiquetés, plutôt que de les cacher.
 */
export function getUpcomingVersion(releaseVersion: number | null | undefined): string | null {
  if (releaseVersion == null || releaseVersion >= UNSCHEDULED_RELEASE_THRESHOLD) return null;
  if (releaseVersion <= toReleaseScale(GAME_VERSION)) return null;
  return `${Math.floor(releaseVersion / 100)}.${Math.floor((releaseVersion % 100) / 10)}`;
}
