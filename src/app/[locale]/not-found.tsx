import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Home } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { GlyphIcons } from "@/components/icons/GameGlyph";
import { NAVIGATION } from "@/lib/constants";
import { DnaPageMark } from "@/components/dna/PageMark";
import { LostMarker } from "@/components/not-found/LostMarker";
import { RequestedPath } from "@/components/not-found/RequestedPath";

export const metadata: Metadata = {
  // Le gabarit `%s | DNA Interactive` du layout ajoute la marque.
  title: "404",
  description: "The page you are looking for does not exist or has been moved.",
  robots: { index: false, follow: true },
};

const BUTTON_BASE =
  "dna-shine inline-flex items-center justify-center gap-2 rounded-md px-6 py-2.5 font-sans text-sm tracking-wide transition-[transform,color,border-color] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");

  const elsewhere = [
    { href: NAVIGATION.characters, label: tn("characters") },
    { href: NAVIGATION.builds, label: tn("builds") },
    { href: NAVIGATION.calendar, label: tn("calendar") },
    { href: NAVIGATION.planner, label: tn("planner") },
    { href: NAVIGATION.theatre, label: tn("theatre") },
  ];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-5xl items-center px-4 py-12 sm:px-6">
      {/* Next ne gère `metadata` que dans `global-not-found` : celui d'ici
          sert au HTML du serveur, puis le client remettait le titre du
          layout. React 19 hisse ce <title> dans le <head> et le garde. */}
      <title>{`${t("title")} | DNA Interactive`}</title>
      <div className="grid w-full items-center gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-20">
        <div className="min-w-0">
          <DnaPageMark>{t("eyebrow")}</DnaPageMark>
          <h1 className="mt-4 text-balance font-display text-4xl leading-tight text-parch md:text-5xl">{t("title")}</h1>
          <p className="mt-4 max-w-prose text-base text-parch/80 md:text-lg">{t("description")}</p>
          <RequestedPath label={t("requestedPath")} />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={NAVIGATION.home}
              className={`${BUTTON_BASE} border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 text-gold-bright shadow-[inset_0_1px_0_rgba(227,205,149,0.22)] hover:border-gold-bright hover:text-gold-hover`}
            >
              <Home className="h-4 w-4" />
              {tc("backToHome")}
            </Link>
            <Link
              href={NAVIGATION.map}
              className={`${BUTTON_BASE} border border-white/20 bg-gradient-to-b from-panel/70 to-ink/70 text-parch hover:border-white/45 hover:text-white`}
            >
              <GlyphIcons.map className="h-4 w-4" />
              {t("interactiveMap")}
            </Link>
          </div>

          <nav aria-label={t("elsewhere")} className="mt-10">
            <p className="font-caps text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-parch/55">
              {t("elsewhere")}
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {elsewhere.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-parch/80 underline decoration-gold/30 underline-offset-4 transition-colors hover:text-gold-bright hover:decoration-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Sur mobile, l'illustration passe avant le texte : sinon elle
            arrivait sous les liens, hors du premier écran. */}
        <div className="order-first min-w-0 md:order-none">
          <LostMarker />
        </div>
      </div>
    </div>
  );
}
