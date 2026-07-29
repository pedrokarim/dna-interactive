"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Swords } from "lucide-react";
import { useTranslations } from "next-intl";

type CharKey = "ada" | "hilda" | "nvzhu02" | "nanzhu02";

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
  // Ada en vedette (position 0 = active par d\u00E9faut au chargement) \u2014 Hydro,
  // sortie 28 juillet 2026 avec la 1.5 "Paradise Prelude". Obtenue gratuitement
  // via le Th\u00E9\u00E2tre immersif ; arme signature The Best Day.
  // ATTENTION au nom : l'interne dans Char.lua est "Eve" (d'o\u00F9 le slug
  // char-eve), mais le jeu lui donne un nom DIFF\u00C9RENT par langue \u2014
  // "Ada" en EN/FR, Yvaine en DE, Eve en ES. Ne pas "corriger" en Eve.
  // Visuels d\u00E9riv\u00E9s du bust FModel (T_Bust_Eve.png) sous official-v1.5/.
  {
    id: "char-eve",
    slug: "char-eve",
    key: "ada",
    name: "Ada",
    decoText: "\u827E\u9EDB",
    fullImage: "/assets/official-v1.5/image-ada.webp",
    fullImageMobile: "/assets/official-v1.5/image-ada-mobile.webp",
    avatar: "/assets/official-v1.5/avatar-ada.webp",
    element: "Hydro",
    accentColor: "cyan",
    ringColor: "ring-hydro",
  },
  // Hilda \u2014 vedette de la 1.4, repli\u00E9e sous Ada. Pyro,
  // sortie 30 juin 2026 (patch 1.4 phase 2). Pas de marketing officiel : on
  // utilise le bust FModel re-encode en WebP (cf. official-v1.4/).
  {
    id: "char-xier",
    slug: "hilda",
    key: "hilda",
    name: "Hilda",
    decoText: "\u5E0C\u513F",
    fullImage: "/assets/official-v1.4/image-hilda.webp",
    fullImageMobile: "/assets/official-v1.4/image-hilda-mobile.webp",
    avatar: "/assets/official-v1.4/avatar-hilda.webp",
    element: "Pyro",
    accentColor: "rose",
    ringColor: "ring-crimson-bright",
  },
  // Flora est sortie du showcase \u00E0 l'arriv\u00E9e d'Ada (1.5) : on garde 4 entr\u00E9es,
  // les plus r\u00E9centes. Ses visuels restent sous official-v1.4/ si on veut la
  // remettre. NB : official-v1.3/image-fs.webp = Fushu, PAS Flora.
  // Formes Umbro du Phoxhunter (protagoniste) \u2014 d\u00E9bloqu\u00E9es via la narration
  // du patch 1.4 "Silver Torrent, Rising Star". Pas de marketing officiel
  // d\u00E9di\u00E9, on utilise les busts FModel re-encod\u00E9s en WebP (cf. official-v1.4/).
  // Le nom interne dans Char.lua est Nvzhu02 (f\u00E9minin) / Nanzhu02 (masculin) ;
  // les libell\u00E9s affich\u00E9s reprennent ceux du jeu, via `characterShowcase.*.name`.
  {
    id: "char-nvzhu02",
    slug: "char-nvzhu02",
    key: "nvzhu02",
    name: "Female Protagonist",
    decoText: "\u5973\u4E3B\u00B7\u6697",
    fullImage: "/assets/official-v1.4/image-nvzhu02.webp",
    fullImageMobile: "/assets/official-v1.4/image-nvzhu02-mobile.webp",
    avatar: "/assets/official-v1.4/avatar-nvzhu02.webp",
    element: "Umbro",
    accentColor: "cyan",
    ringColor: "ring-hydro",
  },
  {
    id: "char-nanzhu02",
    slug: "char-nanzhu02",
    key: "nanzhu02",
    name: "Male Protagonist",
    decoText: "\u7537\u4E3B\u00B7\u6697",
    fullImage: "/assets/official-v1.4/image-nanzhu02.webp",
    fullImageMobile: "/assets/official-v1.4/image-nanzhu02-mobile.webp",
    avatar: "/assets/official-v1.4/avatar-nanzhu02.webp",
    element: "Umbro",
    accentColor: "amber",
    ringColor: "ring-gold",
  },
];

// Color mappings pour éviter les classes Tailwind dynamiques non-purgées
const ACCENT_STYLES: Record<string, { text: string; border: string; subtitleText: string }> = {
  amber: { text: "text-gold", border: "border-gold/30", subtitleText: "text-gold/90" },
  indigo: { text: "text-gold", border: "border-gold/30", subtitleText: "text-gold/90" },
  cyan: { text: "text-hydro", border: "border-hydro/30", subtitleText: "text-hydro/90" },
  rose: { text: "text-crimson-bright", border: "border-crimson/30", subtitleText: "text-crimson-bright/90" },
};

export default function NewCharactersBanner() {
  const tc = useTranslations("newCharacters");
  const tShowcase = useTranslations("characterShowcase");
  const [activeIndex, setActiveIndex] = useState(0);

  const active = SHOWCASE_CHARACTERS[activeIndex];
  const styles = ACCENT_STYLES[active.accentColor];
  // Nom, sous-titre, description et faction suivent la langue du site. Le nom
  // varie d'une langue à l'autre dans le jeu (Ada en FR/EN, Yvaine en DE,
  // Eve en ES) : la constante `name` ne sert plus que de repli.
  const activeName = tShowcase(`${active.key}.name`) || active.name;

  const badgeRow = (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full">
        <Sparkles className="w-3.5 h-3.5 text-parch/70" />
        <span className="text-xs font-semibold text-parch/70 uppercase tracking-widest">
          {tc("badge")}
        </span>
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
              ? `${char.ringColor} ring-2 ring-offset-2 ring-offset-ink border-white/70 scale-110`
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
              alt={activeName}
              fill
              className="object-contain object-center"
              priority
              sizes="150vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* z-[1]: Smooth gradient from dark left to transparent right — no hard cut */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-ink from-0% via-ink/80 via-30% to-transparent to-70%" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-ink/60 via-transparent to-ink/30" />

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
            <span className="text-[14rem] lg:text-[18rem] font-black text-parch leading-none whitespace-nowrap block">
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
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-parch mb-2 tracking-tight leading-none">
                {activeName}
              </h2>
              <p className={`text-lg md:text-xl font-semibold ${styles.subtitleText} mb-2`}>
                {tShowcase(`${active.key}.subtitle`)}
              </p>
              <div className="flex items-center gap-3 text-sm text-parch/40 mb-6">
                <span>{active.element}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{tShowcase(`${active.key}.camp`)}</span>
              </div>
              <p className="text-sm md:text-base text-muted leading-relaxed italic max-w-md">
                &ldquo;{tShowcase(`${active.key}.description`)}&rdquo;
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Link
                  href={`/characters/${active.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 hover:border-white/30 rounded-lg text-sm font-medium text-parch transition-all duration-300"
                >
                  {tc("viewCharacter")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/characters/${active.slug}?tab=build`}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 backdrop-blur-sm border rounded-lg text-sm font-semibold text-parch transition-all duration-300 ${styles.border} bg-white/[0.08] hover:bg-white/20 hover:border-white/40`}
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
        <div className="absolute bottom-0 left-0 right-0 h-24 z-[3] bg-gradient-to-t from-panel to-transparent pointer-events-none" />
      </section>

      {/* ============================ MOBILE LAYOUT ============================ */}
      <section
        className="relative w-full overflow-hidden md:hidden bg-gradient-to-b from-ink via-panel/60 to-ink flex flex-col"
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
            <span className="text-[16rem] font-black text-parch leading-none whitespace-nowrap">
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
                  alt={activeName}
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
              <h2 className="text-4xl font-extrabold text-parch mb-1 tracking-tight leading-none">
                {activeName}
              </h2>
              <p className={`text-base font-semibold ${styles.subtitleText} mb-1`}>
                {tShowcase(`${active.key}.subtitle`)}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-parch/40 mb-3">
                <span>{active.element}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{tShowcase(`${active.key}.camp`)}</span>
              </div>
              <p className="text-sm text-muted leading-relaxed italic px-2">
                &ldquo;{tShowcase(`${active.key}.description`)}&rdquo;
              </p>
              <Link
                href={`/characters/${active.slug}`}
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 rounded-lg text-sm font-medium text-parch transition-all duration-300"
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
