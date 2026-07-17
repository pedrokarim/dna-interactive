import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/community-builds/vote-identity";
import { createAuthToken } from "@/lib/auth/tokens";
import { requestResetSchema } from "@/lib/auth/credentials-validation";
import { sendPasswordResetEmail, toEmailLocale } from "@/lib/email/auth-emails";
import { getSiteUrl } from "@/lib/auth/site";

export const dynamic = "force-dynamic";

// Réponse 200 systématique (pas d'énumération d'emails). Un lien n'est envoyé
// que si un compte existe pour cet email.
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const rate = await checkRateLimit(`auth:reset-request:${ip}`, 5, 60 * 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie plus tard." },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const parsed = requestResetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  const { email, locale } = parsed.data;

  const [user] = await getDb()
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${email}`)
    .limit(1);

  if (user?.email) {
    const emailLocale = toEmailLocale(locale);
    const token = await createAuthToken(user.id, "reset_password");
    const resetUrl = `${getSiteUrl()}/${emailLocale}/reset-password?token=${token}`;
    await sendPasswordResetEmail({ to: user.email, name: user.name, locale: emailLocale, resetUrl, userId: user.id });
  }

  return NextResponse.json({ ok: true });
}
