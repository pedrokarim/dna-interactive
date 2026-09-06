import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DnaDivider } from "@/components/dna/Divider";
import { ChangelogFeed } from "@/components/changelog/ChangelogFeed";
import { ChangelogLegacyFeed } from "@/components/changelog/ChangelogLegacyFeed";
import { getChangelogPage, getChangelogVersionIndex } from "@/lib/changelog/db";

export const dynamic = "force-dynamic";

/**
 * Journal des versions.
 *
 * La première page et l'index des versions sont rendus par le serveur : le
 * contenu est lisible et indexable sans attendre le JavaScript, et le
 * défilement infini ne prend le relais qu'ensuite.
 */
export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "changelog" });
  const tc = await getTranslations({ locale, namespace: "common" });

  const [page, versions] = await Promise.all([getChangelogPage({ locale }), getChangelogVersionIndex()]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-12 text-center">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center border border-gold/30 bg-gold/10 text-gold">
          <Sparkles className="h-7 w-7" />
        </span>
        <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold">{t("eyebrow")}</p>
        <h1 className="mt-3 font-display text-4xl text-parch md:text-5xl">{t("title")}</h1>
        <DnaDivider className="mx-auto mt-5 max-w-[14rem]" />
        <p className="mt-5 text-lg text-parch/80">{t("description")}</p>
      </div>

      {page.migrationPending ? <ChangelogLegacyFeed /> : <ChangelogFeed initial={page} versions={versions} />}

      <div className="mt-12 text-center">
        <Link
          href="/"
          className="dna-shine inline-flex items-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-6 py-3 font-medium text-gold-bright transition-all duration-200 hover:-translate-y-px hover:border-gold-bright hover:text-gold-hover"
        >
          {tc("backToHome")}
        </Link>
      </div>
    </div>
  );
}
