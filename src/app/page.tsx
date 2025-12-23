"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  ChevronDown,
  Gift,
  Info,
  HelpCircle,
  Mail,
  Sparkles,
  X,
  MapPin,
} from "lucide-react";
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
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);

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

      // Programmer la prochaine animation entre 30 et 35 secondes
      const nextDelay = Math.random() * 5000 + 30000; // 30-35 secondes
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

      {/* Update Banner v1.1 */}
      <AnimatePresence>
        {showUpdateBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-40 bg-linear-to-r from-emerald-600/90 via-teal-600/90 to-cyan-600/90 backdrop-blur-sm border-b border-emerald-400/30"
          >
            <div className="container mx-auto px-6 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  {/* Badge animé */}
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                    className="shrink-0"
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white border border-white/30">
                      <Sparkles className="w-3 h-3" />
                      v1.1
                    </span>
                  </motion.div>

                  {/* Texte */}
                  <div className="flex items-center gap-2 text-white">
                    <MapPin className="w-4 h-4 text-emerald-200 shrink-0" />
                    <p className="text-sm md:text-base font-medium">
                      <span className="font-bold">
                        Nouvelle map disponible !
                      </span>
                      <span className="hidden sm:inline">
                        {" "}
                        — Explorez{" "}
                        <span className="font-bold text-emerald-200">
                          Huaxu
                        </span>{" "}
                        avec 371 nouveaux marqueurs
                      </span>
                    </p>
                  </div>
                </div>

                {/* Bouton Explorer + Fermer */}
                <div className="flex items-center gap-2">
                  <Link
                    href="/map"
                    className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold text-white transition-all duration-200 border border-white/20 hover:border-white/40"
                  >
                    <Map className="w-4 h-4" />
                    Explorer
                  </Link>
                  <button
                    onClick={() => setShowUpdateBanner(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4 text-white/80 hover:text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Particules animées en arrière-plan */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
                  initial={{
                    x: `${Math.random() * 100}%`,
                    y: "100%",
                    opacity: 0,
                  }}
                  animate={{
                    y: "-100%",
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: i * 0.8,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Community Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-6">
                Communauté & Ressources
              </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Rejoignez la communauté DNA et accédez aux ressources créées par
                la communauté pour améliorer votre expérience de jeu.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Streamer Card */}
              <motion.div
                className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-8 hover:border-indigo-400/40 transition-all duration-300 group"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <img
                      src="/assets/images/ffee63d2-5cba-4a8f-910f-7b67f97ccc96-profile_image-70x70.png"
                      alt="Velkaine - Streamer DNA"
                      className="w-16 h-16 rounded-full border-2 border-purple-500/50 group-hover:border-purple-400 transition-colors"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">
                      Velkaine
                    </h3>
                    <p className="text-sm text-gray-400">
                      Streamer & Joueur DNA
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Suivez Velkaine en live pour découvrir ses sessions de jeu,
                  ses stratégies et ses découvertes dans le monde de DNA.
                </p>
                <a
                  href="https://www.twitch.tv/velkaine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold text-white transition-all duration-300 shadow-lg shadow-purple-500/25"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                  </svg>
                  Suivre sur Twitch
                </a>
              </motion.div>

              {/* Wiki Card */}
              <motion.div
                className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-8 hover:border-indigo-400/40 transition-all duration-300 group"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    className="w-16 h-16 bg-linear-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    whileHover={{ rotate: 5 }}
                  >
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-green-300 transition-colors">
                      Wiki Communautaire
                    </h3>
                    <p className="text-sm text-gray-400">
                      Guide complet du jeu
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Accédez au wiki communautaire complet créé par Velkaine et la
                  communauté. Toutes les informations essentielles sur DNA en un
                  seul endroit.
                </p>
                <a
                  href="https://docs.google.com/spreadsheets/d/1eDUiExtAhh3igmfUZG6DOU0ZlbnTaHIObCqLjLKGaQI/edit?gid=692497117#gid=692497117"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold text-white transition-all duration-300 shadow-lg shadow-green-500/25"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                  </svg>
                  Consulter le Wiki
                </a>
              </motion.div>
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
                  Carte complète couvrant les 7 régions du jeu.
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
