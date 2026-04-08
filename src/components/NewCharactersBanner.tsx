"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Globe } from "lucide-react";

const SHOWCASE_CHARACTERS = [
  {
    id: "char-suyi",
    name: "Su Yi",
    subtitle: { fr: "Plumes de l'Aube Dor\u00e9e", en: "Plumes of Gilded Dawn" },
    decoText: "\u7D20\u8863",
    description: {
      fr: "Un poisson ne devrait pas \u00eatre enferm\u00e9 dans un bassin\u00a0; un oiseau est n\u00e9 pour traverser le ciel. Portant des r\u00eaves inachev\u00e9s \u2014 et les rancunes qui s'y m\u00ealent \u2014 elle fend l'horizon, indomptable.",
      en: "A fish should not be caged in a pond; a bird was born to soar across the sky. Carrying unfinished dreams\u2014and the grudges entangled with them\u2014she cuts through the horizon, unyielding.",
    },
    fullImage: "/assets/official-v1.3/image-sy.webp",
    avatar: "/assets/official-v1.3/avatar-sy.webp",
    element: "Lumino",
    camp: "Huaxu",
    accentColor: "cyan",
    ringColor: "ring-cyan-400",
  },
  {
    id: "char-kami",
    name: "Camilla",
    subtitle: { fr: "Nectar \u00c9carlate", en: "Scarlet Nectar" },
    decoText: "\u5361\u7C73\u62C9",
    description: {
      fr: "Bienvenue \u2014 l'Asph\u00f2dele accueille tous ceux qui s'\u00e9garent ici. Tout ce que vous d\u00e9sirez a son juste prix\u00a0: vin fin, secrets, tr\u00e9sors, faveurs interdites\u2026 m\u00eame un chemin vers la \u00ab\u00a0libert\u00e9\u00a0\u00bb.",
      en: "Welcome\u2014The Asphodel shelters all who wander here. Everything you desire has its proper price: fine wine, secrets, treasures, forbidden favors\u2026 even a path towards \u201Cfreedom.\u201D",
    },
    fullImage: "/assets/official-v1.3/image-kml.webp",
    avatar: "/assets/official-v1.3/avatar-kml.webp",
    element: "Pyro",
    camp: { fr: "Empire Hyperbor\u00e9en", en: "Hyperborean Empire" },
    accentColor: "rose",
    ringColor: "ring-rose-400",
  },
  {
    id: "char-yuming",
    name: "Yuming",
    subtitle: { fr: "Prisonnier sans P\u00e9ch\u00e9", en: "Sinless Cagedman" },
    decoText: "\u7FBD\u660E",
    description: {
      fr: "Li\u00e9 par le devoir, mais assoiff\u00e9 d'une v\u00e9rit\u00e9 enfouie sous des couches de loi et de silence. La cage qu'il porte n'est pas de fer \u2014 elle est tiss\u00e9e des serments qu'il refuse de briser.",
      en: "Bound by duty, yet yearning for a truth buried beneath layers of law and silence. The cage he carries is not made of iron\u2014it is woven from the oaths he refuses to break.",
    },
    fullImage: "/assets/official-v1.3/image-ym.webp",
    avatar: "/assets/official-v1.3/avatar-ym.webp",
    element: "Electro",
    camp: "Huaxu",
    accentColor: "indigo",
    ringColor: "ring-indigo-400",
  },
  {
    id: "char-zhiliu",
    name: "Zhiliu",
    subtitle: { fr: "Confluence du Kairos", en: "Confluence of Kairos" },
    decoText: "\u77E5\u7559",
    description: {
      fr: "Le temps se plie \u00e0 son commandement \u2014 mais m\u00eame sa ma\u00eetresse ne peut fuir le destin. Entre les battements des instants, Zhiliu tisse les fils de la causalit\u00e9, chacun un pari contre l'in\u00e9vitable.",
      en: "Time bends at her command\u2014yet even its master cannot outrun fate. Between the ticking of moments, Zhiliu weaves threads of causality, each one a gamble against the inevitable.",
    },
    fullImage: "/assets/official-v1.3/image-zl.webp",
    avatar: "/assets/official-v1.3/avatar-zl.webp",
    element: "Electro",
    camp: "Huaxu",
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

type Lang = "fr" | "en";

function t(value: string | { fr: string; en: string }, lang: Lang): string {
  if (typeof value === "string") return value;
  return value[lang];
}

export default function NewCharactersBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lang, setLang] = useState<Lang>("fr");
  const active = SHOWCASE_CHARACTERS[activeIndex];
  const styles = ACCENT_STYLES[active.accentColor];

  return (
    <section className="relative w-full overflow-hidden" style={{ height: "85vh", minHeight: 550, maxHeight: 800 }}>
      {/* z-0: Deco calligraphy characters (lowest layer) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id + "-deco"}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 0.04, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.8 }}
          className="absolute z-0 top-1/2 left-[15%] -translate-y-1/2 select-none pointer-events-none"
        >
          <span className="text-[14rem] md:text-[20rem] lg:text-[26rem] font-black text-white leading-none whitespace-nowrap">
            {active.decoText}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* z-[1]: Dark gradient - left side for text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

      {/* z-[2]: Character full art - ABOVE the gradient */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id + "-art"}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute inset-0 z-[2]"
        >
          <Image
            src={active.fullImage}
            alt={active.name}
            fill
            className="object-contain object-right-bottom"
            priority
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* z-[3]: Content overlay - text + selectors (highest layer) */}
      <div className="relative z-[3] h-full flex flex-col justify-center px-8 md:px-16 lg:px-24">
        {/* Badge + lang toggle */}
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-white/70" />
            <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">
              Nouveaux personnages
            </span>
          </div>
          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 rounded-full transition-colors duration-200"
          >
            <Globe className="w-3.5 h-3.5 text-white/70" />
            <span className="text-xs font-semibold text-white/70 uppercase">{lang === "fr" ? "EN" : "FR"}</span>
          </button>
        </div>

        {/* Character info - animated */}
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
              {t(active.subtitle, lang)}
            </p>
            <div className="flex items-center gap-3 text-sm text-white/40 mb-6">
              <span>{active.element}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{t(active.camp, lang)}</span>
            </div>
            <p className="text-sm md:text-base text-gray-400 leading-relaxed italic max-w-md">
              &ldquo;{t(active.description, lang)}&rdquo;
            </p>
            <Link
              href={`/characters/${active.id}`}
              className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 hover:border-white/30 rounded-lg text-sm font-medium text-white transition-all duration-300"
            >
              Voir le personnage
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Character selector - right side on desktop */}
      <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 max-md:hidden">
        {SHOWCASE_CHARACTERS.map((char, index) => (
          <button
            key={char.id}
            onClick={() => setActiveIndex(index)}
            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
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

      {/* Mobile selector - bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3 md:hidden">
        {SHOWCASE_CHARACTERS.map((char, index) => (
          <button
            key={char.id}
            onClick={() => setActiveIndex(index)}
            className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
              index === activeIndex
                ? `${char.ringColor} ring-2 ring-offset-2 ring-offset-slate-950 border-white/70 scale-110`
                : "border-white/20 hover:border-white/50 opacity-50 hover:opacity-100"
            }`}
          >
            <Image
              src={char.avatar}
              alt={char.name}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Bottom fade into page */}
      <div className="absolute bottom-0 left-0 right-0 h-24 z-[3] bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
    </section>
  );
}
