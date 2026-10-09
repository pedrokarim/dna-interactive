import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DnaPanel, DnaSectionLabel } from "@/components/dna";
import { VerifyEmailConfirm } from "@/components/auth/VerifyEmailConfirm";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("verifyTitle"), robots: { index: false } };
}

// La page ne consomme plus le jeton au chargement : c'est le bouton de
// `VerifyEmailConfirm` qui le fait, via POST /api/auth/verify-email.
export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const t = await getTranslations("auth");

  return (
    <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-md">
        <DnaSectionLabel>{t("verifyKicker")}</DnaSectionLabel>
        <DnaPanel className="mt-4 p-6 text-center">
          <VerifyEmailConfirm token={typeof token === "string" ? token : ""} />
        </DnaPanel>
      </div>
    </section>
  );
}
