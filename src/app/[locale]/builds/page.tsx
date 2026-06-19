import type { Metadata } from "next";
import { Hammer } from "lucide-react";
import { Link } from "@/i18n/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { CommunityBuildsHubClient } from "@/components/community-builds/CommunityBuildsHubClient";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { NAVIGATION } from "@/lib/constants";
import { getBuilderOptions } from "@/lib/community-builds/options";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Builds communauté",
  description: "Parcourir les builds communautaires Duet Night Abyss publiés par les joueurs.",
};

export default async function CommunityBuildsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const options = getBuilderOptions(locale);

  return (
    <main className="min-h-screen bg-ink text-parch">
      <SiteHeader active={NAVIGATION.builder} />
      <section className="container mx-auto px-4 py-6 md:px-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <DnaSectionLabel>Builds communauté</DnaSectionLabel>
            <h1 className="mt-2 font-display text-3xl leading-tight text-parch md:text-4xl">
              Bibliothèque de builds
            </h1>
            <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-muted">
              Retrouve les builds proposés par la communauté, ouvre leur fiche complète ou utilise-les comme point de départ.
            </p>
          </div>
          <Link
            href={NAVIGATION.builder}
            className="dna-shine inline-flex items-center justify-center gap-2 border border-gold bg-gold/15 px-4 py-2.5 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-gold-bright transition-colors hover:border-gold-bright hover:text-[#fff6e6]"
          >
            <Hammer className="h-4 w-4" />
            Créer un build
          </Link>
        </div>

        <CommunityBuildsHubClient options={options} locale={locale} />
      </section>
      <SiteFooter active={NAVIGATION.builds} />
    </main>
  );
}
