import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/community-builds/vote-identity";
import { hashPassword } from "@/lib/auth/password";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { resetSchema } from "@/lib/auth/credentials-validation";

export const dynamic = "force-dynamic";

// Consomme un token reset_password et pose le nouveau hash. Comme l'utilisateur
// a prouvé le contrôle de son email, on valide aussi l'email par la même
// occasion (débloque le login natif pour les comptes non encore vérifiés).
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const rate = checkRateLimit(`auth:reset:${ip}`, 10, 60 * 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie plus tard." },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const parsed = resetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
  }

  const userId = await consumeAuthToken(parsed.data.token, "reset_password");
  if (!userId) {
    return NextResponse.json({ error: "Lien invalide ou expiré. Redemande une réinitialisation." }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await getDb()
    .update(schema.users)
    .set({ passwordHash, emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.id, userId));

  return NextResponse.json({ ok: true });
}
