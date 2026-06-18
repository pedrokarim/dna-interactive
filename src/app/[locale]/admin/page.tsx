import type { Metadata } from "next";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { DiscordAuthButton } from "@/components/auth/DiscordAuthButton";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin builds communautaires",
  description: "Back-office des builds communautaires DNA Interactive.",
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07090d] px-4 text-parch">
        <DnaPanel className="w-full max-w-xl p-6">
          <DnaSectionLabel>Administration</DnaSectionLabel>
          <h1 className="mt-2 font-display text-3xl leading-tight text-parch">Acces admin</h1>
          <p className="mt-3 font-sans text-sm leading-relaxed text-muted">
            {!user ? "Connexion admin requise." : "Acces reserve aux administrateurs."}
          </p>
          <div className="mt-5">
            {!user ? <DiscordAuthButton /> : null}
          </div>
        </DnaPanel>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090d] text-parch">
      <AdminDashboardClient currentUser={{ name: user.name, image: user.image }} />
    </main>
  );
}
