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
        <div className="absolute inset-0 bg-linear-to-r from-ink/90 via-ink/70 to-ink/90" />
        <div className="absolute inset-0 bg-linear-to-t from-ink via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold mb-6 bg-linear-to-r from-gold-bright via-gold to-gold-bright bg-clip-text text-transparent [text-shadow:0_2px_30px_rgba(0,0,0,0.4)]">
            {t("heroTitle")}
          </h1>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-8 text-parch">
            {t("heroSubtitle", { gameName: GAME_INFO.name })}
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-parch/85 mb-8 max-w-3xl mx-auto leading-relaxed">
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
                className="dna-shine inline-flex items-center justify-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-8 py-4 font-medium text-gold-bright transition-all duration-200 hover:border-gold-bright hover:text-[#fff6e6]"
              >
                <Map className="w-5 h-5" />
                {t("heroCta")}
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-gold" />
      </div>

      {/* Psyche build teaser — bottom-right, scrolls to #build-showcase */}
      <motion.a
        href="#build-showcase"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        whileHover={{ scale: 1.04 }}
        className="group absolute bottom-6 right-4 z-20 hidden items-center gap-3 rounded-sm border border-gold/30 bg-ink/80 p-2 pr-4 shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-colors hover:border-gold/60 sm:flex"
        aria-label="Voir un exemple de carte de build (Psyche)"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-gold/40 bg-gold/10">
          <Image
            src="/assets/characters/head/T_Head_Saiqi.png"
            alt="Psyche"
            fill
            sizes="56px"
            className="object-cover"
          />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-gold/50 bg-gold text-parch shadow-md">
            <FileImage className="h-3 w-3" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
            Nouveau · Cartes de build
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-parch">
            Exemple avec Psyche
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </motion.a>
    </section>
  );
}

