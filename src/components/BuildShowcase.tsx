"use client";

import { Link } from "@/i18n/navigation";
import { ArrowRight, FileImage, Users } from "lucide-react";
import { QuickBuildCard } from "@/components/characters/QuickBuildModal";
import { getCharacterById } from "@/lib/characters/catalog";
import { getCharacterBuilds } from "@/lib/characters/builds";

// ---------------------------------------------------------------------------
// BuildShowcase — home-page section that demos the Quick Build card feature.
// Uses Psyche (char-saiqi) as the featured character. Anchored via
// id="build-showcase" so the hero teaser can scroll-link to it.
// ---------------------------------------------------------------------------

const FEATURED_CHAR_ID = "char-saiqi";

export default function BuildShowcase() {
  const character = getCharacterById(FEATURED_CHAR_ID);
  const builds = character ? getCharacterBuilds(character.id) : [];
  const build = builds[0];

  if (!character || !build) return null;

  const name = character.translations.FR?.name ?? character.internalName;

  return (
    <section
      id="build-showcase"
      className="relative py-16 md:py-20 bg-gradient-to-br from-indigo-950/50 via-slate-900/60 to-purple-950/50"
    >
      {/* Intro header — constrained to the usual reading width */}
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
      </div>

      {/* Card — full-bleed, escapes the narrow container to breathe.
          Natural width (1280px) displayed centered; on small screens the
          section scrolls horizontally. No inner scrollbar. */}
      <div className="mt-8 w-full overflow-x-auto md:mt-10 md:overflow-visible">
        <div className="mx-auto flex w-fit justify-center px-4">
          <QuickBuildCard
            character={character}
            build={build}
            lang="FR"
            cardRef={null}
          />
        </div>
      </div>

      {/* CTAs */}
      <div className="container mx-auto mt-6 px-4 md:mt-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 md:flex-row md:gap-4">
          <Link
            href={`/characters/${character.id}?tab=build&build=true#quick-build`}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-300/40 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-105 hover:shadow-indigo-500/40"
          >
            <FileImage className="h-4 w-4" />
            Ouvrir le build de {name}
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
