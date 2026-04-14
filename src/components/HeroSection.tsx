"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ArrowRight, FileImage, Map, ChevronDown } from "lucide-react";
import { ASSETS_PATHS, GAME_INFO } from "@/lib/constants";
import { useTranslations } from "next-intl";

export default function HeroSection() {
  const t = useTranslations("home");
  const [currentImage, setCurrentImage] = useState(0);
  const [isButtonAnimated, setIsButtonAnimated] = useState(false);

  // Effet pour changer l'image de fond toutes les 4 secondes (démarre après le LCP)
  useEffect(() => {
    const start = setTimeout(() => {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % ASSETS_PATHS.worldview.length);
      }, 4000);
      return () => clearInterval(interval);
    }, 4000);

    return () => clearTimeout(start);
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
    <section className="relative min-h-screen flex items-center">
      {/* Background avec effet Ken Burns - LCP critique : on render uniquement l'image actuelle */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          key={ASSETS_PATHS.worldview[currentImage]}
          src={ASSETS_PATHS.worldview[currentImage]}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={70}
          className="object-cover object-center scale-110"
          style={{ animation: "kenBurns 16s ease-out infinite" }}
        />
        {/* Overlay sombre */}
        <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-950/70 to-slate-950/90" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-linear-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
            {t("heroTitle")}
          </h1>
          <h2 className="text-2xl md:text-4xl font-semibold mb-8 text-gray-200">
            {t("heroSubtitle", { gameName: GAME_INFO.name })}
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t("heroDescription", { gameName: GAME_INFO.name })}
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
                {t("heroCta")}
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-indigo-400" />
      </div>

      {/* Psyche build teaser — bottom-right, scrolls to #build-showcase */}
      <motion.a
        href="#build-showcase"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        whileHover={{ scale: 1.04 }}
        className="group absolute bottom-6 right-4 z-20 hidden items-center gap-3 rounded-2xl border border-indigo-400/30 bg-slate-950/80 p-2 pr-4 shadow-[0_12px_32px_rgba(15,23,42,0.6)] backdrop-blur-sm transition-colors hover:border-indigo-300/60 md:flex"
        aria-label="Voir un exemple de carte de build (Psyche)"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-indigo-400/40 bg-indigo-500/10">
          <Image
            src="/assets/characters/head/T_Head_Saiqi.png"
            alt="Psyche"
            fill
            sizes="56px"
            className="object-cover"
          />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-indigo-200/50 bg-indigo-500 text-white shadow-md">
            <FileImage className="h-3 w-3" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-300">
            Nouveau · Cartes de build
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-white">
            Exemple avec Psyche
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </motion.a>
    </section>
  );
}

