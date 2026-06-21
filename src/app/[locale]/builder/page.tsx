import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { CommunityBuildBuilderClient } from "@/components/builder/CommunityBuildBuilderClient";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { NAVIGATION } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/session";
import { getBuilderOptions } from "@/lib/community-builds/options";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Builder de builds communautaires",
  description: "Créer et publier des builds communautaires Duet Night Abyss.",
};

export default async function BuilderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();
  const options = getBuilderOptions(locale);
  const t = await getTranslations("builder");

  return (
    <main className="min-h-screen bg-ink text-parch">
      <SiteHeader active={NAVIGATION.builder} />
      <section className="container mx-auto px-4 py-6 md:px-6">
        <div className="mb-4">
          <div>
            <DnaSectionLabel>{t("pageCommunityBuilder")}</DnaSectionLabel>
            <h1 className="mt-2 font-display text-3xl leading-tight text-parch md:text-4xl">{t("pageBuildsTitle")}</h1>
          </div>
        </div>

        {user?.banned ? (
          <DnaPanel className="p-5 text-sm text-muted">{t("accountSuspended")}</DnaPanel>
        ) : (
          <CommunityBuildBuilderClient options={options} isAuthenticated={Boolean(user)} />
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
