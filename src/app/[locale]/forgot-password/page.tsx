import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("forgotTitle"), robots: { index: false } };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <AuthCard
      kicker={t("forgotKicker")}
      title={t("forgotTitle")}
      subtitle={t("forgotSubtitle")}
      footer={
        <Link href="/login" className="text-gold hover:text-gold-bright">
          {t("backToLogin")}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
