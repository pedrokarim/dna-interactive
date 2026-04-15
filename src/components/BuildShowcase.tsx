"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, FileImage, Users } from "lucide-react";
import { QuickBuildCard } from "@/components/characters/QuickBuildModal";
import { getCharacterById } from "@/lib/characters/catalog";
import { getCharacterBuilds } from "@/lib/characters/builds";

// ---------------------------------------------------------------------------
// BuildShowcase — home-page section showcasing 3 build cards in a horizontal
// slider. Buttons above scroll-snap to the matching card; clicking a card CTA
// opens that character's full build on the detail page.
// ---------------------------------------------------------------------------

const FEATURED_IDS = ["char-saiqi", "char-linen", "char-feina"] as const;

export default function BuildShowcase() {
  const featured = FEATURED_IDS.map((id) => {
    const character = getCharacterById(id);
    const build = character ? getCharacterBuilds(character.id)[0] : undefined;
    if (!character || !build) return null;
    return { character, build };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollTo = useCallback((index: number) => {
    const node = cardRefs.current[index];
    const track = trackRef.current;
    if (!node || !track) return;
    const left = node.offsetLeft - (track.clientWidth - node.clientWidth) / 2;
    track.scrollTo({ left, behavior: "smooth" });
    setActive(index);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      cardRefs.current.forEach((node, i) => {
        if (!node) return;
        const nodeCenter = node.offsetLeft + node.clientWidth / 2;
        const dist = Math.abs(nodeCenter - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  if (featured.length === 0) return null;

  const activeEntry = featured[active];
  const activeName =
    activeEntry.character.translations.FR?.name ?? activeEntry.character.internalName;

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
                onClick={() => scrollTo(i)}
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

      {/* Card slider */}
      <div className="relative mt-8 md:mt-10">
        <button
          type="button"
          onClick={() => scrollTo(Math.max(0, active - 1))}
          disabled={active === 0}
          aria-label="Carte précédente"
          className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-600/50 bg-slate-900/80 p-2 text-white backdrop-blur transition hover:border-indigo-400/60 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30 md:inline-flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollTo(Math.min(featured.length - 1, active + 1))}
          disabled={active === featured.length - 1}
          aria-label="Carte suivante"
          className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-600/50 bg-slate-900/80 p-2 text-white backdrop-blur transition hover:border-indigo-400/60 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30 md:inline-flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          ref={trackRef}
          className="flex w-full snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-4 md:gap-8 md:px-12"
          style={{ scrollbarWidth: "thin" }}
        >
          {featured.map((entry, i) => (
            <div
              key={entry.character.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={`shrink-0 snap-center transition-all duration-300 ${
                i === active ? "opacity-100 scale-100" : "opacity-60 scale-[0.97]"
              }`}
            >
              <QuickBuildCard
                character={entry.character}
                build={entry.build}
                lang="FR"
                cardRef={null}
              />
            </div>
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
