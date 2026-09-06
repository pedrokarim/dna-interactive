"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaCornerBrackets, DnaElementBadge, DnaStars, DnaTag, ELEMENTS, cn } from "@/components/dna";
import type { UpcomingCharacter } from "@/lib/characters/upcoming";
import { useReleaseCountdown } from "./useReleaseCountdown";

/**
 * Bande « prochainement » de la page d'accueil.
 *
 * Le showcase juste en dessous (`NewCharactersBanner`) est entièrement piloté
 * par des illustrations : impossible d'y glisser un personnage dont le jeu n'a
 * livré aucune texture. Cette bande est donc bâtie sans image – lettre gravée,
 * trame diagonale et halo élémentaire tiennent lieu de visuel – ce qui lui
 * permet d'annoncer un personnage dès que ses données existent, sans attendre
 * les assets.
 *
 * Volontairement basse et sobre : elle précède le grand showcase sans lui
 * disputer la vedette.
 */
export function UpcomingCharacterStrip({ character }: { character: UpcomingCharacter }) {
  const locale = useLocale();
  const element = ELEMENTS[character.element];
  const { parts, released } = useReleaseCountdown(character.releaseDate ?? "");

  const dateLabel = useMemo(
    () =>
      character.releaseDate
        ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(
            new Date(`${character.releaseDate}T12:00:00Z`),
          )
        : null,
    [locale, character.releaseDate],
  );

  // Une fois le personnage sorti, la bande n'a plus lieu d'être : la vraie
  // fiche prend le relais et le showcase l'accueillera avec ses visuels.
  if (released) return null;

  return (
    <Link
      href={`/characters/${character.slug}`}
      /* Mobile : deux rangées empilées (identité, puis compteur + action).
         À partir de `sm`, tout revient sur une seule ligne. */
      className="group relative flex flex-col gap-4 overflow-hidden rounded-sm border border-line/25 bg-panel/70 p-5 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-gold/50 sm:flex-row sm:items-center sm:gap-6"
      style={{ boxShadow: `inset 0 0 70px -46px ${element.hex}` }}
    >
      {/* Halo et trame : la surface est occupée sans imiter une illustration. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse 34% 120% at 6% 50%, ${element.hex}14, transparent 72%)` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 10px)",
          color: element.hex,
        }}
      />
      <DnaCornerBrackets size={14} />

      {/* Rangée 1 : cartouche (tenant lieu de portrait) + identité */}
      <span className="relative flex min-w-0 flex-1 items-center gap-4">
        <span
          aria-hidden
          className="grid h-16 w-16 shrink-0 place-items-center rounded-sm border"
          style={{ borderColor: `${element.hex}55`, background: `${element.hex}14` }}
        >
          <span className="font-display text-4xl leading-none opacity-70" style={{ color: element.hex }}>
            {character.name.charAt(0)}
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-caps text-[0.55rem] uppercase tracking-[0.22em] text-muted">Prochainement</span>
            <DnaTag tone="crimson">Version {character.version}</DnaTag>
          </span>
          <span className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="font-display text-3xl text-parch transition-colors group-hover:text-gold-bright">
              {character.name}
            </span>
            <span className="font-serif text-base italic text-gold/90">« {character.subtitle} »</span>
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <DnaElementBadge element={character.element} showLabel size={20} />
            <DnaStars value={character.rarity} />
            <span className="font-sans text-xs text-muted">{character.campLabel}</span>
            {dateLabel ? <span className="font-sans text-xs text-muted">· {dateLabel}</span> : null}
          </span>
        </span>
      </span>

      {/* Rangée 2 sur mobile, fin de ligne sur desktop */}
      <span className="relative flex shrink-0 items-center justify-between gap-3 sm:justify-end sm:gap-4">
        {/* L'horloge n'existe qu'apres hydratation : on reserve sa place avec
            des tirets, sinon le bouton saute d'une position au premier tic. */}
        <span className="flex gap-1.5" role="timer" aria-live="off">
          <Unit value={parts?.days ?? null} label="j" />
          <Unit value={parts?.hours ?? null} label="h" />
          <Unit value={parts?.minutes ?? null} label="min" />
          <Unit value={parts?.seconds ?? null} label="s" />
        </span>

        <span
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-sm border border-line/30 px-4 py-2",
            "font-caps text-[0.58rem] uppercase tracking-[0.14em] text-muted transition-colors",
            "group-hover:border-gold group-hover:text-gold-bright",
          )}
        >
          Voir la fiche
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </span>
    </Link>
  );
}

function Unit({ value, label }: { value: number | null; label: string }) {
  return (
    <span className="flex min-w-[2.75rem] flex-col items-center border border-line/25 bg-black/25 px-1.5 py-1">
      {/* `dna-optical-num` : un chiffre n'a pas de jambage, il paraît sinon
          collé en haut de sa case — d'autant plus visible que le libellé du
          dessous, lui, est déjà recentré par la règle des capitales. */}
      <span className="dna-optical-num font-mono text-base leading-none text-gold-bright tabular-nums">
        {value === null ? "--" : `${value}`.padStart(2, "0")}
      </span>
      <span className="mt-0.5 font-caps text-[0.46rem] uppercase tracking-[0.14em] text-muted-2">{label}</span>
    </span>
  );
}
