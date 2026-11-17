"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Swords } from "lucide-react";
import { useTranslations } from "next-intl";

type CharKey = "flamewrought" | "falsi" | "nvzhu02" | "nanzhu02";

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
  // Rhythm: Flamewrought en premier (l'index 0 est affich\u00E9 au chargement). Electro,
  // sortie le 20 octobre 2026 avec la 1.7 "Towards the Dawn". Ancienne adjudante de
  // l'Escorte \u00E0 Icelake, obtenue via les Commissions clandestines (Th\u00E9\u00E2tre immersif
  // jusqu'au 10 novembre) ou en boutique. Visuels tir\u00E9s du buste T_Bust_SPLise.png
  // et de la vignette T_Head_SPLise.png, sous official-v1.7/.
  {
    id: "char-splise",
    slug: "rhythm-flamewrought",
    key: "flamewrought",
    name: "Rhythm: Flamewrought",
    decoText: "\u9ECE\u745F\u00B7\u6D74\u706B",
    fullImage: "/assets/official-v1.7/image-flamewrought.webp",
    fullImageMobile: "/assets/official-v1.7/image-flamewrought-mobile.webp",
    avatar: "/assets/official-v1.7/avatar-flamewrought.webp",
    element: "Electro",
    accentColor: "rose",
    ringColor: "ring-crimson-bright",
  },
  // Falsi, vedette de la 1.6, pass\u00E9e derri\u00E8re Flamewrought. Pyro, sortie le
  // 8 septembre 2026 avec "Paradise's 22nd White Bunny". Ancienne offici\u00E8re de la
  // XIIIe L\u00E9gion, adjudante de Fulvis, obtenue via les Commissions clandestines
  // (Th\u00E9\u00E2tre immersif jusqu'au 29 septembre). Visuels tir\u00E9s du buste
  // T_Bust_Falu.png, sous official-v1.6/.
  {
    id: "char-falu",
    slug: "falsi",
    key: "falsi",
    name: "Falsi",
    decoText: "\u6CD5\u9732\u831C",
    fullImage: "/assets/official-v1.6/image-falsi.webp",
    fullImageMobile: "/assets/official-v1.6/image-falsi-mobile.webp",
    avatar: "/assets/official-v1.6/avatar-falsi.webp",
    element: "Pyro",
    accentColor: "rose",
    ringColor: "ring-crimson-bright",
  },
  // Flora a quitt\u00E9 la vitrine \u00E0 l'arriv\u00E9e d'Ada (1.5), Hilda \u00E0 celle de Falsi (1.6),
  // Ada \u00E0 celle de Flamewrought (1.7). On garde 4 entr\u00E9es, les plus r\u00E9centes devant
  // les deux formes du protagoniste. Les anciens visuels restent sous official-v1.4/
  // et official-v1.5/ si on veut les remettre.
  // Attention : official-v1.3/image-fs.webp, c'est Fushu, pas Flora.
  // Formes Umbro du Phoxhunter (protagoniste), d\u00E9bloqu\u00E9es par l'histoire du patch 1.4
  // "Silver Torrent, Rising Star". Pas de visuel officiel d\u00E9di\u00E9 : on prend les bustes
  // FModel r\u00E9encod\u00E9s en WebP (official-v1.4/). Nom interne dans Char.lua : Nvzhu02
  // (f\u00E9minin) / Nanzhu02 (masculin). Les noms affich\u00E9s sont ceux du jeu, via
  // `characterShowcase.*.name`.
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

// Classes écrites en entier : Tailwind ne garde pas celles qu'on construit à la volée.
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
  // Nom, sous-titre, description et faction suivent la langue du site. Le jeu
  // change le nom selon la langue (Ada en FR/EN, Yvaine en DE, Eve en ES) :
  // `name` ne sert que de repli.
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
      {/* Mise en page bureau */}
      <section
        className="relative w-full overflow-hidden hidden md:flex md:flex-col"
        style={{ minHeight: "100vh" }}
      >
        {/* z-[0] : illustration en pied, plus grande que la section, placée comme sur le site officiel */}
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

        {/* z-[1] : dégradé du sombre à gauche vers le transparent à droite, sans bord net */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-ink from-0% via-ink/80 via-30% to-transparent to-70%" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-ink/60 via-transparent to-ink/30" />

        {/* z-[2] : calligraphie décorative à gauche, au-dessus du dégradé, très pâle */}
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

        {/* z-[3] : contenu. flex-1 pour prendre toute la hauteur, sinon justify-center ne centre rien */}
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

        {/* Choix du personnage, à droite */}
        {avatarStrip(
          "absolute right-6 md:right-10 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3"
        )}

        {/* Fondu du bas vers la page */}
        <div className="absolute bottom-0 left-0 right-0 h-24 z-[3] bg-gradient-to-t from-panel to-transparent pointer-events-none" />
      </section>

      {/* Mise en page mobile */}
      <section
        className="relative w-full overflow-hidden md:hidden bg-gradient-to-b from-ink via-panel/60 to-ink flex flex-col"
        style={{ minHeight: "100vh" }}
      >
        {/* Calligraphie décorative, derrière tout le reste */}
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
          {/* Badge */}
          <div className="mb-2 flex-shrink-0">{badgeRow}</div>

          {/* Portrait, prend toute la place restante */}
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

          {/* Infos */}
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

          {/* Choix du personnage, en bas */}
          {avatarStrip("mt-5 flex gap-2.5 justify-center flex-shrink-0")}
        </div>
      </section>
    </>
  );
}
