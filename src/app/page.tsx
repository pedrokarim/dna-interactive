"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Map, ChevronDown, Gift, Info, HelpCircle, Mail } from "lucide-react";
import {
  SITE_CONFIG,
  ASSETS_PATHS,
  NAVIGATION,
  NAV_LINKS,
  FOOTER_LINKS,
  GAME_INFO,
  CONTACT_INFO,
  CREATOR_INFO,
  LEGAL_INFO,
} from "@/lib/constants";

// Mapping des icônes pour la navigation
const navIcons = {
  [NAVIGATION.map]: Map,
  [NAVIGATION.codes]: Gift,
  [NAVIGATION.about]: Info,
  [NAVIGATION.support]: HelpCircle,
  [NAVIGATION.contact]: Mail,
};

export default function Home() {
  const [currentImage, setCurrentImage] = useState(0);
  const [isButtonAnimated, setIsButtonAnimated] = useState(false);

  // Effet pour changer l'image de fond toutes les 4 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % ASSETS_PATHS.worldview.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Effet pour déclencher l'animation du bouton aléatoirement
  useEffect(() => {
    const triggerAnimation = () => {
      setIsButtonAnimated(true);
      setTimeout(() => setIsButtonAnimated(false), 6000); // Animation dure 6 secondes

      // Programmer la prochaine animation entre 10 et 20 secondes
      const nextDelay = Math.random() * 10000 + 10000; // 10-20 secondes
      setTimeout(triggerAnimation, nextDelay);
    };

    // Démarrer la première animation après 3-8 secondes
    const initialDelay = Math.random() * 5000 + 3000; // 3-8 secondes
    const timeout = setTimeout(triggerAnimation, initialDelay);

    return () => clearTimeout(timeout);
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
                  {SITE_CONFIG.name}
                </h1>
                <p className="text-xs text-gray-400">{SITE_CONFIG.tagline}</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              {NAV_LINKS.map((link) => {
                const IconComponent = navIcons[link.href];
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 text-gray-300 hover:text-indigo-400 transition-colors"
                  >
                    {IconComponent && <IconComponent className="w-4 h-4" />}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
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
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-linear-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              DNA Interactive
            </h1>
            <h2 className="text-2xl md:text-4xl font-semibold mb-8 text-gray-200">
              Carte interactive pour {GAME_INFO.name}
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Découvrez le monde mystérieux de {GAME_INFO.name} avec notre carte
              interactive complète. Explorez, marquez et maîtrisez chaque aspect
              du jeu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                animate={
                  isButtonAnimated
                    ? {
                        rotate: [0, -3, 3, -2, 2, -1, 1, 0],
                        x: [0, -1, 1, -1, 1, -0.5, 0.5, 0],
                      }
                    : {}
                }
                transition={{
                  duration: 0.8,
                  ease: "easeInOut",
                  repeat: isButtonAnimated ? 2 : 0,
                  repeatType: "reverse",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/map"
                  className="inline-flex items-center justify-center px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg font-semibold text-white transition-all duration-300 shadow-lg shadow-indigo-500/25"
                >
                  <Map className="w-5 h-5 mr-2" />
                  Explorer la Carte Interactive DNA
                </Link>
              </motion.div>
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
            <h2 className="text-4xl font-bold text-white mb-8">À propos</h2>
            <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-8">
              <p className="text-lg text-gray-300 leading-relaxed">
                {GAME_INFO.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-900/30">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-6">
                Fonctionnalités
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-colors">
                <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Carte Interactive Complète
                </h3>
                <p className="text-gray-300">
                  Carte complète couvrant les 6 régions du jeu.
                </p>
              </div>

              <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-colors">
                <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
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
                <h3 className="text-xl font-semibold text-white mb-3">
                  Système de Marqueurs
                </h3>
                <p className="text-gray-300">
                  Système de marquage pour suivre votre progression.
                </p>
              </div>

              <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-colors">
                <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
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
                <h3 className="text-xl font-semibold text-white mb-3">
                  Filtres Avancés
                </h3>
                <p className="text-gray-300">
                  Filtres avancés par catégorie d'éléments.
                </p>
              </div>

              <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-colors">
                <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
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
                <h3 className="text-xl font-semibold text-white mb-3">
                  Interface Responsive
                </h3>
                <p className="text-gray-300">
                  Interface responsive et adaptée à tous les écrans.
                </p>
              </div>

              <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-colors">
                <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Fait avec Passion
                </h3>
                <p className="text-gray-300">
                  Développé avec passion par et pour la communauté.
                </p>
              </div>

              <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-colors">
                <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
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
                <h3 className="text-xl font-semibold text-white mb-3">
                  Mises à Jour Régulières
                </h3>
                <p className="text-gray-300">
                  Mises à jour régulières selon vos retours.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
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
