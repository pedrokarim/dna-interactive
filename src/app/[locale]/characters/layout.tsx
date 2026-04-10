import type { Metadata, ResolvingMetadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import {
  ASSETS_PATHS,
  CONTACT_INFO,
  FOOTER_LINKS,
  LEGAL_INFO,
  NAVIGATION,
  NAV_LINKS,
  SITE_CONFIG,
} from "@/lib/constants";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MobileMenu from "@/components/MobileMenu";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.characters, parent, locale);
}

export default async function CharactersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tNav = await getTranslations('nav');
  const tCommon = await getTranslations('common');
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
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <header className="relative z-50 border-b border-indigo-500/20 bg-slate-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href={NAVIGATION.home} className="flex items-center gap-2 md:gap-3 min-w-0">
              <img
                src={ASSETS_PATHS.logo}
                alt={`${SITE_CONFIG.name} logo`}
                width={40}
                height={40}
                className="h-9 md:h-10 w-auto"
              />
              <div className="min-w-0">
                <div className="text-lg md:text-2xl font-bold text-white truncate">{SITE_CONFIG.name}</div>
                <p className="text-xs text-slate-400 truncate">{tSite('tagline')}</p>
              </div>
            </Link>

            <MobileMenu />

            <div className="hidden items-center gap-6 md:flex">
              <nav className="flex items-center gap-7">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm transition-colors ${
                      link.href === NAVIGATION.characters
                        ? "font-medium text-indigo-400"
                        : "text-slate-300 hover:text-indigo-400"
                    }`}
                  >
                    {navLabels[link.href] ?? link.label}
                  </Link>
                ))}
              </nav>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-6 py-5 md:py-10">{children}</main>

      <footer className="border-t border-indigo-500/20 bg-slate-950 py-8 md:py-12">
        <div className="container mx-auto px-3 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <img
                src={ASSETS_PATHS.logo}
                alt={`${SITE_CONFIG.name} logo`}
                className="h-8 w-auto"
              />
              <span className="text-sm font-semibold text-white">{SITE_CONFIG.name}</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-300 md:gap-x-6">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${
                    link.href === NAVIGATION.characters
                      ? "text-indigo-300"
                      : "hover:text-indigo-300"
                  }`}
                >
                  {navLabels[link.href] ?? link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-6 md:mt-8 border-t border-indigo-500/10 pt-6 md:pt-8 text-center text-sm text-slate-300">
            <p>{LEGAL_INFO.copyright}</p>
            <p className="mt-2">
              {LEGAL_INFO.disclaimer}
              <a
                href={CONTACT_INFO.ascencia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
              >
                {LEGAL_INFO.ascenciaCredit}
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
