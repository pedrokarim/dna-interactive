"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { ResponsiveQuickBuildCard } from "@/components/characters/QuickBuildModal";
import { GlyphIcons } from "@/components/icons/GameGlyph";
import {
  getAllCharacters,
  getCharacterSlug,
  resolveCharacterDisplayName,
} from "@/lib/characters/catalog";
import { getCharacterBuilds } from "@/lib/characters/builds";
import releaseVersions from "@/data/characters/release-versions.json";

// ---------------------------------------------------------------------------
// BuildShowcase — carrousel « à la Twitch » des derniers personnages sortis,
// chacun avec son premier build. Carte active au centre, voisines en retrait
// sur les côtés. Défilement automatique, avec pause.
// ---------------------------------------------------------------------------

/** Nombre de personnages présentés. */
const SHOWCASE_SIZE = 6;
/** Durée d'affichage d'une carte avant la suivante. */
const AUTOPLAY_MS = 6000;

/**
 * Protagonistes : Vita (`char-protagonist-*`) et Mors (`char-weita*`), chacun
 * en femme et en homme. Ils sortent avec chaque version mais ne sont pas des
 * « nouveaux personnages » : on les écarte de la vitrine.
 */
const PROTAGONISTS = new Set([
  "char-protagonist-female",
  "char-protagonist-male",
  "char-weitaf",
  "char-weitam",
]);

const RELEASES = releaseVersions as Record<string, number>;

/** « 16 » → « 1.6 » : `OpenVersion` du jeu, en dixièmes. */
const formatVersion = (v: number) => `${Math.floor(v / 10)}.${v % 10}`;

export default function BuildShowcase() {
  const lang = useLocale().toUpperCase();
  const t = useTranslations("common");
  const tHome = useTranslations("home");
  const reduceMotion = useReducedMotion();

  // Derniers sortis d'abord (version du jeu, puis identifiant le plus récent à
  // version égale), protagonistes exclus, premier build de chacun.
  const featured = getAllCharacters()
    .filter((c) => !PROTAGONISTS.has(c.id) && RELEASES[c.id] !== undefined)
    .sort((a, b) => RELEASES[b.id] - RELEASES[a.id] || b.charId - a.charId)
    .map((character) => {
      const builds = getCharacterBuilds(character.id, lang);
      return builds[0] ? { character, build: builds[0], buildCount: builds.length, version: RELEASES[character.id] } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, SHOWCASE_SIZE);

  const count = featured.length;
  const [active, setActive] = useState(0);
  // `null` = pas encore choisi par le visiteur : on suit sa préférence de mouvement.
  const [pausedByUser, setPausedByUser] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  // Choix du visiteur (bouton) ≠ pause temporaire au survol : le bouton ne
  // pilote que le premier, sinon le cliquer (donc le survoler) relancerait tout.
  const userPaused = pausedByUser ?? Boolean(reduceMotion);
  const paused = userPaused || hovered;

  const go = useCallback((i: number) => setActive(((i % count) + count) % count), [count]);

  // Défilement automatique : la minuterie repart à chaque changement de carte,
  // donc un clic manuel laisse toujours une pleine durée à la carte choisie.
  useEffect(() => {
    if (paused || count < 2) return;
    const timer = setTimeout(() => go(active + 1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [active, paused, count, go]);

  if (count === 0) return null;

  const activeEntry = featured[active];
  const activeName = resolveCharacterDisplayName(activeEntry.character, lang);

  return (
    <section
      id="build-showcase"
      aria-roledescription="carousel"
      aria-label={tHome("showcaseTitle")}
      className="relative border-y border-line/15 bg-panel/30 py-16 md:py-20"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-6xl text-center">
          <span className="inline-flex items-center gap-1.5 border border-gold/40 bg-gold/15 px-3 py-1 font-caps text-[0.58rem] uppercase tracking-[0.22em] text-gold">
            <GlyphIcons.characters className="h-3.5 w-3.5" />
            {tHome("showcaseLatest")}
          </span>
          <h2 className="mt-4 font-display text-4xl text-parch md:text-5xl">
            {tHome("showcaseTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-parch/85 md:text-base">
            {tHome("showcaseDescription")}
          </p>
        </div>

        {/* Sélecteur de personnage : nom + version de sortie */}
        <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-center gap-2 md:gap-3">
          {featured.map((entry, i) => {
            const name = resolveCharacterDisplayName(entry.character, lang);
            const isActive = i === active;
            return (
              <button
                key={entry.character.id}
                type="button"
                onClick={() => go(i)}
                aria-pressed={isActive}
                className={`inline-flex items-center gap-2 rounded-sm border px-4 py-2 font-caps text-[0.7rem] uppercase tracking-[0.14em] transition-all duration-200 ${
                  isActive
                    ? "border-gold bg-gold/15 text-gold-bright"
                    : "border-white/12 bg-panel/60 text-parch/80 hover:border-gold/40 hover:text-parch"
                }`}
              >
                {name}
                <span className="font-mono text-[0.6rem] normal-case tracking-normal text-muted">
                  {formatVersion(entry.version)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Carrousel : active au centre, voisines en retrait */}
      <div className="relative mt-8 w-full overflow-hidden md:mt-10">
        <div className="relative mx-auto flex h-[160px] items-center justify-center sm:h-[272px] md:h-[328px] lg:h-[440px] xl:h-[580px]">
          {featured.map((entry, i) => {
            // Décalage circulaire : la dernière carte jouxte la première.
            let offset = i - active;
            if (offset > count / 2) offset -= count;
            if (offset < -count / 2) offset += count;
            const isActive = offset === 0;
            const isAdjacent = Math.abs(offset) === 1;
            const dir = offset === 0 ? 0 : offset > 0 ? 1 : -1;

            const translatePct = dir * 62;
            const scale = isActive ? 1 : isAdjacent ? 0.82 : 0.7;
            const opacity = isActive ? 1 : isAdjacent ? 0.45 : 0;
            const z = isActive ? 20 : isAdjacent ? 10 : 0;
            const pointer = isActive || isAdjacent ? "auto" : "none";

            return (
              <button
                key={entry.character.id}
                type="button"
                onClick={() => go(i)}
                aria-label={
                  isActive
                    ? undefined
                    : tHome("viewBuildOf", { name: resolveCharacterDisplayName(entry.character, lang) })
                }
                aria-hidden={!isActive && !isAdjacent}
                tabIndex={isActive || !isAdjacent ? -1 : 0}
                disabled={isActive}
                className="absolute left-1/2 top-1/2 cursor-pointer border-0 bg-transparent p-0 transition-all duration-500 ease-out"
                style={{
                  transform: `translate(-50%, -50%) translateX(${translatePct}%) scale(${scale})`,
                  opacity,
                  zIndex: z,
                  pointerEvents: pointer,
                  cursor: isActive ? "default" : "pointer",
                }}
              >
                <ResponsiveQuickBuildCard
                  character={entry.character}
                  build={entry.build}
                  lang={lang}
                  cardRef={null}
                />
              </button>
            );
          })}
        </div>

        {/* Flèches (en boucle) */}
        <button
          type="button"
          onClick={() => go(active - 1)}
          aria-label={t("previousCard")}
          className="absolute left-2 top-1/2 z-30 -translate-y-1/2 inline-flex items-center justify-center rounded-full border border-white/10 bg-panel/80 p-2 text-parch backdrop-blur transition hover:border-gold/60 hover:bg-panel md:p-3"
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        <button
          type="button"
          onClick={() => go(active + 1)}
          aria-label={t("nextCard")}
          className="absolute right-2 top-1/2 z-30 -translate-y-1/2 inline-flex items-center justify-center rounded-full border border-white/10 bg-panel/80 p-2 text-parch backdrop-blur transition hover:border-gold/60 hover:bg-panel md:p-3"
        >
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </button>

        {/* Points + pause / lecture */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPausedByUser(!userPaused)}
            aria-pressed={userPaused}
            aria-label={userPaused ? tHome("showcasePlay") : tHome("showcasePause")}
            title={userPaused ? tHome("showcasePlay") : tHome("showcasePause")}
            className="grid h-7 w-7 place-items-center rounded-full border border-white/12 bg-panel/70 text-parch/80 transition-colors hover:border-gold/50 hover:text-gold-bright"
          >
            {userPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
          <div className="flex items-center gap-2">
            {featured.map((entry, i) => (
              <button
                key={entry.character.id}
                type="button"
                onClick={() => go(i)}
                aria-label={t("goToCard", { index: i + 1 })}
                aria-current={i === active ? "true" : undefined}
                className={`relative h-2 overflow-hidden rounded-full transition-all duration-300 ${
                  i === active ? "w-8 bg-gold/30" : "w-2 bg-white/10 hover:bg-white/20"
                }`}
              >
                {/* Temps restant avant la carte suivante ; plein et fixe à l'arrêt. */}
                {i === active && (
                  <span
                    key={`${active}-${paused}`}
                    className="absolute inset-y-0 left-0 bg-gold"
                    style={
                      paused
                        ? { width: "100%" }
                        : { width: "100%", transformOrigin: "left", animation: `dna-bar-grow ${AUTOPLAY_MS}ms linear both` }
                    }
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appels à l'action */}
      <div className="container mx-auto mt-6 px-4 md:mt-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 md:flex-row md:gap-4">
          <Link
            href={`/characters/${getCharacterSlug(activeEntry.character)}?tab=build&build=true#quick-build`}
            className="dna-shine group inline-flex items-center justify-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-6 py-3 text-sm font-medium text-gold-bright transition-all duration-200 hover:-translate-y-px hover:border-gold-bright hover:text-gold-hover"
          >
            <GlyphIcons.builder className="h-4 w-4" />
            {activeEntry.buildCount > 1
              ? tHome("openBuildsOf", { name: activeName, count: activeEntry.buildCount })
              : tHome("openBuildOf", { name: activeName })}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/characters"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/20 bg-gradient-to-b from-panel/70 to-ink/70 px-6 py-3 text-sm font-medium text-parch transition-all duration-200 hover:-translate-y-px hover:border-white/45 hover:text-white"
          >
            <GlyphIcons.characters className="h-4 w-4" />
            {tHome("viewAllCharacters")}
          </Link>
        </div>
      </div>
    </section>
  );
}
