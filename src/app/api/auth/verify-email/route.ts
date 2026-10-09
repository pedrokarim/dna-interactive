import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/community-builds/vote-identity";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { sendWelcomeEmail, toEmailLocale } from "@/lib/email/auth-emails";
import { getSiteUrl } from "@/lib/auth/site";
import { getApiTranslator } from "@/lib/api-locale";

export const dynamic = "force-dynamic";

// Un jeton fait 43 caractères (32 octets en base64url) : inutile d'en hacher
// un de plusieurs mégaoctets.
const TOKEN_MAX_LENGTH = 200;

// Consomme un token verify_email et active le compte. En POST, déclenché par un
// bouton : la page le faisait sur un simple GET, donc un antivirus de
// messagerie qui visite les liens d'un email pouvait confirmer une adresse à la
// place de son titulaire.
export async function POST(request: Request) {
  const t = await getApiTranslator(request);
  const ip = getClientIp(request.headers);
  const rate = await checkRateLimit(`auth:verify:${ip}`, 20, 60 * 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: t("tooManyAttempts") },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const locale = typeof body?.locale === "string" ? body.locale : undefined;
  if (!token || token.length > TOKEN_MAX_LENGTH) {
    return NextResponse.json({ error: t("verifyLinkInvalid") }, { status: 400 });
  }

  const userId = await consumeAuthToken(token, "verify_email");
  if (!userId) {
    return NextResponse.json({ error: t("verifyLinkInvalid") }, { status: 400 });
  }

  const [row] = await getDb()
    .update(schema.users)
    .set({ emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.id, userId))
    .returning({ email: schema.users.email, name: schema.users.name });

  // Un échec d'envoi ne doit pas faire échouer la confirmation : le compte est
  // déjà actif.
  if (row?.email) {
    const emailLocale = toEmailLocale(locale);
    try {
      await sendWelcomeEmail({
        to: row.email,
        name: row.name,
        locale: emailLocale,
        ctaUrl: `${getSiteUrl()}/${emailLocale}`,
        userId,
      });
    } catch (error) {
      console.error("[verify-email] envoi de l'email de bienvenue échoué:", error);
    }
  }

  return NextResponse.json({ ok: true });
}
