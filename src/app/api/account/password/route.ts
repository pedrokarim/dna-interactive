import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAuthToken } from "@/lib/auth/tokens";
import { sendSetPasswordEmail, toEmailLocale } from "@/lib/email/auth-emails";
import { getSiteUrl } from "@/lib/auth/site";
import { getApiTranslator } from "@/lib/api-locale";

export const dynamic = "force-dynamic";

// Demande de définition/changement de mot de passe depuis les paramètres, pour
// un compte connecté (typiquement OAuth-only). Passe TOUJOURS par une
// vérification email (lien reset_password) — jamais de set direct.
export async function POST(request: Request) {
  const t = await getApiTranslator(request);
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: t("signInRequired") }, { status: 401 });

  const rate = await checkRateLimit(`auth:set-password:${user.id}`, 5, 60 * 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: t("tooManyRequests") },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const [row] = await getDb()
    .select({ email: schema.users.email, name: schema.users.name })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .limit(1);

  if (!row?.email) {
    return NextResponse.json(
      { error: t("noEmailOnAccount") },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const emailLocale = toEmailLocale(typeof body?.locale === "string" ? body.locale : undefined);
  const token = await createAuthToken(user.id, "reset_password");
  const setUrl = `${getSiteUrl()}/${emailLocale}/reset-password?token=${token}`;
  await sendSetPasswordEmail({ to: row.email, name: row.name, locale: emailLocale, setUrl, userId: user.id });

  return NextResponse.json({ ok: true });
}
