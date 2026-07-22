import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarAdminClient } from "@/components/admin/CalendarAdminClient";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Calendrier des événements",
  robots: { index: false, follow: false },
};

export default async function AdminCalendarPage() {
  const user = await getCurrentUser();
  // Gating serveur : 404 pour les non-admins (on ne révèle pas l'existence).
  if (!user || user.role !== "admin") notFound();

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-gold">{"// ADMIN.CALENDAR"}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-parch md:text-4xl">Calendrier — administration</h1>
        <span aria-hidden className="mt-2 block h-0.5 w-16 bg-gold" />
        <p className="mt-3 max-w-2xl text-sm text-parch/75">
          Ajoute, modifie et supprime les événements du calendrier (détails, image, lien, infos).
        </p>
      </div>
      <CalendarAdminClient />
    </div>
  );
}
