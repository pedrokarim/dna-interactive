import type { Metadata } from "next";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { DiscordAuthButton } from "@/components/auth/DiscordAuthButton";
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

  return (
    <main className="min-h-screen bg-ink text-parch">
      <SiteHeader active={NAVIGATION.builder} />
      <section className="container mx-auto px-4 py-6 md:px-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <DnaSectionLabel>Builder communautaire</DnaSectionLabel>
            <h1 className="mt-2 font-display text-3xl leading-tight text-parch md:text-4xl">Builds Duet Night Abyss</h1>
          </div>
          <DiscordAuthButton />
        </div>

        {user?.banned ? (
          <DnaPanel className="p-5 text-sm text-muted">Compte suspendu.</DnaPanel>
        ) : (
          <CommunityBuildBuilderClient options={options} isAuthenticated={Boolean(user)} />
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
