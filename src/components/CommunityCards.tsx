"use client";

import { motion } from "framer-motion";

export default function CommunityCards() {
  return (
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
              alt="Velkaine - Streamer et créateur de contenu pour Duet Night Abyss"
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
  );
}

