import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/community-builds/vote-identity";
import { createAuthToken } from "@/lib/auth/tokens";
import { sendVerificationEmail, toEmailLocale } from "@/lib/email/auth-emails";
import { getSiteUrl } from "@/lib/auth/site";

export const dynamic = "force-dynamic";

// Renvoie le lien de vérification. Réponse 200 systématique (anti-énumération) ;
// n'envoie que pour un compte natif existant, non vérifié, non banni.
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  if (!checkRateLimit(`auth:resend:${ip}`, 5, 60 * 60 * 1000).ok) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessaie plus tard." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const locale = typeof body?.locale === "string" ? body.locale : undefined;
  if (!email) return NextResponse.json({ ok: true });

  const [user] = await getDb()
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      passwordHash: schema.users.passwordHash,
      emailVerified: schema.users.emailVerified,
      banned: schema.users.banned,
    })
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${email}`)
    .limit(1);

  if (user?.email && user.passwordHash && !user.emailVerified && !user.banned) {
    const emailLocale = toEmailLocale(locale);
    const token = await createAuthToken(user.id, "verify_email");
    const verifyUrl = `${getSiteUrl()}/${emailLocale}/verify-email?token=${token}`;
    try {
      await sendVerificationEmail({ to: user.email, name: user.name, locale: emailLocale, verifyUrl, userId: user.id });
    } catch (error) {
      console.error("[resend-verification] envoi échoué:", error);
    }
  }

  return NextResponse.json({ ok: true });
}
