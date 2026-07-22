import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarPageClient } from "@/components/calendar/CalendarPageClient";
import { getCalendarEvents } from "@/lib/events/db";
import { getAppSettings } from "@/lib/settings/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendrier des événements — DNA Interactive",
  description:
    "Calendrier interactif des bannières, armes et événements en cours de Duet Night Abyss : navigue dans le temps, zoome et filtre par catégorie.",
};

export default async function CalendarPage() {
  const [events, settings] = await Promise.all([getCalendarEvents(), getAppSettings()]);
  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-gold">{"// EVENT.CALENDAR"}</p>
        <h1 className="mt-1 font-display text-4xl font-semibold text-parch md:text-5xl">Calendrier des événements</h1>
        <span aria-hidden className="mt-2 block h-0.5 w-16 bg-gold" />
        <p className="mt-3 max-w-2xl text-sm text-parch/75">
          Bannières, armes et événements en cours de Duet Night Abyss. Navigue dans le temps, zoome et filtre par
          catégorie — l'état est dans l'URL, donc partageable.
        </p>
      </div>
      <Suspense fallback={null}>
        <CalendarPageClient events={events} refToday={settings.calendarToday || undefined} />
      </Suspense>
    </div>
  );
}
