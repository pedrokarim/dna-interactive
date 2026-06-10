import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import {
  ASSETS_PATHS,
  CONTACT_INFO,
  FOOTER_LINKS,
  LEGAL_INFO,
  NAVIGATION,
  SITE_CONFIG,
} from "@/lib/constants";
import { DnaDivider } from "@/components/dna/Divider";

/** Pied de page de site — design system DNA (marque Cormorant, nav Cinzel, séparateur ◇). */
export default async function SiteFooter({ active }: { active?: string }) {
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const tLegal = await getTranslations("legal");

  const navLabels: Record<string, string> = {
    [NAVIGATION.map]: tNav("map"),
    [NAVIGATION.items]: tNav("items"),
    [NAVIGATION.characters]: tNav("characters"),
    [NAVIGATION.codes]: tNav("codes"),
    [NAVIGATION.about]: tNav("about"),
    [NAVIGATION.support]: tNav("support"),
    [NAVIGATION.contact]: tNav("contact"),
  };

  return (
    <footer className="border-t border-gold/20 bg-ink py-8 md:py-12">
      <div className="container mx-auto px-3 md:px-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <img
              src={ASSETS_PATHS.logo}
              alt={`${SITE_CONFIG.name} logo`}
              className="h-8 w-auto"
            />
            <span className="font-display text-lg text-parch">{SITE_CONFIG.name}</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-parch/75 md:gap-x-6">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  link.href === active ? "text-gold-bright" : "hover:text-gold"
                }`}
              >
                {navLabels[link.href] ?? link.label}
              </Link>
            ))}
          </nav>
        </div>

        <DnaDivider className="mt-6 md:mt-8" />

        <div className="mt-6 text-center text-sm text-parch/85">
          <p>{LEGAL_INFO.copyright}</p>
          <p className="mt-2">
            {LEGAL_INFO.disclaimer}
            <a
              href={CONTACT_INFO.ascencia.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-gold underline underline-offset-2 hover:text-gold-bright"
            >
              {LEGAL_INFO.ascenciaCredit}
            </a>
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-xs italic text-parch/70">
            <span className="font-semibold text-parch">{tCommon("disclaimer")}:</span>{" "}
            {tLegal("disclaimerFull")}{" "}
            <span className="mt-1 block">{tLegal("disclaimerFullEn")}</span>
          </p>
          <p className="mt-3">
            <Link
              href="/changelog"
              className="font-caps text-[0.62rem] uppercase tracking-[0.16em] text-gold underline underline-offset-2 transition-colors hover:text-gold-bright"
            >
              {tCommon("viewChangelog")}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
