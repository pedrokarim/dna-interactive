import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/community-builds/vote-identity";
import { hashPassword } from "@/lib/auth/password";
import { createAuthToken } from "@/lib/auth/tokens";
import { registerSchema } from "@/lib/auth/credentials-validation";
import { sendVerificationEmail, toEmailLocale } from "@/lib/email/auth-emails";
import { getSiteUrl } from "@/lib/auth/site";
import { getAppSettings } from "@/lib/settings/db";
import { getApiTranslator } from "@/lib/api-locale";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const t = await getApiTranslator(request);
  const ip = getClientIp(request.headers);
  const rate = await checkRateLimit(`auth:register:${ip}`, 5, 60 * 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: t("tooManyAttempts") },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const settings = await getAppSettings();
  if (!settings.signupEnabled || settings.maintenanceMode) {
    return NextResponse.json({ error: t("signupsClosed") }, { status: 403 });
  }

  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: t(parsed.error.issues[0]?.message ?? "invalidData") }, { status: 400 });
  }
  const { email, password, name, locale } = parsed.data;
  const db = getDb();

  // Email unique (insensible à la casse). Si déjà pris → 409 explicite (l'appli
  // n'est pas sensible à l'énumération ; UX plus claire).
  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${email}`)
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: t("emailAlreadyUsed") },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(schema.users)
    .values({ email, name: name ?? null, passwordHash })
    .returning({ id: schema.users.id });

  // Email de vérification : le login natif reste bloqué tant qu'il n'est pas
  // cliqué. Un échec d'envoi ne doit pas faire échouer l'inscription (compte
  // déjà créé) — l'utilisateur pourra redemander un lien.
  const emailLocale = toEmailLocale(locale);
  const token = await createAuthToken(created.id, "verify_email");
  const verifyUrl = `${getSiteUrl()}/${emailLocale}/verify-email?token=${token}`;
  try {
    await sendVerificationEmail({ to: email, name: name ?? null, locale: emailLocale, verifyUrl, userId: created.id });
  } catch (error) {
    console.error("[register] envoi email de vérification échoué:", error);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
