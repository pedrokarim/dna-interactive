"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import { changelogData } from "@/lib/changelogData";
import { typeConfig } from "@/lib/changelogConfig";

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-950 via-slate-900 to-indigo-950 text-white">
      {/* Header */}
      <header className="relative z-50 bg-slate-950/80 backdrop-blur-sm border-b border-indigo-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/assets/images/logo_optimized.png"
                alt={`${SITE_CONFIG.name} Logo`}
                className="h-10 w-auto"
              />
              <div>
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                  {SITE_CONFIG.name}
                </div>
                <p className="text-xs text-gray-400">{SITE_CONFIG.tagline}</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Changelog
                </h1>
                <p className="text-gray-300 text-lg">
                  Historique des modifications et améliorations
                </p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-8">
            {changelogData.map((entry, index) => {
              const config = typeConfig[entry.type];
              const IconComponent = config.icon;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border ${config.borderColor} rounded-xl p-6 hover:border-indigo-400/40 transition-all duration-300`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-12 h-12 bg-linear-to-br ${config.color} rounded-lg flex items-center justify-center shrink-0`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-white">
                          {entry.title}
                        </h2>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} border ${config.borderColor} text-white`}
                        >
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <span className="font-semibold text-indigo-400">
                            v{entry.version}
                          </span>
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(entry.date).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-4 leading-relaxed">
                        {entry.description}
                      </p>
                    </div>
                  </div>

                  <div className="ml-16 space-y-2">
                    {entry.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-start gap-3 text-gray-300"
                      >
                        <span className="text-indigo-400 mt-1 shrink-0">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer de la page */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 text-center"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg font-semibold text-white transition-all duration-300 shadow-lg shadow-indigo-500/25"
            >
              ← Retour à l'accueil
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-indigo-500/20 py-12 mt-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <img
                src="/assets/ui/duet-logo-white.png"
                alt={`${SITE_CONFIG.name} Logo`}
                className="h-8 w-auto"
              />
              <span className="text-white font-semibold">
                {SITE_CONFIG.name}
              </span>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link
                href="/"
                className="hover:text-indigo-400 transition-colors"
              >
                Accueil
              </Link>
              <Link
                href="/map"
                className="hover:text-indigo-400 transition-colors"
              >
                Carte Interactive
              </Link>
              <Link
                href="/codes"
                className="hover:text-indigo-400 transition-colors"
              >
                Codes de Rédemption
              </Link>
              <Link
                href="/about"
                className="hover:text-indigo-400 transition-colors"
              >
                À propos
              </Link>
              <Link
                href="/support"
                className="hover:text-indigo-400 transition-colors"
              >
                Support
              </Link>
              <Link
                href="/contact"
                className="hover:text-indigo-400 transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-indigo-500/10 text-center text-sm text-gray-500">
            <p>
              © 2025 {SITE_CONFIG.name}. Créé par Ahmed Karim aka PedroKarim
              avec ❤️
            </p>
            <p className="mt-2">
              Ce site n'est pas affilié ou lié au créateur du jeu Duet Night
              Abyss.
              <a
                href="https://ascencia.re/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 ml-1"
              >
                Ascencia
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
