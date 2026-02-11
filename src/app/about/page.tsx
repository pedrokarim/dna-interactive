import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import {
  SITE_CONFIG,
  ASSETS_PATHS,
  NAVIGATION,
  CONTACT_INFO,
  CREATOR_INFO,
  LEGAL_INFO,
  GAME_INFO,
  TEAM_INFO,
  PROJECT_STATS,
} from "@/lib/constants";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  {}: {},
  parent: ResolvingMetadata
): Promise<Metadata> {
  return generatePageMetadata(pageMetadata.about, parent);
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-950 via-slate-900 to-indigo-950 text-white">
      {/* Header */}
      <header className="relative z-50 bg-slate-950/80 backdrop-blur-sm border-b border-indigo-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href={NAVIGATION.home} className="flex items-center gap-3">
              <img
                src={ASSETS_PATHS.logo}
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

            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href={NAVIGATION.home}
                className="text-gray-300 hover:text-indigo-400 transition-colors"
              >
                Accueil
              </Link>
              <Link
                href={NAVIGATION.map}
                className="text-gray-300 hover:text-indigo-400 transition-colors"
              >
                Carte Interactive
              </Link>
              <Link
                href={NAVIGATION.support}
                className="text-gray-300 hover:text-indigo-400 transition-colors"
              >
                Support
              </Link>
              <Link
                href={NAVIGATION.contact}
                className="text-gray-300 hover:text-indigo-400 transition-colors"
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">
                À propos de {SITE_CONFIG.name}
              </h1>
              <p className="text-xl text-gray-400">
                Notre mission : faciliter l'exploration de {GAME_INFO.name}
              </p>
            </div>

            <div className="space-y-12">
              {/* Project Origin */}
              <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
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
                  <h3 className="text-2xl font-semibold text-white">
                    L'origine du projet
                  </h3>
                </div>
                <p className="text-gray-300 leading-relaxed mb-4">
                  {SITE_CONFIG.name} est né de la passion d'un joueur pour{" "}
                  <strong>{GAME_INFO.name}</strong>, un jeu d'aventure captivant
                  développé par{" "}
                  <a
                    href={CONTACT_INFO.ascencia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    Ascencia
                  </a>
                  . Face à l'immensité du monde de jeu et à la complexité de son
                  exploration, nous avons décidé de créer un outil pour aider
                  les joueurs à naviguer plus efficacement.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Notre objectif est simple : fournir une carte interactive
                  complète et intuitive qui permette à tous les joueurs de
                  découvrir les secrets cachés de {GAME_INFO.name}
                  sans se perdre dans ce monde mystérieux et fascinant.
                </p>
              </div>

              {/* What we offer */}
              <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-white">
                    Ce que nous proposons
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <svg
                        className="w-5 h-5 text-indigo-400 mt-1 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                      <div>
                        <h4 className="text-white font-medium">
                          Carte Interactive Complète
                        </h4>
                        <p className="text-gray-400 text-sm">
                          6 régions entièrement cartographiées avec navigation
                          fluide
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <svg
                        className="w-5 h-5 text-indigo-400 mt-1 shrink-0"
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
                      <div>
                        <h4 className="text-white font-medium">
                          Système de Marqueurs
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Suivi automatique de votre progression d'exploration
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <svg
                        className="w-5 h-5 text-indigo-400 mt-1 shrink-0"
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
                      <div>
                        <h4 className="text-white font-medium">
                          Filtres Avancés
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Catégorisation par type de contenu (coffres, PNJ,
                          points d'intérêt)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <svg
                        className="w-5 h-5 text-indigo-400 mt-1 shrink-0"
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
                      <div>
                        <h4 className="text-white font-medium">
                          Interface Responsive
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Compatible desktop et mobile pour une accessibilité
                          maximale
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <svg
                        className="w-5 h-5 text-indigo-400 mt-1 shrink-0"
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
                      <div>
                        <h4 className="text-white font-medium">
                          Fait avec Passion
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Projet communautaire créé par et pour les joueurs
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <svg
                        className="w-5 h-5 text-indigo-400 mt-1 shrink-0"
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
                      <div>
                        <h4 className="text-white font-medium">
                          Continuellement Mis à Jour
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Évolution constante basée sur les retours de la
                          communauté
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team */}
              <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-white">
                    L'équipe
                  </h3>
                </div>

                <div className="text-center">
                  {TEAM_INFO.members.map((member, index) => (
                    <div
                      key={index}
                      className="bg-linear-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-6 inline-block"
                    >
                      <div className="w-20 h-20 bg-linear-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-10 h-10 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-xl font-semibold text-white mb-1">
                        {member.name}
                      </h4>
                      <p className="text-indigo-400 font-medium mb-2">
                        aka {member.nickname}
                      </p>
                      <p className="text-gray-400 text-sm">{member.role}</p>
                    </div>
                  ))}

                  {TEAM_INFO.members.map((member, index) => (
                    <p
                      key={index}
                      className="text-gray-300 mt-6 leading-relaxed"
                    >
                      {member.description
                        .replace("DNA Interactive", SITE_CONFIG.name)
                        .replace("Duet Night Abyss", GAME_INFO.name)}
                    </p>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center shrink-0 mt-1">
                    <svg
                      className="w-5 h-5 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-semibold mb-2">
                      Avis Important
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      <strong className="text-white">
                        {SITE_CONFIG.name} n'est en aucun cas affilié ou lié au
                        créateur du jeu {GAME_INFO.name}.
                      </strong>
                      Ce site est un projet communautaire indépendant créé par
                      des fans pour des fans. Toutes les données et ressources
                      utilisées proviennent de sources publiques et respectent
                      les droits d'auteur et les conditions d'utilisation du jeu
                      original.
                    </p>
                    <p className="text-gray-400 text-sm mt-3">
                      Pour plus d'informations sur le jeu officiel, visitez le
                      site d'
                      <a
                        href={CONTACT_INFO.ascencia.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        Ascencia
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>

              {/* Call to action */}
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-white mb-4">
                  Rejoignez la communauté !
                </h3>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                  DNA Interactive évolue grâce à vous. Partagez vos retours,
                  suggestions et expériences pour nous aider à améliorer l'outil
                  pour toute la communauté.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="https://discord.gg/rTd95UpUEb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.120.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    Discord
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-lg font-medium text-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Contact
                  </Link>
                </div>
              </div>
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
              <Link
                href={NAVIGATION.home}
                className="hover:text-indigo-400 transition-colors"
              >
                Accueil
              </Link>
              <Link
                href={NAVIGATION.map}
                className="hover:text-indigo-400 transition-colors"
              >
                Carte Interactive
              </Link>
              <Link
                href={NAVIGATION.support}
                className="hover:text-indigo-400 transition-colors"
              >
                Support
              </Link>
              <Link
                href={NAVIGATION.contact}
                className="hover:text-indigo-400 transition-colors"
              >
                Contact
              </Link>
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
            <p className="mt-3">
              <Link
                href="/changelog"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                📋 Voir le changelog
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
