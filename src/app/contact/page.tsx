"use client";

import { useState } from "react";
import Link from "next/link";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { SITE_CONFIG, ASSETS_PATHS, NAVIGATION, CONTACT_INFO, CREATOR_INFO, LEGAL_INFO } from "@/lib/constants";

export default function ContactPage() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Vérifier si reCAPTCHA est disponible
      if (!executeRecaptcha) {
        throw new Error('reCAPTCHA n\'est pas encore chargé. Veuillez réessayer.');
      }

      // Obtenir le token reCAPTCHA
      const recaptchaToken = await executeRecaptcha('contact_form');

      // Préparer les données à envoyer
      const dataToSend = {
        ...formData,
        recaptchaToken,
      };

      // Envoyer la requête à l'API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok) {
        // Succès
        setSubmitStatus({
          type: 'success',
          message: 'Votre message a été envoyé avec succès ! Nous vous répondrons sous 24-48h.'
        });

        // Réinitialiser le formulaire
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: ""
        });
      } else {
        // Erreur
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Une erreur est survenue lors de l\'envoi du message.'
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Une erreur inattendue est survenue.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                href={NAVIGATION.support}
                className="text-gray-300 hover:text-indigo-400 transition-colors"
              >
                Support
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Contact Form Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Contactez-nous</h2>
              <p className="text-xl text-gray-400">
                Une question ou un retour ? N'hésitez pas à nous contacter !
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-8">
                <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-8">
                  <h3 className="text-2xl font-semibold text-white mb-6">Informations</h3>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-1">Email</h4>
                        <p className="text-gray-400">{CONTACT_INFO.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-1">Support</h4>
                        <p className="text-gray-400">
                          Pour le support technique, rejoignez notre Discord ou consultez la page Support
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-1">Temps de réponse</h4>
                        <p className="text-gray-400">Nous répondons généralement sous 24-48h</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-8">
                  <h3 className="text-2xl font-semibold text-white mb-4">Rejoignez notre communauté</h3>
                  <p className="text-gray-400 mb-6">
                    Pour discuter avec d'autres joueurs et obtenir de l'aide,
                    rejoignez notre serveur Discord !
                  </p>
                  <a
                    href={CONTACT_INFO.discord.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-white transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.120.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    {CONTACT_INFO.discord.label}
                  </a>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-8">
                <h3 className="text-2xl font-semibold text-white mb-6">Envoyez-nous un message</h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-slate-700/50 border border-indigo-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                        placeholder="Votre nom"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-slate-700/50 border border-indigo-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                      Sujet
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full bg-slate-700/50 border border-indigo-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                      required
                    >
                      <option value="">Sélectionnez un sujet</option>
                      <option value="bug">Signaler un bug</option>
                      <option value="suggestion">Suggestion d'amélioration</option>
                      <option value="question">Question générale</option>
                      <option value="partnership">Partenariat</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full bg-slate-700/50 border border-indigo-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none"
                      placeholder="Votre message..."
                      required
                    />
                  </div>

                  {/* Messages de statut */}
                  {submitStatus.type && (
                    <div className={`p-4 rounded-lg mb-4 ${
                      submitStatus.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                      <div className="flex items-center">
                        {submitStatus.type === 'success' ? (
                          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{submitStatus.message}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full rounded-lg py-3 px-6 font-semibold text-white transition-all duration-300 transform ${
                      isSubmitting
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Envoi en cours...
                      </div>
                    ) : (
                      'Envoyer le message'
                    )}
                  </button>
                </form>

                <p className="text-sm text-gray-500 mt-4 text-center">
                  * Tous les champs sont obligatoires. Votre message sera envoyé directement à notre équipe.
                </p>
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
              <Link href={NAVIGATION.support} className="hover:text-indigo-400 transition-colors">
                Support
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
