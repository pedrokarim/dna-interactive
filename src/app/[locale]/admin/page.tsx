import type { Metadata } from "next";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { DiscordAuthButton } from "@/components/auth/DiscordAuthButton";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin builds communautaires",
  description: "Back-office des builds communautaires DNA Interactive.",
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-ink text-parch">
      <SiteHeader />
      <section className="container mx-auto px-4 py-6 md:px-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <DnaSectionLabel>Administration</DnaSectionLabel>
            <h1 className="mt-2 font-display text-3xl leading-tight text-parch md:text-4xl">Builds communautaires</h1>
          </div>
          <DiscordAuthButton />
        </div>

        {!user ? (
          <DnaPanel className="p-5 text-sm text-muted">Connexion admin requise.</DnaPanel>
        ) : user.role !== "admin" ? (
          <DnaPanel className="p-5 text-sm text-muted">Accès réservé aux administrateurs.</DnaPanel>
        ) : (
          <AdminDashboardClient />
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
