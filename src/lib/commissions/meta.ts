import type { RotationFreshness, RotationMeta } from "./types";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Délai laissé à la collecte après le changement d'heure. Le bot réécrit son
 * message vers HH:00:25 et le collecteur passe à HH:01, HH:06, HH:11 : au-delà
 * de 12 minutes sans nouvelle rotation, la collecte est considérée en panne.
 */
export const SYNC_GRACE_MS = 12 * 60 * 1000;

/** Prochaine heure pleine UTC strictement après `from`. */
export function nextUtcHour(from: Date): Date {
  const next = new Date(from);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);
  return next;
}

/**
 * Fin de validité d'une rotation : la fin de l'heure UTC où elle a été publiée.
 * Le bot horodate son message quelques secondes après l'heure pleine, donc
 * l'heure de `updatedAt` est celle de la rotation.
 */
export function rotationValidUntil(updatedAt: string): string {
  return nextUtcHour(new Date(updatedAt)).toISOString();
}

/**
 * État de la rotation en base par rapport à l'instant présent.
 *
 * - `live` : elle couvre l'heure en cours, on peut l'afficher ;
 * - `syncing` : l'heure a changé, la nouvelle rotation n'est pas encore arrivée ;
 * - `stale` : rien depuis plus de `SYNC_GRACE_MS`, la collecte est en panne ;
 * - `none` : aucune rotation en base.
 *
 * Seul `live` autorise l'affichage des objectifs : une rotation d'une autre
 * heure est fausse, quelle que soit son ancienneté.
 */
export function rotationFreshness(updatedAt: string | null, now: Date = new Date()): RotationFreshness {
  if (!updatedAt) return "none";
  const validUntil = Date.parse(rotationValidUntil(updatedAt));
  if (Number.isNaN(validUntil)) return "none";
  const nowMs = now.getTime();
  if (nowMs < validUntil) return "live";
  if (nowMs < validUntil + SYNC_GRACE_MS) return "syncing";
  return "stale";
}

/**
 * Cadence pour le countdown. La rotation change au top de chaque heure UTC,
 * donc la prochaine MAJ est déterministe : prochaine heure pleine.
 */
export function computeRotationMeta(updatedAt: string | null, now: Date = new Date()): RotationMeta {
  return {
    updatedAt,
    nextRefreshAt: nextUtcHour(now).toISOString(),
    periodMs: HOUR_MS,
    freshness: rotationFreshness(updatedAt, now),
  };
}
