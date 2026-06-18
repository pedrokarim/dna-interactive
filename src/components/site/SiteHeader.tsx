import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import {
  ASSETS_PATHS,
  NAVIGATION,
  NAV_LINKS,
  SITE_CONFIG,
} from "@/lib/constants";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MobileMenu from "@/components/MobileMenu";
import { DiscordAuthButton } from "@/components/auth/DiscordAuthButton";
import { DnaNouveau } from "@/components/dna/Badges";

/** En-tête de site — design system DNA (marque Cormorant, nav Cinzel, liseré doré). */
export default async function SiteHeader({ active }: { active?: string }) {
  const tNav = await getTranslations("nav");
  const tSite = await getTranslations("site");

  const navLabels: Record<string, string> = {
    [NAVIGATION.map]: tNav("map"),
    [NAVIGATION.items]: tNav("items"),
    [NAVIGATION.characters]: tNav("characters"),
    [NAVIGATION.builder]: tNav("builder"),
    [NAVIGATION.commissions]: tNav("commissions"),
    [NAVIGATION.codes]: tNav("codes"),
    [NAVIGATION.about]: tNav("about"),
    [NAVIGATION.support]: tNav("support"),
    [NAVIGATION.contact]: tNav("contact"),
  };

  return (
    <header className="relative z-50 border-b border-gold/20 bg-ink/85 backdrop-blur-sm">
      {/* filet doré supérieur */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
      <div className="container mx-auto px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href={NAVIGATION.home} className="group flex min-w-0 items-center gap-2 md:gap-3">
            <img
              src={ASSETS_PATHS.logo}
              alt={`${SITE_CONFIG.name} logo`}
              width={40}
              height={40}
              className="h-9 w-auto md:h-10"
            />
            <div className="min-w-0">
              <div className="truncate font-display text-xl leading-none text-parch transition-colors group-hover:text-gold-bright md:text-2xl">
                {SITE_CONFIG.name}
              </div>
              <p className="mt-1 truncate font-caps text-[0.55rem] uppercase tracking-[0.3em] text-gold/70">
                {tSite("tagline")}
              </p>
            </div>
          </Link>

          <MobileMenu authSlot={<DiscordAuthButton compact direction="up" align="start" />} />

          <div className="hidden items-center gap-4 lg:flex xl:gap-6">
            <nav className="flex items-center gap-4 xl:gap-7">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === active;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative font-caps text-[0.72rem] uppercase tracking-[0.18em] transition-colors ${
                      isActive ? "text-gold-bright" : "text-parch/80 hover:text-gold"
                    }`}
                  >
                    {navLabels[link.href] ?? link.label}
                    {link.href === NAVIGATION.commissions ? (
                      <DnaNouveau className="ml-1.5 align-middle" />
                    ) : null}
                    {isActive ? (
                      <span aria-hidden className="absolute -bottom-1.5 left-0 right-0 h-px bg-gold-bright/70" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            <LanguageSwitcher />
            <DiscordAuthButton compact />
          </div>
        </div>
      </div>
    </header>
  );
}
