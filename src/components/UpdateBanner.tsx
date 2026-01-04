"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Sparkles, X, MapPin } from "lucide-react";

export default function UpdateBanner() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);

  return (
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
                    <span className="font-bold">Nouvelle map disponible !</span>
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
  );
}
