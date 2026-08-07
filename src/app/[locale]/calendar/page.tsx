import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { CalendarPageClient } from "@/components/calendar/CalendarPageClient";
import { getCalendarEventsInRange } from "@/lib/events/db";
import { getAppSettings } from "@/lib/settings/db";
import {
  INITIAL_WINDOW_AFTER,
  INITIAL_WINDOW_BEFORE,
  addDaysIso,
  localTodayIso,
} from "@/lib/events/calendar";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("calendarTitle"), description: t("calendarDescription") };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calendarPage" });

  // Date du jour côté serveur : sert au premier rendu (le client la remplace par
  // son horloge locale) et à cadrer la fenêtre d'événements pré-chargée. Un lien
  // partagé (`?date=`) déplace cette fenêtre pour que la frise s'ouvre remplie.
  const { date } = await searchParams;
  const serverToday = localTodayIso();
  const anchor = typeof date === "string" && ISO_DATE.test(date) ? date : serverToday;
  const initialFrom = addDaysIso(anchor, -INITIAL_WINDOW_BEFORE);
  const initialTo = addDaysIso(anchor, INITIAL_WINDOW_AFTER);

  const [events, settings] = await Promise.all([
    getCalendarEventsInRange(initialFrom, initialTo),
    getAppSettings(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-gold">{"// EVENT.CALENDAR"}</p>
        <h1 className="mt-1 font-display text-4xl font-semibold text-parch md:text-5xl">{t("heading")}</h1>
        <span aria-hidden className="mt-2 block h-0.5 w-16 bg-gold" />
        <p className="mt-3 max-w-2xl text-sm text-parch/75">{t("intro")}</p>
      </div>
      <Suspense fallback={null}>
        <CalendarPageClient
          events={events}
          initialFrom={initialFrom}
          initialTo={initialTo}
          serverToday={serverToday}
          overrideToday={settings.calendarToday || undefined}
        />
      </Suspense>
    </div>
  );
}
