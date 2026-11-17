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

  // Pas admin (ou pas connecté) : 404, on ne dit même pas que l'admin existe.
  // Le tri se fait côté serveur, aucun HTML d'admin ne part chez un
  // non-admin. Les routes /api/admin/* répondent 401/403 de leur côté.
  if (!user || user.role !== "admin") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-admin-canvas text-parch">
      <AdminDashboardClient currentUser={{ name: user.name, image: user.image }} />
    </main>
  );
}
