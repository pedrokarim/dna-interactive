import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Suppression du compte de l'utilisateur connecté (droit RGPD à l'effacement).
 * Supprimer la ligne `users` purge en cascade — via les FK onDelete: cascade —
 * ses builds, brouillons, votes, signalements, sessions et comptes OAuth liés.
 */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  await getDb().delete(schema.users).where(eq(schema.users.id, user.id));

  return NextResponse.json({ ok: true });
}
