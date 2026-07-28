import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getApiTranslator } from "@/lib/api-locale";

export const dynamic = "force-dynamic";

const PROVIDERS = ["discord", "google"] as const;
type Provider = (typeof PROVIDERS)[number];

// Délie un provider OAuth du compte connecté. Garde-fou : refuse si cela
// laisserait le compte sans aucun moyen de connexion (aucun autre provider ET
// pas de mot de passe défini).
export async function DELETE(request: Request) {
  const t = await getApiTranslator(request);
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: t("signInRequired") }, { status: 401 });

  const body = await request.json().catch(() => null);
  const provider = body?.provider as Provider | undefined;
  if (!provider || !PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: t("invalidProvider") }, { status: 400 });
  }

  const db = getDb();
  const [accounts, [pwRow]] = await Promise.all([
    db.select({ provider: schema.accounts.provider }).from(schema.accounts).where(eq(schema.accounts.userId, user.id)),
    db.select({ passwordHash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1),
  ]);

  const linked = accounts.map((a) => a.provider);
  if (!linked.includes(provider)) {
    return NextResponse.json({ error: t("accountNotLinked") }, { status: 400 });
  }

  // Méthodes de connexion restantes après déliaison.
  const remaining = linked.filter((p) => p !== provider).length + (pwRow?.passwordHash ? 1 : 0);
  if (remaining < 1) {
    return NextResponse.json(
      { error: t("cannotUnlink") },
      { status: 409 },
    );
  }

  await db.delete(schema.accounts).where(and(eq(schema.accounts.userId, user.id), eq(schema.accounts.provider, provider)));

  // Discord alimente users.discordId (détection admin) : on le remet à null.
  if (provider === "discord") {
    await db.update(schema.users).set({ discordId: null, updatedAt: new Date() }).where(eq(schema.users.id, user.id));
  }

  return NextResponse.json({ ok: true });
}
