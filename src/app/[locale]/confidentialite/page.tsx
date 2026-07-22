import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DnaPanel, DnaSectionLabel } from "@/components/dna";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ConfidentialitePage() {
  const t = await getTranslations("privacy");

  return (
    <section className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-3xl">
        <DnaSectionLabel>{t("section")}</DnaSectionLabel>
        <h1 className="mt-2 font-display text-3xl leading-tight text-parch md:text-4xl">{t("title")}</h1>
        <p className="mt-2 font-sans text-sm text-muted">{t("intro")}</p>

        <div className="mt-6 space-y-4">
          <DnaPanel className="p-5">
            <DnaSectionLabel>{t("dataTitle")}</DnaSectionLabel>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 font-sans text-sm leading-relaxed text-parch/85">
              <li>{t("data1")}</li>
              <li>{t("data2")}</li>
              <li>{t("data3")}</li>
            </ul>
            <p className="mt-3 font-sans text-sm leading-relaxed text-parch/85">{t("dataNote")}</p>
          </DnaPanel>

          <DnaPanel className="p-5">
            <DnaSectionLabel>{t("purposeTitle")}</DnaSectionLabel>
            <p className="mt-3 font-sans text-sm leading-relaxed text-parch/85">{t("purposeText")}</p>
          </DnaPanel>

          <DnaPanel className="p-5">
            <DnaSectionLabel>{t("rightsTitle")}</DnaSectionLabel>
            <p className="mt-3 font-sans text-sm leading-relaxed text-parch/85">
              {t.rich("rightsText", {
                b: (chunks) => <strong className="text-parch">{chunks}</strong>,
                link: (chunks) => (
                  <Link href="/profile" className="text-gold underline underline-offset-2 hover:text-gold-bright">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </DnaPanel>

          <DnaPanel className="p-5">
            <DnaSectionLabel>{t("ugcTitle")}</DnaSectionLabel>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 font-sans text-sm leading-relaxed text-parch/85">
              <li>{t("ugc1")}</li>
              <li>{t("ugc2")}</li>
              <li>{t("ugc3")}</li>
              <li>{t("ugc4")}</li>
            </ul>
          </DnaPanel>

          <DnaPanel className="p-5">
            <DnaSectionLabel>{t("contactTitle")}</DnaSectionLabel>
            <p className="mt-3 font-sans text-sm leading-relaxed text-parch/85">
              {t.rich("contactText", {
                link: (chunks) => (
                  <Link href="/contact" className="text-gold underline underline-offset-2 hover:text-gold-bright">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </DnaPanel>
        </div>
      </div>
    </section>
  );
}
