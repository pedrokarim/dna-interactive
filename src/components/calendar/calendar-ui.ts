"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toIntlLocale } from "@/lib/intl-locale";
import {
  CATEGORY_TINT,
  diffDays,
  localTodayIso,
  type CalendarEvent,
  type EventCategory,
} from "@/lib/events/calendar";

/** Clé de traduction du nom d'une catégorie (singulier, espace `homeHub`). */
export const CATEGORY_KEY: Record<
  EventCategory,
  "categoryBanner" | "categoryWeapon" | "categoryEvent" | "categoryTrial" | "categoryReward"
> = {
  Bannière: "categoryBanner",
  Arme: "categoryWeapon",
  Événement: "categoryEvent",
  Épreuve: "categoryTrial",
  Récompense: "categoryReward",
};

/** Clé de la catégorie dans l'espace `calendarUi` (pluriel, « … précédentes »). */
export const CATEGORY_SLUG: Record<EventCategory, "banner" | "weapon" | "event" | "trial" | "reward"> = {
  Bannière: "banner",
  Arme: "weapon",
  Événement: "event",
  Épreuve: "trial",
  Récompense: "reward",
};

export const categoryTint = (category: EventCategory) => CATEGORY_TINT[category];

/** Part de la journée locale déjà écoulée (0 à minuit, 0,5 à midi). */
function dayFractionOf(now: Date): number {
  return (now.getHours() * 60 + now.getMinutes()) / 1440;
}

/**
 * Date du jour du visiteur et heure dans la journée. Resynchronisées chaque
 * minute (pour passer minuit sans recharger) et quand la page revient au
 * premier plan.
 *
 * Le premier rendu prend la date du serveur et midi, comme le HTML envoyé, pour
 * ne pas casser l'hydratation. L'effet corrige ensuite avec le fuseau du
 * navigateur.
 */
export function useToday(serverToday: string, override?: string): { today: string; dayFraction: number } {
  const [clock, setClock] = useState({ today: override || serverToday, dayFraction: 0.5 });

  useEffect(() => {
    if (override) return;
    const sync = () => {
      const now = new Date();
      setClock({ today: localTodayIso(now), dayFraction: dayFractionOf(now) });
    };
    sync();
    const timer = window.setInterval(sync, 60_000);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, [override]);

  return clock;
}

/** Statut d'un événement par rapport à `today` (jours inclus). */
export function statusOf(ev: Pick<CalendarEvent, "start" | "end">, today: string): "past" | "ongoing" | "upcoming" {
  if (today < ev.start) return "upcoming";
  if (today > ev.end) return "past";
  return "ongoing";
}

/** Avancement 0-1 d'un événement en cours, à l'heure près. */
export function progressOf(ev: Pick<CalendarEvent, "start" | "end">, today: string, dayFraction: number): number {
  const length = diffDays(ev.start, ev.end) + 1;
  return Math.min(1, Math.max(0, (diffDays(ev.start, today) + dayFraction) / length));
}

export const lengthOf = (ev: Pick<CalendarEvent, "start" | "end">) => diffDays(ev.start, ev.end) + 1;

/** Espace insécable entre le jour et le mois : « 19 nov. » ne se coupe jamais. */
const glue = (s: string) => s.replace(/ /g, " ");

/** Formats de date du calendrier, dans la langue de la page. Dates ISO lues en UTC. */
export function useCalendarFormat() {
  const locale = useLocale();
  const t = useTranslations("calendarUi");

  const fmt = useMemo(() => {
    const intl = toIntlLocale(locale);
    const make = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(intl, { ...options, timeZone: "UTC" });
    return {
      short: make({ day: "numeric", month: "short" }),
      withWeekday: make({ weekday: "short", day: "numeric", month: "short" }),
      monthYear: make({ month: "long", year: "numeric" }),
      dayNumber: make({ day: "numeric" }),
    };
  }, [locale]);

  const date = useCallback((iso: string) => new Date(`${iso}T00:00:00Z`), []);
  const short = useCallback((iso: string) => glue(fmt.short.format(date(iso))), [fmt, date]);
  const range = useCallback((start: string, end: string) => `${short(start)} – ${short(end)}`, [short]);

  /** Statut en toutes lettres : « Commence demain », « En cours, encore 13 jours »… */
  const statusText = useCallback(
    (ev: Pick<CalendarEvent, "start" | "end">, today: string) => {
      const status = statusOf(ev, today);
      if (status === "past") return t("status.endedOn", { date: short(ev.end) });
      if (status === "upcoming") return t("status.startsIn", { days: diffDays(today, ev.start) });
      const left = diffDays(today, ev.end);
      if (left === 0) return t("status.lastDay");
      if (ev.start === today && left > 1) return t("status.startsToday");
      return t("status.endsIn", { days: left });
    },
    [t, short],
  );

  return { fmt, date, short, range, statusText };
}

/** Classe de couleur du statut (texte). */
export const STATUS_TONE = {
  ongoing: "text-anemo",
  upcoming: "text-hydro",
  past: "text-muted",
} as const;
