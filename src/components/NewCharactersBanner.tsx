"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Globe, Check, Swords } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { locales, LANGUAGE_LABELS } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

// Import statique des 7 fichiers de messages pour permettre le switch local
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";
import deMessages from "@/messages/de.json";
import esMessages from "@/messages/es.json";
import jpMessages from "@/messages/jp.json";
import krMessages from "@/messages/kr.json";
import tcMessages from "@/messages/tc.json";

const ALL_MESSAGES: Record<Locale, typeof frMessages> = {
  fr: frMessages,
  en: enMessages,
  de: deMessages as typeof frMessages,
  es: esMessages as typeof frMessages,
  jp: jpMessages as typeof frMessages,
  kr: krMessages as typeof frMessages,
  tc: tcMessages as typeof frMessages,
};

type CharKey = "kami" | "suyi" | "yuming" | "zhiliu";

const SHOWCASE_CHARACTERS: Array<{
  id: string;
  slug: string;
  key: CharKey;
  name: string;
  decoText: string;
  fullImage: string;
  fullImageMobile: string;
  avatar: string;
  element: string;
  accentColor: string;
  ringColor: string;
}> = [
  {
    id: "char-kami",
    slug: "camilla",
    key: "kami",
    name: "Camilla",
    decoText: "\u5361\u7C73\u62C9",
    fullImage: "/assets/official-v1.3/image-kml.webp",
    fullImageMobile: "/assets/official-v1.3/image-kml-mobile.webp",
    avatar: "/assets/official-v1.3/avatar-kml.webp",
    element: "Pyro",
    accentColor: "rose",
    ringColor: "ring-rose-400",
  },
  {
    id: "char-suyi",
    slug: "su-yi",
    key: "suyi",
    name: "Su Yi",
    decoText: "\u7D20\u8863",
    fullImage: "/assets/official-v1.3/image-sy.webp",
    fullImageMobile: "/assets/official-v1.3/image-sy-mobile.webp",
    avatar: "/assets/official-v1.3/avatar-sy.webp",
    element: "Lumino",
    accentColor: "cyan",
    ringColor: "ring-cyan-400",
  },
  {
    id: "char-yuming",
    slug: "yuming",
    key: "yuming",
    name: "Yuming",
    decoText: "\u7FBD\u660E",
    fullImage: "/assets/official-v1.3/image-ym.webp",
    fullImageMobile: "/assets/official-v1.3/image-ym-mobile.webp",
    avatar: "/assets/official-v1.3/avatar-ym.webp",
    element: "Electro",
    accentColor: "indigo",
    ringColor: "ring-indigo-400",
  },
  {
    id: "char-zhiliu",
    slug: "zhiliu",
    key: "zhiliu",
    name: "Zhiliu",
    decoText: "\u77E5\u7559",
    fullImage: "/assets/official-v1.3/image-zl.webp",
    fullImageMobile: "/assets/official-v1.3/image-zl-mobile.webp",
    avatar: "/assets/official-v1.3/avatar-zl.webp",
    element: "Electro",
    accentColor: "amber",
    ringColor: "ring-amber-400",
  },
];

// Color mappings pour éviter les classes Tailwind dynamiques non-purgées
const ACCENT_STYLES: Record<string, { text: string; border: string; subtitleText: string }> = {
  amber: { text: "text-amber-300", border: "border-amber-500/30", subtitleText: "text-amber-200/90" },
  indigo: { text: "text-indigo-300", border: "border-indigo-500/30", subtitleText: "text-indigo-200/90" },
  cyan: { text: "text-cyan-300", border: "border-cyan-500/30", subtitleText: "text-cyan-200/90" },
  rose: { text: "text-rose-300", border: "border-rose-500/30", subtitleText: "text-rose-200/90" },
};

export default function NewCharactersBanner() {
  const tc = useTranslations("newCharacters");
  const siteLocale = useLocale() as Locale;
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayLocale, setDisplayLocale] = useState<Locale>(siteLocale);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const active = SHOWCASE_CHARACTERS[activeIndex];
  const styles = ACCENT_STYLES[active.accentColor];
  const charData = ALL_MESSAGES[displayLocale].characterShowcase[active.key];

  const badgeRow = (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full">
        <Sparkles className="w-3.5 h-3.5 text-white/70" />
        <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">
          {tc("badge")}
        </span>
      </div>
      <div ref={langMenuRef} className="relative">
        <button
          onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 rounded-full transition-colors duration-200"
        >
          <Globe className="w-3.5 h-3.5 text-white/70" />
          <span className="text-xs font-semibold text-white/70 uppercase">{displayLocale}</span>
        </button>
        {isLangMenuOpen && (
          <div className="absolute left-0 top-full mt-2 bg-slate-900 border border-white/15 rounded-lg shadow-xl overflow-hidden z-50 min-w-[160px]">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setDisplayLocale(l);
                  setIsLangMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                  l === displayLocale
                    ? "bg-white/10 text-white font-medium"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="uppercase font-mono w-5">{l}</span>
                <span className="flex-1 text-left">{LANGUAGE_LABELS[l.toUpperCase()]}</span>
                {l === displayLocale && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const avatarStrip = (cls: string) => (
    <div className={cls}>
      {SHOWCASE_CHARACTERS.map((char, index) => (
        <button
          key={char.id}
          onClick={() => setActiveIndex(index)}
          className={`relative w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
            index === activeIndex
              ? `${char.ringColor} ring-2 ring-offset-2 ring-offset-slate-950 border-white/70 scale-110`
              : "border-white/20 hover:border-white/50 opacity-50 hover:opacity-100"
          }`}
        >
          <Image
            src={char.avatar}
            alt={char.name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* ============================ DESKTOP LAYOUT ============================ */}
      <section
        className="relative w-full overflow-hidden hidden md:flex md:flex-col"
        style={{ minHeight: "100vh" }}
      >
        {/* z-[0]: Character full art - oversized, positioned like the official site */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id + "-art"}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute z-[0] pointer-events-none"
            style={{
              left: "20%",
              top: "-30vh",
              width: "110%",
              height: "155vh",
            }}
          >
            <Image
              src={active.fullImage}
              alt={active.name}
              fill
              className="object-contain object-center"
              priority
              sizes="150vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* z-[1]: Smooth gradient from dark left to transparent right — no hard cut */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-slate-950 from-0% via-slate-950/80 via-30% to-transparent to-70%" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/30" />

        {/* z-[2]: Deco calligraphy - above gradient, subtle overlay on left */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id + "-deco"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 0.1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8 }}
            className="absolute z-[2] top-1/2 left-0 -translate-y-1/2 select-none pointer-events-none overflow-hidden w-[45%]"
          >
            <span className="text-[14rem] lg:text-[18rem] font-black text-white leading-none whitespace-nowrap block">
              {active.decoText}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* z-[3]: Content - flex-1 ensures full height so justify-center works */}
        <div className="relative z-[3] flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
          <div className="mb-6">{badgeRow}</div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.id + "-info"}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-lg"
            >
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-2 tracking-tight leading-none">
                {active.name}
              </h2>
              <p className={`text-lg md:text-xl font-semibold ${styles.subtitleText} mb-2`}>
                {charData.subtitle}
              </p>
              <div className="flex items-center gap-3 text-sm text-white/40 mb-6">
                <span>{active.element}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{charData.camp}</span>
              </div>
              <p className="text-sm md:text-base text-gray-400 leading-relaxed italic max-w-md">
                &ldquo;{charData.description}&rdquo;
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Link
                  href={`/characters/${active.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 hover:border-white/30 rounded-lg text-sm font-medium text-white transition-all duration-300"
                >
                  {tc("viewCharacter")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/characters/${active.slug}?tab=build`}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 backdrop-blur-sm border rounded-lg text-sm font-semibold text-white transition-all duration-300 ${styles.border} bg-white/[0.08] hover:bg-white/20 hover:border-white/40`}
                >
                  <Swords className="w-4 h-4" />
                  {tc("viewBuild")}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Character selector - right side */}
        {avatarStrip(
          "absolute right-6 md:right-10 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3"
        )}

        {/* Bottom fade into page */}
        <div className="absolute bottom-0 left-0 right-0 h-24 z-[3] bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
      </section>

      {/* ============================ MOBILE LAYOUT ============================ */}
      <section
        className="relative w-full overflow-hidden md:hidden bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 flex flex-col"
        style={{ minHeight: "100vh" }}
      >
        {/* Deco calligraphy - behind everything */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id + "-m-deco"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-0 flex items-center justify-center select-none pointer-events-none"
          >
            <span className="text-[16rem] font-black text-white leading-none whitespace-nowrap">
              {active.decoText}
            </span>
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 px-5 pt-6 pb-6 flex flex-col items-center flex-1 w-full">
          {/* Badge + lang toggle */}
          <div className="mb-2 flex-shrink-0">{badgeRow}</div>

          {/* Character portrait - takes all available space */}
          <div className="relative w-full flex-1 min-h-0 my-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id + "-m-art"}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={active.fullImageMobile}
                  alt={active.name}
                  fill
                  className="object-contain object-center"
                  sizes="100vw"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Info bloc */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id + "-m-info"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center w-full max-w-md flex-shrink-0"
            >
              <h2 className="text-4xl font-extrabold text-white mb-1 tracking-tight leading-none">
                {active.name}
              </h2>
              <p className={`text-base font-semibold ${styles.subtitleText} mb-1`}>
                {charData.subtitle}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-white/40 mb-3">
                <span>{active.element}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{charData.camp}</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed italic px-2">
                &ldquo;{charData.description}&rdquo;
              </p>
              <Link
                href={`/characters/${active.slug}`}
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 rounded-lg text-sm font-medium text-white transition-all duration-300"
              >
                {tc("viewCharacter")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Avatar selector at the bottom */}
          {avatarStrip("mt-5 flex gap-2.5 justify-center flex-shrink-0")}
        </div>
      </section>
    </>
  );
}
