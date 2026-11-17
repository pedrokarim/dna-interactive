import { toIntlLocale } from "@/lib/intl-locale";
import { getRotationForDisplay } from "./service";
import {
  CATEGORIES,
  REGIONS,
  REGION_LABELS,
  categoryLabel,
  isKnownObjective,
  objectiveArt,
  objectiveLabel,
} from "./types";

/** La rotation en cours, prête pour un aperçu (image OG, bloc Discord). */
export type CommissionsPreview = {
  /** Heure de début de la rotation, en UTC, au format de la langue (« 19:00 »). */
  hour: string;
  /** Empreinte courte de la rotation, sert de version à l'image pour casser les caches. */
  version: string;
  /** Secondes avant la prochaine rotation (heure pleine UTC). */
  secondsLeft: number;
  categories: string[];
  rows: Array<{ region: string; cells: Array<Array<{ label: string; art: string | null }>> }>;
};

/**
 * `null` si la rotation n'est pas à jour, pour ne pas montrer un aperçu périmé.
 * Même filtre que le tableau de la page : le bot écrit parfois un texte qui
 * n'est pas un objectif (« Token missing »).
 */
export async function getCommissionsPreview(locale: string): Promise<CommissionsPreview | null> {
  const { state, meta, hasData } = await getRotationForDisplay();
  if (!hasData || meta.freshness !== "live" || !meta.updatedAt) return null;

  const rows = REGIONS.map((region) => ({
    region: REGION_LABELS[region],
    cells: CATEGORIES.map((category) =>
      (state.regions[region]?.[category] ?? []).filter(isKnownObjective).map((objective) => ({
        label: objectiveLabel(objective, locale),
        art: objectiveArt(objective),
      })),
    ),
  })).filter((row) => row.cells.some((cell) => cell.length > 0));
  if (rows.length === 0) return null;

  const hour = new Intl.DateTimeFormat(toIntlLocale(locale), { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(
    new Date(meta.updatedAt),
  );
  return {
    hour,
    version: state.contentHash.slice(0, 10),
    secondsLeft: Math.max(60, Math.round((Date.parse(meta.nextRefreshAt) - Date.now()) / 1000)),
    categories: CATEGORIES.map((category) => categoryLabel(category, locale)),
    rows,
  };
}
