"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Map, ChevronDown } from "lucide-react";
import { ASSETS_PATHS, GAME_INFO } from "@/lib/constants";

export default function HeroSection() {
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
  );
}

