import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import CodesList from "@/components/CodesList";

export default function CodesPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-950 via-slate-900 to-indigo-950 text-white">
      {/* Header */}
      <header className="relative z-50 bg-slate-950/80 backdrop-blur-sm border-b border-indigo-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/assets/images/logo_optimized.png"
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
              <a
                href="/"
                className="text-gray-300 hover:text-indigo-400 transition-colors"
              >
                Accueil
              </a>
              <a
                href="/map"
                className="text-gray-300 hover:text-indigo-400 transition-colors"
              >
                Carte Interactive
              </a>
              <a href="/codes" className="text-indigo-400 font-medium">
                Codes de Rédemption
              </a>
              <a
                href="/about"
                className="text-gray-300 hover:text-indigo-400 transition-colors"
              >
                À propos
              </a>
              <a
                href="/support"
                className="text-gray-300 hover:text-indigo-400 transition-colors"
              >
                Support
              </a>
              <a
                href="/contact"
                className="text-gray-300 hover:text-indigo-400 transition-colors"
              >
                Contact
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <CodesList />
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-indigo-500/20 py-12">
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
              <a href="/" className="hover:text-indigo-400 transition-colors">
                Accueil
              </a>
              <a
                href="/map"
                className="hover:text-indigo-400 transition-colors"
              >
                Carte Interactive
              </a>
              <a href="/codes" className="text-indigo-400">
                Codes de Rédemption
              </a>
              <a
                href="/about"
                className="hover:text-indigo-400 transition-colors"
              >
                À propos
              </a>
              <a
                href="/support"
                className="hover:text-indigo-400 transition-colors"
              >
                Support
              </a>
              <a
                href="/contact"
                className="hover:text-indigo-400 transition-colors"
              >
                Contact
              </a>
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
