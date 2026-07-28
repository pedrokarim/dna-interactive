import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { CalendarPageClient } from "@/components/calendar/CalendarPageClient";
import { getCalendarEvents } from "@/lib/events/db";
import { getAppSettings } from "@/lib/settings/db";

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

export default async function CalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calendarPage" });
  const [events, settings] = await Promise.all([getCalendarEvents(), getAppSettings()]);
  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-gold">{"// EVENT.CALENDAR"}</p>
        <h1 className="mt-1 font-display text-4xl font-semibold text-parch md:text-5xl">{t("heading")}</h1>
        <span aria-hidden className="mt-2 block h-0.5 w-16 bg-gold" />
        <p className="mt-3 max-w-2xl text-sm text-parch/75">{t("intro")}</p>
      </div>
      <Suspense fallback={null}>
        <CalendarPageClient events={events} refToday={settings.calendarToday || undefined} />
      </Suspense>
    </div>
  );
}
