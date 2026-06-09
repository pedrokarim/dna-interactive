import type { Metadata, ResolvingMetadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Map, Gift, Info, HelpCircle, Mail, Boxes, Users, ArrowRight } from "lucide-react";
import {
  SITE_CONFIG,
  ASSETS_PATHS,
  NAVIGATION,
  NAV_LINKS,
  FOOTER_LINKS,
  GAME_INFO,
  CONTACT_INFO,
  LEGAL_INFO,
} from "@/lib/constants";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import UpdateBanner from "@/components/UpdateBanner";
import HeroSection from "@/components/HeroSection";
import BuildShowcase from "@/components/BuildShowcase";
import NewCharactersBanner from "@/components/NewCharactersBanner";
import CommunityCards from "@/components/CommunityCards";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MobileMenu from "@/components/MobileMenu";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.home, parent, locale);
}


// Mapping des icônes pour la navigation
const navIcons = {
  [NAVIGATION.map]: Map,
  [NAVIGATION.items]: Boxes,
  [NAVIGATION.characters]: Users,
  [NAVIGATION.codes]: Gift,
  [NAVIGATION.about]: Info,
  [NAVIGATION.support]: HelpCircle,
  [NAVIGATION.contact]: Mail,
};

export default async function Home() {
  const tHome = await getTranslations('home');
  const tNav = await getTranslations('nav');
  const tCommon = await getTranslations('common');
  const tLegal = await getTranslations('legal');
  const tCommunity = await getTranslations('community');
  const tSite = await getTranslations('site');

  const navLabels: Record<string, string> = {
    [NAVIGATION.map]: tNav('map'),
    [NAVIGATION.items]: tNav('items'),
    [NAVIGATION.characters]: tNav('characters'),
    [NAVIGATION.codes]: tNav('codes'),
    [NAVIGATION.about]: tNav('about'),
    [NAVIGATION.support]: tNav('support'),
    [NAVIGATION.contact]: tNav('contact'),
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-electro via-panel to-ink text-parch">
      {/* Header */}
      <header className="relative z-50 bg-ink/80 backdrop-blur-sm border-b border-gold/20">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <img
                src={ASSETS_PATHS.logo}
                alt={`${SITE_CONFIG.name} Logo`}
                width={40}
                height={40}
                className="h-9 md:h-10 w-auto"
              />
              <div className="min-w-0">
                <div className="text-lg md:text-2xl font-bold text-parch flex items-center gap-2 truncate">
                  {SITE_CONFIG.name}
                </div>
                <p className="text-xs text-muted truncate">{tSite('tagline')}</p>
              </div>
            </div>

            <MobileMenu />

            <div className="hidden md:flex items-center gap-3 lg:gap-6">
              <nav className="flex items-center gap-4 lg:gap-6 xl:gap-8 text-sm lg:text-base">
                {NAV_LINKS.map((link) => {
                  const IconComponent = navIcons[link.href];
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-2 text-gray-300 hover:text-gold transition-colors"
                    >
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      <span>{navLabels[link.href] ?? link.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Update Banners - composant client avec persistance */}
      <UpdateBanner />

      {/* Hero Section - Composant client */}
      <HeroSection />

      {/* New Characters Banner */}
      <NewCharactersBanner />

      {/* Community Section */}
      <section className="py-20 bg-panel/50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-parch mb-6">
                {tHome('communityTitle')}
              </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                {tHome('communityDescription')}
              </p>
            </div>

            {/* Composant client pour les cartes avec animations */}
            <CommunityCards />
          </div>
        </div>
      </section>

      {/* Items Spotlight Section */}
      <section className="py-20 bg-panel/35">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <article className="group relative overflow-hidden rounded-3xl border border-gold/35 bg-ink/70 shadow-[0_32px_80px_rgba(15,23,42,0.55)]">
              <img
                src="/assets/worldview/worldview-8.webp"
                alt="Apercu visuel de la section Items"
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-r from-ink/95 via-ink/78 to-ink/35" />
              <div className="absolute inset-0 bg-linear-to-t from-ink/70 via-transparent to-black/20" />

              <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
                <div className="absolute left-[56%] top-[18%] h-14 w-14 -rotate-12 rounded-xl border border-hydro/35 bg-ink/70 p-2 shadow-[0_8px_24px_rgba(34,211,238,0.22)]">
                  <img src="/assets/optimized/home-spotlight/T_Mod_Phoenix01.webp" alt="Demon Wedge Phoenix" width="56" height="56" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[63%] top-[42%] h-14 w-14 rotate-9 rounded-xl border border-gold/35 bg-ink/70 p-2 shadow-[0_8px_24px_rgba(99,102,241,0.22)]">
                  <img src="/assets/optimized/home-spotlight/T_Mod_Typhon01_Blue.webp" alt="Demon Wedge Typhon" width="56" height="56" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[73%] top-[22%] h-12 w-12 -rotate-6 rounded-lg border border-crimson-bright/30 bg-ink/70 p-2">
                  <img src="/assets/optimized/home-spotlight/T_Draft_Mod_Griffin01_Red.webp" alt="Plan de forge Griffin" width="48" height="48" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[79%] top-[48%] h-12 w-12 rotate-12 rounded-lg border border-gold/30 bg-ink/70 p-2">
                  <img src="/assets/optimized/home-spotlight/T_Draft_Mod_Typhon01_Orange.webp" alt="Plan de forge Typhon" width="48" height="48" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[69%] top-[64%] h-11 w-11 -rotate-3 rounded-lg border border-electro/30 bg-ink/70 p-2">
                  <img src="/assets/optimized/home-spotlight/T_Armory_WeaponType_Katana.webp" alt="Katana" width="44" height="44" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[83%] top-[70%] h-12 w-12 rotate-6 rounded-lg border border-hydro/30 bg-ink/70 p-2">
                  <img src="/assets/optimized/home-spotlight/T_Head_Katana_Yuli.webp" alt="Katana de Yuli" width="48" height="48" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[61%] top-[70%] h-10 w-10 -rotate-12 rounded-md border border-pyro/30 bg-ink/70 p-1.5">
                  <img src="/assets/optimized/home-spotlight/T_Armory_Fire.webp" alt="Element Feu" width="40" height="40" loading="lazy" className="h-full w-full object-contain" />
                </div>
                <div className="absolute left-[76%] top-[10%] h-10 w-10 rotate-12 rounded-md border border-hydro/30 bg-ink/70 p-1.5">
                  <img src="/assets/optimized/home-spotlight/T_Armory_Water.webp" alt="Element Eau" width="40" height="40" loading="lazy" className="h-full w-full object-contain" />
                </div>
              </div>

              <div className="relative z-10 px-8 py-10 sm:px-12 sm:py-14">
                <span className="inline-flex items-center rounded-full border border-gold/35 bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  {tHome('itemsSpotlightBadge')}
                </span>
                <h2 className="mt-4 max-w-3xl text-3xl font-bold text-parch sm:text-4xl">
                  {tHome('itemsSpotlightTitle')}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-parch">
                  {tHome('itemsSpotlightDescription')}
                </p>
                <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/items"
                    className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/20 px-5 py-3 text-sm font-semibold text-parch transition-all duration-200 hover:border-gold/70 hover:bg-gold/30"
                  >
                    {tHome('itemsSpotlightCta')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-sm text-parch/85/90">
                    {tHome('itemsSpotlightCategories')}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Characters Spotlight Section */}
      <section className="py-20 bg-panel/45">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <article className="group relative overflow-hidden rounded-3xl border border-electro/35 bg-ink/70 shadow-[0_32px_80px_rgba(15,23,42,0.55)]">
              <img
                src="/assets/worldview/worldview-9.webp"
                alt="Apercu visuel de la section Personnages"
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-r from-ink/95 via-ink/78 to-ink/35" />
              <div className="absolute inset-0 bg-linear-to-t from-electro/70 via-transparent to-black/20" />

              <div className="relative z-10 px-8 py-10 sm:px-12 sm:py-14">
                <span className="inline-flex items-center rounded-full border border-electro/35 bg-electro/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-electro">
                  {tHome('charactersSpotlightBadge')}
                </span>
                <h2 className="mt-4 max-w-3xl text-3xl font-bold text-parch sm:text-4xl">
                  {tHome('charactersSpotlightTitle')}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-parch">
                  {tHome('charactersSpotlightDescription')}
                </p>
                <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/characters"
                    className="inline-flex items-center gap-2 rounded-xl border border-electro/40 bg-electro/20 px-5 py-3 text-sm font-semibold text-parch transition-all duration-200 hover:border-electro/70 hover:bg-electro/30"
                  >
                    <Users className="h-4 w-4" />
                    {tHome('charactersSpotlightCta')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-sm text-parch/85/90">
                    {tHome('charactersSpotlightCategories')}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Build Card Showcase — demos the Quick Build feature with Psyche */}
      <BuildShowcase />

      {/* Features Section */}
      <section className="py-20 bg-panel/30">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-parch mb-6">
                {tHome('featuresTitle')}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-linear-to-br from-panel/50 to-panel/50 backdrop-blur-sm border border-gold/20 rounded-xl p-6 hover:border-gold/40 transition-colors">
                <div className="w-12 h-12 bg-linear-to-br from-gold to-electro rounded-lg flex items-center justify-center mb-4">
                  <Map className="w-6 h-6 text-parch" />
                </div>
                <h3 className="text-xl font-semibold text-parch mb-3">
                  {tHome('featureMapTitle')}
                </h3>
                <p className="text-gray-300">
                  {tHome('featureMapDescription')}
                </p>
              </div>

              <div className="bg-linear-to-br from-panel/50 to-panel/50 backdrop-blur-sm border border-gold/20 rounded-xl p-6 hover:border-gold/40 transition-colors">
                <div className="w-12 h-12 bg-linear-to-br from-gold to-electro rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-parch"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-parch mb-3">
                  {tHome('featureMarkersTitle')}
                </h3>
                <p className="text-gray-300">
                  {tHome('featureMarkersDescription')}
                </p>
              </div>

              <div className="bg-linear-to-br from-panel/50 to-panel/50 backdrop-blur-sm border border-gold/20 rounded-xl p-6 hover:border-gold/40 transition-colors">
                <div className="w-12 h-12 bg-linear-to-br from-gold to-electro rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-parch"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-parch mb-3">
                  {tHome('featureFiltersTitle')}
                </h3>
                <p className="text-gray-300">
                  {tHome('featureFiltersDescription')}
                </p>
              </div>

              <div className="bg-linear-to-br from-panel/50 to-panel/50 backdrop-blur-sm border border-gold/20 rounded-xl p-6 hover:border-gold/40 transition-colors">
                <div className="w-12 h-12 bg-linear-to-br from-gold to-electro rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-parch"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-parch mb-3">
                  {tHome('featureResponsiveTitle')}
                </h3>
                <p className="text-gray-300">
                  {tHome('featureResponsiveDescription')}
                </p>
              </div>

              <div className="bg-linear-to-br from-panel/50 to-panel/50 backdrop-blur-sm border border-gold/20 rounded-xl p-6 hover:border-gold/40 transition-colors">
                <div className="w-12 h-12 bg-linear-to-br from-gold to-electro rounded-lg flex items-center justify-center mb-4">
                  <Boxes className="w-6 h-6 text-parch" />
                </div>
                <h3 className="text-xl font-semibold text-parch mb-3">
                  {tHome('featureItemsTitle')}
                </h3>
                <p className="text-gray-300">
                  {tHome('featureItemsDescription')}
                </p>
              </div>

              <div className="bg-linear-to-br from-panel/50 to-panel/50 backdrop-blur-sm border border-gold/20 rounded-xl p-6 hover:border-gold/40 transition-colors">
                <div className="w-12 h-12 bg-linear-to-br from-gold to-electro rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-parch"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-parch mb-3">
                  {tHome('featureUpdatesTitle')}
                </h3>
                <p className="text-gray-300">
                  {tHome('featureUpdatesDescription')}
                </p>
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/map"
                className="inline-flex items-center justify-center px-8 py-4 bg-linear-to-r from-gold to-electro hover:from-gold hover:to-electro rounded-lg font-semibold text-parch transition-all duration-300 transform hover:scale-105 shadow-lg shadow-gold/25"
              >
                <Map className="w-5 h-5 mr-2" />
                {tHome('exploreMap')}
              </Link>
              <Link
                href="/items"
                className="inline-flex items-center justify-center px-8 py-4 bg-panel/70 hover:bg-white/10 border border-gold/30 rounded-lg font-semibold text-parch transition-all duration-300 transform hover:scale-105"
              >
                <Boxes className="w-5 h-5 mr-2" />
                {tHome('exploreItems')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink border-t border-gold/20 py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src={ASSETS_PATHS.logo}
                alt={`${SITE_CONFIG.name} Logo`}
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="text-parch font-semibold">
                {SITE_CONFIG.name}
              </span>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-parch/85 md:gap-x-6">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-gold transition-colors"
                >
                  {navLabels[link.href] ?? link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-6 pt-6 md:mt-8 md:pt-8 border-t border-gold/10 text-center text-sm text-parch/85">
            <p>{LEGAL_INFO.copyright}</p>
            <p className="mt-2">
              {LEGAL_INFO.disclaimer}
              <a
                href={CONTACT_INFO.ascencia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold underline underline-offset-2 ml-1"
              >
                {LEGAL_INFO.ascenciaCredit}
              </a>
            </p>
            <p className="mt-3 text-xs text-parch/85 italic max-w-2xl mx-auto">
              <span className="font-semibold text-parch">{tCommon('disclaimer')}:</span>{" "}
              {tLegal('disclaimerFull')}{" "}
              <span className="block mt-1">
                {tLegal('disclaimerFullEn')}
              </span>
            </p>
            <p className="mt-3">
              <Link
                href="/changelog"
                className="text-gold hover:text-gold underline underline-offset-2 transition-colors"
              >
                {tCommon('viewChangelog')}
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
