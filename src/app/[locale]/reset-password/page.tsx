import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ token?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("resetTitle"), robots: { index: false } };
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const t = await getTranslations("auth");
  return (
    <AuthCard kicker={t("resetKicker")} title={t("resetTitle")} subtitle={t("resetSubtitle")}>
      <ResetPasswordForm token={token ?? ""} />
    </AuthCard>
  );
}
