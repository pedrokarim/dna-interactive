import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getApiTranslator } from "@/lib/api-locale";

export const dynamic = "force-dynamic";

/**
 * Suppression du compte connecté (droit à l'effacement RGPD). Les FK en
 * onDelete: cascade emportent avec la ligne `users` ses builds, brouillons, votes,
 * signalements, sessions et comptes OAuth.
 */
export async function DELETE(request: Request) {
  const t = await getApiTranslator(request);
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: t("signInRequired") }, { status: 401 });

  await getDb().delete(schema.users).where(eq(schema.users.id, user.id));

  return NextResponse.json({ ok: true });
}
