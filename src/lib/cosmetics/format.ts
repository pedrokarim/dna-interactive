import { useMemo, useSyncExternalStore } from "react";
import { toIntlLocale } from "@/lib/intl-locale";

/**
 * Affichage des cosmétiques, utilisable côté client : aucun import de données
 * ici, les JSON restent côté serveur.
 */

// Défini dans un module neutre pour qu'un composant serveur puisse l'importer.
// Réexporté ici pour les imports qui pointent déjà sur ce fichier.
export { toIntlLocale };

export function formatDate(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium" }).format(new Date(iso));
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(toIntlLocale(locale)).format(value);
}

/*
 * Horloge partagée, comme `useReleaseCountdown` : un store externe lu par
 * `useSyncExternalStore`, une seule minuterie pour la page, pas de `setState`
 * au montage. Côté serveur on ne connaît pas l'heure du visiteur, donc on rend
 * sans statut (un « en cours » calculé au build resterait figé).
 */
let clockTimer: ReturnType<typeof setInterval> | null = null;
let clockNow = 0;
const clockListeners = new Set<() => void>();

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockTimer === null) {
    clockNow = Date.now();
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      for (const notify of clockListeners) notify();
    }, 30_000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer !== null) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

const getClock = () => clockNow || Date.now();
const getClockOnServer = (): null => null;

/** Heure du visiteur (rafraîchie toutes les 30 s), `null` au rendu serveur. */
export function useNow(): Date | null {
  const now = useSyncExternalStore(subscribeClock, getClock, getClockOnServer);
  return useMemo(() => (now === null ? null : new Date(now)), [now]);
}

export type BannerStatus = "current" | "upcoming" | "ended" | "permanent";

export function bannerStatus(start: string | null, end: string | null, now: Date): BannerStatus {
  if (!start && !end) return "permanent";
  if (start && now < new Date(start)) return "upcoming";
  if (end && now >= new Date(end)) return "ended";
  return "current";
}

/** Durée restante lisible (« 19 j 23 h », « 5 h 12 min »), via `Intl` quand possible. */
export function formatRemaining(target: string, now: Date, locale: string): string {
  const ms = Math.max(0, new Date(target).getTime() - now.getTime());
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const intlLocale = toIntlLocale(locale);
  // En japonais, coréen et chinois, « narrow » donne « 19d » : on y prend le format court (« 19日 »).
  const unitDisplay = ["ja", "ko", "zh-Hant"].includes(intlLocale) ? "short" : "narrow";
  const unit = (value: number, name: "day" | "hour" | "minute") =>
    new Intl.NumberFormat(intlLocale, { style: "unit", unit: name, unitDisplay }).format(value);
  if (days > 0) return `${unit(days, "day")} ${unit(hours, "hour")}`;
  if (hours > 0) return `${unit(hours, "hour")} ${unit(minutes, "minute")}`;
  return unit(minutes, "minute");
}
