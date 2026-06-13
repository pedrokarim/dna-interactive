import type { RotationMeta } from "./types";

const HOUR_MS = 60 * 60 * 1000;

/** Prochaine heure pleine UTC strictement après `from`. */
export function nextUtcHour(from: Date): Date {
  const next = new Date(from);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);
  return next;
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
  };
}
