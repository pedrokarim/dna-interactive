import { computeRotationMeta } from "./meta";
import { emptyRegions, getLatestRotation } from "./repository";
import { type RotationMeta, type RotationState } from "./types";

/** État vide (structure complète, objectifs vides) — avant toute donnée en base. */
function emptyState(): RotationState {
  return { contentHash: "", updatedAt: "", regions: emptyRegions() };
}

/**
 * État à afficher : dernière rotation en base, **seulement si elle couvre
 * l'heure en cours**. Une rotation d'une autre heure est fausse : ses objectifs
 * sont retirés (`regions` vides), et `meta.freshness` dit pourquoi
 * (`syncing`, `stale`). `updatedAt` reste renseigné pour afficher depuis quand
 * la collecte n'a rien rapporté.
 *
 * Base vide ou injoignable : structure vide, `freshness: "none"`.
 */
export async function getRotationForDisplay(now: Date = new Date()): Promise<{
  state: RotationState;
  meta: RotationMeta;
  hasData: boolean;
}> {
  try {
    const latest = await getLatestRotation();
    if (latest) {
      const meta = computeRotationMeta(latest.updatedAt, now);
      if (meta.freshness === "live") return { state: latest, meta, hasData: true };
      return { state: { ...latest, regions: emptyRegions() }, meta, hasData: false };
    }
  } catch (err) {
    console.error("[commissions] lecture DB impossible:", err);
  }
  return { state: emptyState(), meta: computeRotationMeta(null, now), hasData: false };
}
