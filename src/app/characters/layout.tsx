import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
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

export async function generateMetadata(
  _props: object,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  return generatePageMetadata(pageMetadata.characters, parent);
}

export default function CharactersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <header className="relative z-50 border-b border-indigo-500/20 bg-slate-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <Link href={NAVIGATION.home} className="flex items-center gap-3">
              <img
                src={ASSETS_PATHS.logo}
                alt={`${SITE_CONFIG.name} logo`}
                className="h-10 w-auto"
              />
              <div>
                <div className="text-2xl font-bold text-white">{SITE_CONFIG.name}</div>
                <p className="text-xs text-slate-400">{SITE_CONFIG.tagline}</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 md:flex">
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
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">{children}</main>

      <footer className="border-t border-indigo-500/20 bg-slate-950 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <img
                src={ASSETS_PATHS.logo}
                alt={`${SITE_CONFIG.name} logo`}
                className="h-8 w-auto"
              />
              <span className="text-sm font-semibold text-white">{SITE_CONFIG.name}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${
                    link.href === NAVIGATION.characters
                      ? "text-indigo-400"
                      : "hover:text-indigo-400"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-indigo-500/10 pt-8 text-center text-sm text-slate-500">
            <p>{LEGAL_INFO.copyright}</p>
            <p className="mt-2">
              {LEGAL_INFO.disclaimer}
              <a
                href={CONTACT_INFO.ascencia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-indigo-400 hover:text-indigo-300"
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
