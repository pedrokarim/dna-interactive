import type { Metadata } from "next";
import Link from "next/link";
import { Map, Home, Search } from "lucide-react";
import { ASSETS_PATHS, SITE_CONFIG } from "@/lib/constants";
import { DnaDivider } from "@/components/dna/Divider";
import { DnaCornerBrackets } from "@/components/dna/CornerBrackets";

export const metadata: Metadata = {
  title: "Page introuvable - 404 | DNA Interactive",
  description:
    "La page que vous cherchez n'existe pas ou a été déplacée. Retour à la carte interactive Duet Night Abyss.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-ink via-panel to-ink px-6 text-parch">
      <div className="relative w-full max-w-2xl border border-line/25 bg-panel/60 px-8 py-14 text-center backdrop-blur-sm">
        <DnaCornerBrackets size={20} className="opacity-50" />
        <img
          src={ASSETS_PATHS.logo}
          alt={`${SITE_CONFIG.name} Logo`}
          width={88}
          height={88}
          className="mx-auto mb-6 h-20 w-auto opacity-90"
        />
        <p className="mb-2 bg-linear-to-r from-gold via-electro to-gold bg-clip-text font-display text-7xl font-semibold text-transparent md:text-9xl">
          404
        </p>
        <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold/80">Erreur</p>
        <h1 className="mt-2 font-display text-3xl text-parch md:text-4xl">Page introuvable</h1>
        <DnaDivider className="mx-auto mt-5 max-w-[12rem]" />
        <p className="mt-5 text-lg text-parch/85">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <p className="mt-1 text-sm text-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="dna-shine inline-flex items-center justify-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-6 py-3 font-medium text-gold-bright transition-all duration-200 hover:-translate-y-px hover:border-gold-bright hover:text-[#fff6e6]"
          >
            <Home className="h-5 w-5" />
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/20 bg-gradient-to-b from-panel/70 to-ink/70 px-6 py-3 font-medium text-parch transition-all duration-200 hover:-translate-y-px hover:border-white/45 hover:text-white"
          >
            <Map className="h-5 w-5" />
            Carte interactive
          </Link>
          <Link
            href="/items"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/20 bg-gradient-to-b from-panel/70 to-ink/70 px-6 py-3 font-medium text-parch transition-all duration-200 hover:-translate-y-px hover:border-white/45 hover:text-white"
          >
            <Search className="h-5 w-5" />
            Items
          </Link>
        </div>
      </div>
    </main>
  );
}
