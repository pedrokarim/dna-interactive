import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NotificationsPageClient } from "@/components/notifications/NotificationsPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notificationsPage" });
  return {
    title: t("heading"),
    description: t("intro"),
    // Un fil personnel n'a rien à faire dans un index de moteur de recherche.
    robots: { index: false, follow: false },
  };
}

export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notificationsPage" });

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-gold">{"// SIGNAL.FEED"}</p>
        <h1 className="mt-1 font-display text-4xl font-semibold text-parch md:text-5xl">{t("heading")}</h1>
        <span aria-hidden className="mt-2 block h-0.5 w-16 bg-gold" />
        <p className="mt-3 max-w-2xl text-sm text-parch/75">{t("intro")}</p>
      </div>
      <NotificationsPageClient />
    </div>
  );
}
