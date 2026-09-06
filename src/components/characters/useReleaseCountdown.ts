"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Compte à rebours partagé jusqu'à la sortie d'un personnage.
 *
 * La date de sortie est un jour de bascule serveur (UTC+8, fuseau du jeu) : on
 * vise 11:00 UTC+8, l'heure habituelle des mises à jour de version, plutôt que
 * minuit local du visiteur – sans quoi le compteur tomberait à zéro plusieurs
 * heures avant l'ouverture réelle.
 *
 * L'horloge est un store externe consommé par `useSyncExternalStore` : une
 * seule minuterie pour toute la page, quel que soit le nombre de compteurs
 * affichés, et aucun `setState` synchrone au montage.
 */
const SERVER_RESET_HOUR_UTC = 3; // 11:00 UTC+8

export function releaseTimestamp(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day, SERVER_RESET_HOUR_UTC, 0, 0);
}

let clockTimer: ReturnType<typeof setInterval> | null = null;
let clockNow = 0;
const clockListeners = new Set<() => void>();

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockTimer === null) {
    clockNow = Date.now();
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      for (const l of clockListeners) l();
    }, 1000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer !== null) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

function getClock(): number {
  return clockNow || Date.now();
}

/** Rendu serveur : l'horloge du visiteur est inconnue, on n'affiche rien. */
function getClockOnServer(): null {
  return null;
}

export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number };

export type ReleaseCountdown = {
  /** `null` tant que l'horloge du client n'a pas pris le relais (SSR). */
  parts: CountdownParts | null;
  released: boolean;
};

export function useReleaseCountdown(releaseDate: string): ReleaseCountdown {
  const target = useMemo(() => releaseTimestamp(releaseDate), [releaseDate]);
  const now = useSyncExternalStore(subscribeClock, getClock, getClockOnServer);

  if (now === null) return { parts: null, released: false };

  const remaining = target - now;
  if (remaining <= 0) return { parts: null, released: true };

  const totalSeconds = Math.floor(remaining / 1000);
  return {
    parts: {
      days: Math.floor(totalSeconds / 86_400),
      hours: Math.floor((totalSeconds % 86_400) / 3_600),
      minutes: Math.floor((totalSeconds % 3_600) / 60),
      seconds: totalSeconds % 60,
    },
    released: false,
  };
}
