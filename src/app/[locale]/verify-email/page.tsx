import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";
import { CheckCircle2, XCircle } from "lucide-react";
import { DnaPanel, DnaSectionLabel } from "@/components/dna";
import { AuthLinkButton } from "@/components/auth/AuthCard";
import { getDb, schema } from "@/db";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { sendWelcomeEmail, toEmailLocale } from "@/lib/email/auth-emails";
import { getSiteUrl } from "@/lib/auth/site";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("verifyTitle"), robots: { index: false } };
}

async function verify(token: string | undefined, locale: string): Promise<boolean> {
  if (!token) return false;
  const userId = await consumeAuthToken(token, "verify_email");
  if (!userId) return false;

  const [row] = await getDb()
    .update(schema.users)
    .set({ emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.id, userId))
    .returning({ email: schema.users.email, name: schema.users.name });

  if (row?.email) {
    const emailLocale = toEmailLocale(locale);
    await sendWelcomeEmail({
      to: row.email,
      name: row.name,
      locale: emailLocale,
      ctaUrl: `${getSiteUrl()}/${emailLocale}`,
      userId,
    });
  }
  return true;
}

export default async function VerifyEmailPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { token } = await searchParams;
  const t = await getTranslations("auth");
  const ok = await verify(token, locale);

  return (
    <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-md">
        <DnaSectionLabel>{t("verifyKicker")}</DnaSectionLabel>
        <DnaPanel className="mt-4 p-6 text-center">
          {ok ? (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-gold" />
              <h1 className="mt-4 font-display text-2xl text-parch">{t("verifyOkTitle")}</h1>
              <p className="mt-2 font-sans text-sm text-muted">{t("verifyOkBody")}</p>
              <div className="mt-6">
                <AuthLinkButton href="/login">{t("verifyOkCta")}</AuthLinkButton>
              </div>
            </>
          ) : (
            <>
              <XCircle className="mx-auto h-12 w-12 text-crimson-bright" />
              <h1 className="mt-4 font-display text-2xl text-parch">{t("verifyFailTitle")}</h1>
              <p className="mt-2 font-sans text-sm text-muted">{t("verifyFailBody")}</p>
              <div className="mt-6">
                <AuthLinkButton href="/signup">{t("verifyFailCta")}</AuthLinkButton>
              </div>
            </>
          )}
        </DnaPanel>
      </div>
    </section>
  );
}
