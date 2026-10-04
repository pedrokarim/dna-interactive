import { resolveBreadcrumb } from "@/lib/shell";
import { DnaPageMark } from "@/components/dna/PageMark";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TheatreAdminClient } from "@/components/admin/TheatreAdminClient";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin – Rotations du théâtre",
  robots: { index: false, follow: false },
};

export default async function AdminTheatrePage() {
  const user = await getCurrentUser();
  // Gating serveur : 404 pour les non-admins (on ne révèle pas l'existence).
  if (!user || user.role !== "admin") notFound();

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5">
        <DnaPageMark>{resolveBreadcrumb("/admin/theatre")}</DnaPageMark>
        <h1 className="mt-1 font-display text-3xl font-semibold text-parch md:text-4xl">Théâtre immersif – administration</h1>
        <p className="mt-3 max-w-2xl text-sm text-parch/75">
          Les rotations du théâtre, de la plus récente à la plus ancienne. Ajoute ici la prochaine dès qu’elle est
          annoncée, ou corrige une date.
        </p>
      </div>
      <TheatreAdminClient />
    </div>
  );
}
