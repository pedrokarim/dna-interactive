"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Map, ChevronDown } from "lucide-react";
import {
  SITE_CONFIG,
  ASSETS_PATHS,
  NAV_LINKS,
  FOOTER_LINKS,
  GAME_INFO,
  CONTACT_INFO,
  CREATOR_INFO,
  LEGAL_INFO,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Accueil",
  description: `Découvrez ${GAME_INFO.name} avec notre carte interactive complète. Explorez, marquez vos découvertes et maîtrisez chaque recoin de cet univers fascinant.`,
  keywords: [
    ...SITE_CONFIG.keywords,
    "accueil",
    "homepage",
    "découvrir",
    "explorer",
    GAME_INFO.name,
  ],
  alternates: {
    canonical: "https://dna-interactive.ascencia.re",
  },
  openGraph: {
    title: `Accueil - ${SITE_CONFIG.name}`,
    description: `Découvrez ${GAME_INFO.name} avec notre carte interactive complète.`,
    url: "https://dna-interactive.ascencia.re",
    images: [
      {
        url: "/assets/worldview/worldview-1.webp",
        width: 1200,
        height: 630,
        alt: `Page d'accueil - ${SITE_CONFIG.name}`,
      },
    ],
  },
  twitter: {
    title: `Accueil - ${SITE_CONFIG.name}`,
    description: `Découvrez ${GAME_INFO.name} avec notre carte interactive complète.`,
    images: ["/assets/worldview/worldview-1.webp"],
  },
};

export default function Home() {
  const [currentImage, setCurrentImage] = useState(0);

  // Effet pour changer l'image de fond toutes les 4 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % ASSETS_PATHS.worldview.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-950 via-slate-900 to-indigo-950 text-white">
      {/* Header */}
      <header className="relative z-50 bg-slate-950/80 backdrop-blur-sm border-b border-indigo-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={ASSETS_PATHS.logo}
                alt={`${SITE_CONFIG.name} Logo`}
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-indigo-400">✦</span>
                  {SITE_CONFIG.name}
                  <span className="text-indigo-400">✦</span>
                </h1>
                <p className="text-xs text-gray-400">{SITE_CONFIG.tagline}</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:text-indigo-400 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Background avec effet Ken Burns */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-16000 ease-out scale-110"
            style={{
              backgroundImage: `url(${ASSETS_PATHS.worldview[currentImage]})`,
              animation: "kenBurns 16s ease-out infinite",
            }}
          />
          {/* Overlay sombre */}
          <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-950/70 to-slate-950/90" />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-linear-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Explorez {GAME_INFO.name}
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Découvrez le monde mystérieux de {GAME_INFO.name} avec notre carte
              interactive complète. Marquez vos découvertes, suivez votre
              progression et explorez chaque recoin de cet univers fascinant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/map"
                className="inline-flex items-center justify-center px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-500/25"
              >
                <Map className="w-5 h-5 mr-2" />
                Explorer la Carte
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-indigo-400" />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-4xl font-bold text-white mb-8">
              À propos de {GAME_INFO.name}
            </h3>
            <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-8">
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                {GAME_INFO.description}
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                {GAME_INFO.mapDescription}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-indigo-500/20 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <img
                src={ASSETS_PATHS.logo}
                alt={`${SITE_CONFIG.name} Logo`}
                className="h-8 w-auto"
              />
              <span className="text-white font-semibold">
                {SITE_CONFIG.name}
              </span>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-400">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-indigo-400 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-indigo-500/10 text-center text-sm text-gray-500">
            <p>{LEGAL_INFO.copyright}</p>
            <p className="mt-2">
              {LEGAL_INFO.disclaimer}
              <a
                href={CONTACT_INFO.ascencia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 ml-1"
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
