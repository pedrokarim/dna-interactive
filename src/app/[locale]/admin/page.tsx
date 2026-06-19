import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin builds communautaires",
  description: "Back-office des builds communautaires DNA Interactive.",
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  // Non-admin (ou non connecté) → 404 : on ne révèle même pas l'existence de
  // l'admin. Aucun HTML d'administration n'est jamais envoyé à un non-admin
  // (gating côté serveur), et les routes /api/admin/* renvoient 401/403.
  if (!user || user.role !== "admin") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#07090d] text-parch">
      <AdminDashboardClient currentUser={{ name: user.name, image: user.image }} />
    </main>
  );
}
