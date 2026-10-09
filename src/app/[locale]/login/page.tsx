import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";
import { isGoogleEnabled } from "@/lib/auth/site";
import { OAUTH_EMAIL_UNVERIFIED_ERROR } from "@/lib/auth/oauth-errors";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginTitle"), robots: { index: false } };
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect({ href: "/profile", locale });

  const t = await getTranslations("auth");
  return (
    <AuthCard
      kicker={t("loginKicker")}
      title={t("loginTitle")}
      subtitle={t("loginSubtitle")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link href="/signup" className="text-gold hover:text-gold-bright">
            {t("signupLink")}
          </Link>
        </>
      }
    >
      <LoginForm
        googleEnabled={isGoogleEnabled()}
        callbackUrl={`/${locale}`}
        oauthEmailUnverified={error === OAUTH_EMAIL_UNVERIFIED_ERROR}
      />
    </AuthCard>
  );
}
