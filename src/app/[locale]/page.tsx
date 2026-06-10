import type { Metadata, ResolvingMetadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Map, Boxes, Users, ArrowRight } from "lucide-react";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import UpdateBanner from "@/components/UpdateBanner";
import HeroSection from "@/components/HeroSection";
import BuildShowcase from "@/components/BuildShowcase";
import NewCharactersBanner from "@/components/NewCharactersBanner";
import CommunityCards from "@/components/CommunityCards";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaDivider } from "@/components/dna/Divider";
import { DnaCornerBrackets } from "@/components/dna/CornerBrackets";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.home, parent, locale);
}

/** Libellé de section centré (eyebrow Cinzel + titre Cormorant + séparateur ◇). */
function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
      <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold/80">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl text-parch md:text-5xl">{title}</h2>
      <DnaDivider className="mx-auto mt-5 max-w-[14rem]" />
      {description ? <p className="mt-5 text-base text-parch/80 md:text-lg">{description}</p> : null}
    </div>
  );
}

const FEATURE_ICONS = {
  map: (
    <Map className="h-6 w-6" />
  ),
  markers: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  filters: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
    </svg>
  ),
  responsive: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
    </svg>
  ),
  items: (
    <Boxes className="h-6 w-6" />
  ),
  updates: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
} as const;

export default async function Home() {
  const tHome = await getTranslations("home");

  const features: Array<{ key: keyof typeof FEATURE_ICONS; title: string; desc: string }> = [
    { key: "map", title: tHome("featureMapTitle"), desc: tHome("featureMapDescription") },
    { key: "markers", title: tHome("featureMarkersTitle"), desc: tHome("featureMarkersDescription") },
    { key: "filters", title: tHome("featureFiltersTitle"), desc: tHome("featureFiltersDescription") },
    { key: "responsive", title: tHome("featureResponsiveTitle"), desc: tHome("featureResponsiveDescription") },
    { key: "items", title: tHome("featureItemsTitle"), desc: tHome("featureItemsDescription") },
    { key: "updates", title: tHome("featureUpdatesTitle"), desc: tHome("featureUpdatesDescription") },
  ];

  return (
    <main className="min-h-screen bg-linear-to-br from-ink via-panel to-ink text-parch">
      <SiteHeader />

      <UpdateBanner />

      <HeroSection />

      <NewCharactersBanner />

      {/* Communauté */}
      <section className="border-t border-line/15 bg-panel/50 py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow={tHome("communityTitle")}
              title={tHome("communityTitle")}
              description={tHome("communityDescription")}
            />
            <CommunityCards />
          </div>
        </div>
      </section>

      {/* Spotlight Items */}
      <section className="bg-panel/35 py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <article className="group relative overflow-hidden border border-gold/35 bg-ink/70 shadow-[0_32px_80px_rgba(15,23,42,0.55)]">
              <img
                src="/assets/worldview/worldview-8.webp"
                alt="Apercu visuel de la section Items"
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-r from-ink/95 via-ink/78 to-ink/35" />
              <div className="absolute inset-0 bg-linear-to-t from-ink/70 via-transparent to-black/20" />

              <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
                <div className="absolute left-[56%] top-[18%] h-14 w-14 -rotate-12 rounded-sm border border-hydro/35 bg-ink/70 p-2 shadow-[0_8px_24px_rgba(34,211,238,0.22)]">
                  <img src="/assets/optimized/home-spotlight/T_Mod_Phoenix01.webp" alt="Demon Wedge Phoenix" width="56" height="56" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[63%] top-[42%] h-14 w-14 rotate-9 rounded-sm border border-gold/35 bg-ink/70 p-2 shadow-[0_8px_24px_rgba(99,102,241,0.22)]">
                  <img src="/assets/optimized/home-spotlight/T_Mod_Typhon01_Blue.webp" alt="Demon Wedge Typhon" width="56" height="56" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[73%] top-[22%] h-12 w-12 -rotate-6 rounded-sm border border-crimson-bright/30 bg-ink/70 p-2">
                  <img src="/assets/optimized/home-spotlight/T_Draft_Mod_Griffin01_Red.webp" alt="Plan de forge Griffin" width="48" height="48" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[79%] top-[48%] h-12 w-12 rotate-12 rounded-sm border border-gold/30 bg-ink/70 p-2">
                  <img src="/assets/optimized/home-spotlight/T_Draft_Mod_Typhon01_Orange.webp" alt="Plan de forge Typhon" width="48" height="48" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[69%] top-[64%] h-11 w-11 -rotate-3 rounded-sm border border-electro/30 bg-ink/70 p-2">
                  <img src="/assets/optimized/home-spotlight/T_Armory_WeaponType_Katana.webp" alt="Katana" width="44" height="44" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[83%] top-[70%] h-12 w-12 rotate-6 rounded-sm border border-hydro/30 bg-ink/70 p-2">
                  <img src="/assets/optimized/home-spotlight/T_Head_Katana_Yuli.webp" alt="Katana de Yuli" width="48" height="48" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[61%] top-[70%] h-10 w-10 -rotate-12 rounded-sm border border-pyro/30 bg-ink/70 p-1.5">
                  <img src="/assets/optimized/home-spotlight/T_Armory_Fire.webp" alt="Element Feu" width="40" height="40" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[76%] top-[10%] h-10 w-10 rotate-12 rounded-sm border border-hydro/30 bg-ink/70 p-1.5">
                  <img src="/assets/optimized/home-spotlight/T_Armory_Water.webp" alt="Element Eau" width="40" height="40" loading="lazy" className="h-full w-full object-contain" />
                </div>
              </div>

              <DnaCornerBrackets size={22} className="z-10 opacity-70" />
              <div className="relative z-10 px-8 py-10 sm:px-12 sm:py-14">
                <span className="inline-flex items-center border border-gold/40 bg-gold/15 px-3 py-1 font-caps text-[0.58rem] uppercase tracking-[0.22em] text-gold">
                  {tHome("itemsSpotlightBadge")}
                </span>
                <h2 className="mt-4 max-w-3xl font-display text-3xl text-parch sm:text-4xl">
                  {tHome("itemsSpotlightTitle")}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-parch/90">
                  {tHome("itemsSpotlightDescription")}
                </p>
                <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/items"
                    className="dna-shine inline-flex items-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-5 py-3 text-sm font-medium text-gold-bright transition-all duration-200 hover:-translate-y-px hover:border-gold-bright hover:text-[#fff6e6]"
                  >
                    {tHome("itemsSpotlightCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-sm text-parch/75">{tHome("itemsSpotlightCategories")}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Spotlight Personnages */}
      <section className="bg-panel/45 py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <article className="group relative overflow-hidden border border-electro/35 bg-ink/70 shadow-[0_32px_80px_rgba(15,23,42,0.55)]">
              <img
                src="/assets/worldview/worldview-9.webp"
                alt="Apercu visuel de la section Personnages"
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-r from-ink/95 via-ink/78 to-ink/35" />
              <div className="absolute inset-0 bg-linear-to-t from-electro/70 via-transparent to-black/20" />

              <DnaCornerBrackets size={22} color="var(--color-electro)" className="z-10 opacity-70" />
              <div className="relative z-10 px-8 py-10 sm:px-12 sm:py-14">
                <span className="inline-flex items-center border border-electro/45 bg-electro/15 px-3 py-1 font-caps text-[0.58rem] uppercase tracking-[0.22em] text-electro">
                  {tHome("charactersSpotlightBadge")}
                </span>
                <h2 className="mt-4 max-w-3xl font-display text-3xl text-parch sm:text-4xl">
                  {tHome("charactersSpotlightTitle")}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-parch/90">
                  {tHome("charactersSpotlightDescription")}
                </p>
                <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/characters"
                    className="dna-shine inline-flex items-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-5 py-3 text-sm font-medium text-gold-bright transition-all duration-200 hover:-translate-y-px hover:border-gold-bright hover:text-[#fff6e6]"
                  >
                    <Users className="h-4 w-4" />
                    {tHome("charactersSpotlightCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-sm text-parch/75">{tHome("charactersSpotlightCategories")}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <BuildShowcase />

      {/* Fonctionnalités */}
      <section className="border-t border-line/15 bg-panel/30 py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <SectionHeading eyebrow={tHome("featuresTitle")} title={tHome("featuresTitle")} />

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <DnaPanel
                  key={feature.key}
                  className="group relative p-6 transition-colors hover:border-gold/40"
                >
                  <DnaCornerBrackets size={14} className="opacity-30 transition-opacity group-hover:opacity-70" />
                  <div className="grid h-12 w-12 place-items-center border border-gold/30 bg-gold/10 text-gold transition-colors group-hover:border-gold/60 group-hover:text-gold-bright">
                    {FEATURE_ICONS[feature.key]}
                  </div>
                  <h3 className="mt-4 font-display text-xl text-parch">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-parch/80">{feature.desc}</p>
                </DnaPanel>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/map"
                className="dna-shine inline-flex items-center justify-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-8 py-4 font-medium text-gold-bright transition-all duration-200 hover:-translate-y-px hover:border-gold-bright hover:text-[#fff6e6]"
              >
                <Map className="h-5 w-5" />
                {tHome("exploreMap")}
              </Link>
              <Link
                href="/items"
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/20 bg-gradient-to-b from-panel/70 to-ink/70 px-8 py-4 font-medium text-parch transition-all duration-200 hover:-translate-y-px hover:border-white/45 hover:text-white"
              >
                <Boxes className="h-5 w-5" />
                {tHome("exploreItems")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
