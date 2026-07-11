import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { AppShell } from "@/components/site/AppShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";
import { getCurrentUser } from "@/lib/auth/session";
import { isGoogleEnabled } from "@/lib/auth/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signupTitle"), robots: { index: false } };
}

export default async function SignupPage({ params }: Props) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (user) redirect({ href: "/profile", locale });

  const t = await getTranslations("auth");
  return (
    <AppShell breadcrumb="//ACCOUNT.SIGNUP">
      <AuthCard
        kicker={t("signupKicker")}
        title={t("signupTitle")}
        subtitle={t("signupSubtitle")}
        footer={
          <>
            {t("hasAccount")}{" "}
            <Link href="/login" className="text-gold hover:text-gold-bright">
              {t("loginLink")}
            </Link>
          </>
        }
      >
        <SignupForm googleEnabled={isGoogleEnabled()} callbackUrl={`/${locale}`} />
      </AuthCard>
    </AppShell>
  );
}
