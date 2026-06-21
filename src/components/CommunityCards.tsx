"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { DnaCornerBrackets } from "@/components/dna/CornerBrackets";

const PRIMARY_BTN =
  "dna-shine inline-flex items-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-6 py-3 text-sm font-medium text-gold-bright transition-all duration-200 hover:-translate-y-px hover:border-gold-bright hover:text-[#fff6e6]";
const GHOST_BTN =
  "inline-flex items-center gap-2 rounded-sm border border-white/20 bg-gradient-to-b from-panel/70 to-ink/70 px-6 py-3 text-sm font-medium text-parch transition-all duration-200 hover:-translate-y-px hover:border-white/45 hover:text-white";

export default function CommunityCards() {
  const t = useTranslations("community");
  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      {/* Streamer Card */}
      <motion.div
        className="group relative border border-line/25 bg-panel/85 p-8 backdrop-blur-sm transition-colors duration-300 hover:border-gold/40"
        whileHover={{ y: -5 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <DnaCornerBrackets size={16} className="opacity-30 transition-opacity group-hover:opacity-70" />
        <div className="mb-6 flex items-center gap-4">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img
              src="/assets/images/ffee63d2-5cba-4a8f-910f-7b67f97ccc96-profile_image-70x70.png"
              alt="Velkaine - Streamer et créateur de contenu pour Duet Night Abyss"
              width={64}
              height={64}
              loading="lazy"
              className="h-16 w-16 rounded-full border-2 border-gold/40 transition-colors group-hover:border-gold"
            />
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-crimson-bright">
              <svg className="h-3 w-3 text-parch" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </motion.div>
          <div>
            <h3 className="font-display text-xl text-parch transition-colors group-hover:text-gold">
              {t("streamerName")}
            </h3>
            <p className="text-sm text-muted">{t("streamerRole")}</p>
          </div>
        </div>
        <p className="mb-6 leading-relaxed text-parch/85">{t("streamerDescription")}</p>
        <a href="https://www.twitch.tv/velkaine" target="_blank" rel="noopener noreferrer" className={GHOST_BTN}>
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
          </svg>
          {t("streamerCta")}
        </a>
      </motion.div>

      {/* Wiki Card */}
      <motion.div
        className="group relative border border-line/25 bg-panel/85 p-8 backdrop-blur-sm transition-colors duration-300 hover:border-gold/40"
        whileHover={{ y: -5 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{ once: true }}
      >
        <DnaCornerBrackets size={16} className="opacity-30 transition-opacity group-hover:opacity-70" />
        <div className="mb-6 flex items-center gap-4">
          <motion.div
            className="grid h-16 w-16 place-items-center border border-gold/30 bg-gold/10 text-gold transition-colors group-hover:border-gold/60 group-hover:text-gold-bright"
            whileHover={{ rotate: 5 }}
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.6}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </motion.div>
          <div>
            <h3 className="font-display text-xl text-parch transition-colors group-hover:text-gold">
              {t("wikiTitle")}
            </h3>
            <p className="text-sm text-muted">{t("wikiRole")}</p>
          </div>
        </div>
        <p className="mb-6 leading-relaxed text-parch/85">{t("wikiDescription")}</p>
        <a
          href="https://docs.google.com/spreadsheets/d/1eDUiExtAhh3igmfUZG6DOU0ZlbnTaHIObCqLjLKGaQI/edit?gid=692497117#gid=692497117"
          target="_blank"
          rel="noopener noreferrer"
          className={PRIMARY_BTN}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
          </svg>
          {t("wikiCta")}
        </a>
      </motion.div>
    </div>
  );
}
