import { computeRotationMeta } from "./meta";
import { emptyRegions, getLatestRotation, getRotationMeta } from "./repository";
import { type RotationMeta, type RotationState } from "./types";

/** État vide (structure complète, objectifs vides) — avant toute donnée en base. */
function emptyState(): RotationState {
  return { contentHash: "", updatedAt: "", regions: emptyRegions() };
}

/**
 * État à afficher : dernière rotation en base. Si la base est vide ou
 * injoignable, on renvoie une structure vide (`hasData: false`) pour que la
 * page rende quand même la grille + le compte à rebours.
 */
export async function getRotationForDisplay(): Promise<{
  state: RotationState;
  meta: RotationMeta;
  hasData: boolean;
}> {
  try {
    const latest = await getLatestRotation();
    if (latest) return { state: latest, meta: getRotationMeta(latest), hasData: true };
  } catch (err) {
    console.error("[commissions] lecture DB impossible:", err);
  }
  return { state: emptyState(), meta: computeRotationMeta(null), hasData: false };
}
