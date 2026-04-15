"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, FileImage, Users } from "lucide-react";
import { ResponsiveQuickBuildCard } from "@/components/characters/QuickBuildModal";
import { getCharacterById } from "@/lib/characters/catalog";
import { getCharacterBuilds } from "@/lib/characters/builds";

// ---------------------------------------------------------------------------
// BuildShowcase — Twitch-style peek carousel. Active card centered at full
// size; previous/next cards shifted and scaled down on the sides, dimmed.
// Clicking a peek card (or an arrow / nav button) promotes it to active.
// ---------------------------------------------------------------------------

// Visual order: left | middle (hero / default active) | right
const FEATURED_IDS = ["char-linen", "char-saiqi", "char-feina"] as const;

export default function BuildShowcase() {
  const featured = FEATURED_IDS.map((id) => {
    const character = getCharacterById(id);
    const build = character ? getCharacterBuilds(character.id)[0] : undefined;
    if (!character || !build) return null;
    return { character, build };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const [active, setActive] = useState(Math.floor(FEATURED_IDS.length / 2));

  if (featured.length === 0) return null;

  const activeEntry = featured[active];
  const activeName =
    activeEntry.character.translations.FR?.name ?? activeEntry.character.internalName;

  const go = (i: number) => {
    if (i < 0 || i >= featured.length) return;
    setActive(i);
  };

  return (
    <section
      id="build-showcase"
      className="relative py-16 md:py-20 bg-gradient-to-br from-indigo-950/50 via-slate-900/60 to-purple-950/50"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-6xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-300/40 bg-indigo-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100">
            <FileImage className="h-3.5 w-3.5" />
            Nouveau
          </span>
          <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">
            Partagez vos builds avec style
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
            Des cartes de build exportables en PNG, directement sur chaque fiche
            personnage. Armes, Demon Wedge, Génimons, priorités stats et équipe
            recommandée — tout en un visuel.
          </p>
        </div>

        {/* Character selector buttons */}
        <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-center gap-2 md:gap-3">
          {featured.map((entry, i) => {
            const name =
              entry.character.translations.FR?.name ?? entry.character.internalName;
            const isActive = i === active;
            return (
              <button
                key={entry.character.id}
                type="button"
                onClick={() => go(i)}
                aria-pressed={isActive}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "border-indigo-300/60 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                    : "border-slate-600/50 bg-slate-900/60 text-slate-300 hover:border-indigo-400/40 hover:text-white"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Peek carousel — active centered, neighbors peeking on sides */}
      <div className="relative mt-8 w-full overflow-hidden md:mt-10">
        <div className="relative mx-auto flex h-[160px] items-center justify-center sm:h-[272px] md:h-[328px] lg:h-[440px] xl:h-[580px]">
          {featured.map((entry, i) => {
            const offset = i - active;
            const isActive = offset === 0;
            const isAdjacent = Math.abs(offset) === 1;
            const dir = offset === 0 ? 0 : offset > 0 ? 1 : -1;

            // Percentage of card width to shift side cards (Twitch-like peek).
            // Responsive via CSS variable would be cleaner; here we use a
            // conservative 62% which keeps ~38% of the peek card visible.
            const translatePct = dir * 62;
            const scale = isActive ? 1 : isAdjacent ? 0.82 : 0.7;
            const opacity = isActive ? 1 : isAdjacent ? 0.45 : 0;
            const z = isActive ? 20 : isAdjacent ? 10 : 0;
            const pointer = isActive ? "auto" : isAdjacent ? "auto" : "none";

            return (
              <button
                key={entry.character.id}
                type="button"
                onClick={() => go(i)}
                aria-label={
                  isActive
                    ? undefined
                    : `Voir le build de ${entry.character.translations.FR?.name ?? entry.character.internalName}`
                }
                tabIndex={isActive ? -1 : 0}
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
                  lang="FR"
                  cardRef={null}
                />
              </button>
            );
          })}
        </div>

        {/* Arrows */}
        <button
          type="button"
          onClick={() => go(active - 1)}
          disabled={active === 0}
          aria-label="Carte précédente"
          className="absolute left-2 top-1/2 z-30 -translate-y-1/2 inline-flex items-center justify-center rounded-full border border-slate-600/50 bg-slate-900/80 p-2 text-white backdrop-blur transition hover:border-indigo-400/60 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30 md:p-3"
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        <button
          type="button"
          onClick={() => go(active + 1)}
          disabled={active === featured.length - 1}
          aria-label="Carte suivante"
          className="absolute right-2 top-1/2 z-30 -translate-y-1/2 inline-flex items-center justify-center rounded-full border border-slate-600/50 bg-slate-900/80 p-2 text-white backdrop-blur transition hover:border-indigo-400/60 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30 md:p-3"
        >
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </button>

        {/* Dots */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {featured.map((entry, i) => (
            <button
              key={entry.character.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Aller à la carte ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active
                  ? "w-8 bg-indigo-400"
                  : "w-2 bg-slate-600 hover:bg-slate-500"
              }`}
            />
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="container mx-auto mt-6 px-4 md:mt-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 md:flex-row md:gap-4">
          <Link
            href={`/characters/${activeEntry.character.id}?tab=build&build=true#quick-build`}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-300/40 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-105 hover:shadow-indigo-500/40"
          >
            <FileImage className="h-4 w-4" />
            Ouvrir le build de {activeName}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/characters"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300/30 bg-slate-900/70 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:border-violet-200/60 hover:bg-slate-800/80"
          >
            <Users className="h-4 w-4" />
            Voir tous les personnages
          </Link>
        </div>
      </div>
    </section>
  );
}
