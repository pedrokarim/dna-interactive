import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG, ASSETS_PATHS, NAVIGATION, CONTACT_INFO, CREATOR_INFO, LEGAL_INFO, SUPPORT_INFO, FAQ_ITEMS, SUPPORT_QUICK_LINKS } from "@/lib/constants";
import { getSupportMetadata } from "@/lib/metadata";

// Métadonnées SEO pour la page support
export const metadata: Metadata = getSupportMetadata();

export default function SupportPage() {
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
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  {SITE_CONFIG.name}
                </h1>
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
                href={NAVIGATION.about}
                className="text-gray-300 hover:text-indigo-400 transition-colors"
              >
                À propos
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

      {/* Support Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Support & Aide</h2>
              <p className="text-xl text-gray-400">
                Besoin d'aide ? Trouvez toutes les ressources pour vous accompagner !
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Discord Support */}
              <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-8 hover:border-indigo-400/40 transition-all duration-300">
                <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.120.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Communauté Discord</h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Rejoignez notre serveur Discord pour obtenir de l'aide en temps réel,
                  discuter avec d'autres joueurs et rester informé des dernières mises à jour.
                </p>
                <div className="space-y-4">
                  <a
                    href={CONTACT_INFO.discord.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-white transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.120.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    {CONTACT_INFO.discord.label}
                  </a>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• Assistance technique en temps réel</p>
                    <p>• Discussions avec la communauté</p>
                    <p>• Annonces de mises à jour</p>
                  </div>
                </div>
              </div>

              {/* Email Support */}
              <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-8 hover:border-indigo-400/40 transition-all duration-300">
                <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Support par Email</h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Pour les demandes plus complexes, les rapports de bugs détaillés
                  ou les suggestions d'amélioration, contactez-nous par email.
                </p>
                <div className="space-y-4">
                  <a
                    href={`mailto:${CONTACT_INFO.email}`}
                    className="inline-flex items-center justify-center w-full px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-lg font-medium text-white transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {CONTACT_INFO.email}
                  </a>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• Temps de réponse : 24-48h</p>
                    <p>• Pour les bugs détaillés</p>
                    <p>• Suggestions d'amélioration</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-16 bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-8">
              <h3 className="text-2xl font-semibold text-white mb-8 text-center">Questions Fréquentes</h3>

              <div className="grid md:grid-cols-2 gap-8">
                {FAQ_ITEMS.map((faq, index) => (
                  <div key={index}>
                    <h4 className="text-lg font-medium text-white mb-3">{faq.question}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Links Section */}
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              {SUPPORT_QUICK_LINKS.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-lg p-6 hover:border-indigo-400/40 transition-all duration-300 text-center"
                >
                  <h4 className="text-lg font-medium text-white mb-2">{link.label}</h4>
                  <p className="text-sm text-gray-400">{link.description}</p>
                </a>
              ))}
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
              <span className="text-white font-semibold">{SITE_CONFIG.name}</span>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link href={NAVIGATION.home} className="hover:text-indigo-400 transition-colors">
                Accueil
              </Link>
              <Link href={NAVIGATION.map} className="hover:text-indigo-400 transition-colors">
                Carte Interactive
              </Link>
              <Link href={NAVIGATION.about} className="hover:text-indigo-400 transition-colors">
                À propos
              </Link>
              <Link href={NAVIGATION.contact} className="hover:text-indigo-400 transition-colors">
                Contact
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-indigo-500/10 text-center text-sm text-gray-500">
            <p>{LEGAL_INFO.copyright}</p>
            <p className="mt-2">
              {LEGAL_INFO.disclaimer}
              <a href={CONTACT_INFO.ascencia.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 ml-1">
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
