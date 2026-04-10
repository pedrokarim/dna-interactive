import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { SITE_CONFIG } from "@/lib/constants";
import CodesList from "@/components/CodesList";
import type { Metadata, ResolvingMetadata } from "next";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MobileMenu from "@/components/MobileMenu";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.codes, parent, locale);
}

export default async function CodesPage() {
  const tNav = await getTranslations('nav');
  const tCommon = await getTranslations('common');
  const tCodes = await getTranslations('codes');
  const tLegal = await getTranslations('legal');
  const tSite = await getTranslations('site');
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-950 via-slate-900 to-indigo-950 text-white">
      {/* Header */}
      <header className="relative z-50 bg-slate-950/80 backdrop-blur-sm border-b border-indigo-500/20">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <img
                src="/assets/images/logo_optimized.png"
                alt={`${SITE_CONFIG.name} Logo`}
                width={40}
                height={40}
                className="h-9 md:h-10 w-auto"
              />
              <div className="min-w-0">
                <div className="text-lg md:text-2xl font-bold text-white flex items-center gap-2 truncate">
                  {SITE_CONFIG.name}
                </div>
                <p className="text-xs text-slate-400 truncate">{tSite('tagline')}</p>
              </div>
            </div>

            <MobileMenu />

            <div className="hidden md:flex items-center gap-6">
              <nav className="flex items-center space-x-8">
                <Link
                  href="/"
                  className="text-gray-300 hover:text-indigo-400 transition-colors"
                >
                  {tNav('home')}
                </Link>
                <Link
                  href="/map"
                  className="text-gray-300 hover:text-indigo-400 transition-colors"
                >
                  {tNav('map')}
                </Link>
                <Link
                  href="/items"
                  className="text-gray-300 hover:text-indigo-400 transition-colors"
                >
                  {tNav('items')}
                </Link>
                <Link href="/codes" className="text-indigo-400 font-medium">
                  {tNav('codes')}
                </Link>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-indigo-400 transition-colors"
                >
                  {tNav('about')}
                </Link>
                <Link
                  href="/support"
                  className="text-gray-300 hover:text-indigo-400 transition-colors"
                >
                  {tNav('support')}
                </Link>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-indigo-400 transition-colors"
                >
                  {tNav('contact')}
                </Link>
              </nav>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <CodesList />
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-indigo-500/20 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <img
                src="/assets/ui/duet-logo-white.png"
                alt={`${SITE_CONFIG.name} Logo`}
                className="h-8 w-auto"
              />
              <span className="text-white font-semibold">
                {SITE_CONFIG.name}
              </span>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-300 md:gap-x-6">
              <Link href="/" className="hover:text-indigo-400 transition-colors">
                {tNav('home')}
              </Link>
              <Link
                href="/map"
                className="hover:text-indigo-400 transition-colors"
              >
                {tNav('map')}
              </Link>
              <Link
                href="/items"
                className="hover:text-indigo-400 transition-colors"
              >
                {tNav('items')}
              </Link>
              <Link href="/codes" className="text-indigo-400">
                {tNav('codes')}
              </Link>
              <Link
                href="/about"
                className="hover:text-indigo-400 transition-colors"
              >
                {tNav('about')}
              </Link>
              <Link
                href="/support"
                className="hover:text-indigo-400 transition-colors"
              >
                {tNav('support')}
              </Link>
              <Link
                href="/contact"
                className="hover:text-indigo-300 transition-colors"
              >
                {tNav('contact')}
              </Link>
            </nav>
          </div>

          <div className="mt-8 pt-8 border-t border-indigo-500/10 text-center text-sm text-gray-500">
            <p>
              {tLegal('copyright', { siteName: SITE_CONFIG.name, creator: 'Ahmed Karim aka PedroKarim' })}
            </p>
            <p className="mt-2">
              {tLegal('disclaimer')}
              <a
                href="https://ascencia.re/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 ml-1"
              >
                {tLegal('ascenciaCredit')}
              </a>
            </p>
            <p className="mt-3">
              <Link
                href="/changelog"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {tCommon('viewChangelog')}
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
