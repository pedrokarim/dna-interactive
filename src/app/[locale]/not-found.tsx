import type { Metadata } from "next";
import Link from "next/link";
import { Map, Home, Search } from "lucide-react";
import { ASSETS_PATHS, SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Page introuvable - 404 | DNA Interactive",
  description:
    "La page que vous cherchez n'existe pas ou a été déplacée. Retour à la carte interactive Duet Night Abyss.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-linear-to-br from-electro via-panel to-ink text-parch flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <img
          src={ASSETS_PATHS.logo}
          alt={`${SITE_CONFIG.name} Logo`}
          width={96}
          height={96}
          className="mx-auto h-24 w-auto mb-8 opacity-90"
        />
        <p className="text-7xl md:text-9xl font-extrabold bg-linear-to-r from-gold via-electro to-gold bg-clip-text text-transparent mb-4">
          404
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-parch mb-4">
          Page introuvable
        </h1>
        <p className="text-lg text-gray-300 mb-2">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <p className="text-sm text-gray-400 mb-10">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-gold to-electro hover:from-gold hover:to-electro rounded-lg font-semibold text-parch transition-all duration-300 shadow-lg shadow-gold/25"
          >
            <Home className="w-5 h-5" />
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-panel/70 hover:bg-white/10 border border-gold/30 rounded-lg font-semibold text-parch transition-all duration-300"
          >
            <Map className="w-5 h-5" />
            Carte interactive
          </Link>
          <Link
            href="/items"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-panel/70 hover:bg-white/10 border border-gold/30 rounded-lg font-semibold text-parch transition-all duration-300"
          >
            <Search className="w-5 h-5" />
            Items
          </Link>
        </div>
      </div>
    </main>
  );
}
