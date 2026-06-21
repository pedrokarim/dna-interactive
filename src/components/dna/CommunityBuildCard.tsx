"use client";
import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import { cn } from "./cn";
import { ELEMENTS, type ElementKey } from "./elements";
import { DnaPanel } from "./Panel";
import { DnaAvatar } from "./Avatar";
import { DnaPill } from "./Pill";
import { DnaTag } from "./Tag";
import { DnaVoteButton } from "./VoteButton";

/**
 * Carte récapitulative d'un build communauté (liste sur la fiche perso +
 * classement). Distingue « Officiel » (nos guides) d'« Alternative communauté »
 * via le tag, porte l'auteur Discord, la date, un aperçu d'items et le vote.
 *
 * `date` est fourni déjà formaté (le formatage/i18n est la responsabilité de
 * l'appelant — pas de calcul de date dans le composant).
 */

type IconRef = { icon?: string | null; name?: string };

export type DnaCommunityBuildCardProps = {
  title: string;
  author: { name: string; avatar?: string | null };
  date?: string;
  element?: ElementKey | null;
  /** Rang dans le classement (affiche #n). */
  rank?: number;
  /** Build officiel (badge dédié) vs alternative communauté. */
  official?: boolean;
  vote: { count: number; voted?: boolean };
  onVote?: (next: boolean) => void;
  voteDisabled?: boolean;
  voteReadOnly?: boolean;
  /** Libellés du bouton de vote (i18n via l'appelant). */
  voteLabels?: { vote?: string; remove?: string; login?: string };
  weapons?: IconRef[];
  genimons?: IconRef[];
  onOpen?: () => void;
  openLabel?: string;
  /** Libellés de tier (i18n via l'appelant). Défauts FR. */
  officialLabel?: string;
  communityLabel?: string;
  actions?: ReactNode;
  className?: string;
};

export function DnaCommunityBuildCard({
  title,
  author,
  date,
  element,
  rank,
  official = false,
  vote,
  onVote,
  voteDisabled,
  voteReadOnly,
  voteLabels,
  weapons = [],
  genimons = [],
  onOpen,
  openLabel = "Voir le build",
  officialLabel = "Officiel",
  communityLabel = "Communauté",
  actions,
  className,
}: DnaCommunityBuildCardProps) {
  const accent = element ? ELEMENTS[element].hex : "#c2a86a";

  return (
    <DnaPanel className={cn("relative overflow-hidden", className)}>
      {/* Liseré d'accent teinté par l'élément. */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} />

      <div className="flex items-stretch gap-3 p-3 pl-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Ligne titre + statut */}
          <div className="flex items-center gap-2">
            {rank != null && (
              <span
                className="flex h-5 shrink-0 items-center justify-center rounded-sm border px-1.5 font-caps text-[0.6rem] leading-none"
                style={{ borderColor: accent, color: accent }}
              >
                #{rank}
              </span>
            )}
            <button
              type="button"
              onClick={onOpen}
              className={cn("min-w-0 flex-1 truncate text-left font-display text-base text-parch", onOpen && "hover:text-gold-bright")}
              title={title}
            >
              {title}
            </button>
            <DnaTag tone={official ? "gold" : "crimson"}>{official ? officialLabel : communityLabel}</DnaTag>
          </div>

          {/* Ligne auteur + date */}
          <div className="flex items-center gap-2">
            <DnaAvatar src={author.avatar ?? undefined} fallback={author.name.charAt(0).toUpperCase()} round size={22} />
            <span className="min-w-0 truncate font-sans text-xs text-muted">{author.name}</span>
            {date && <DnaPill className="ml-auto">{date}</DnaPill>}
          </div>

          {/* Aperçu d'items */}
          {(weapons.length > 0 || genimons.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {weapons.map((w, i) => (
                <IconChip key={`w-${i}`} item={w} />
              ))}
              {weapons.length > 0 && genimons.length > 0 && <span aria-hidden className="mx-0.5 h-4 w-px bg-white/12" />}
              {genimons.map((g, i) => (
                <IconChip key={`g-${i}`} item={g} />
              ))}
            </div>
          )}

          {onOpen || actions ? (
            <div className="flex flex-wrap items-center gap-2">
              {onOpen ? (
                <button
                  type="button"
                  onClick={onOpen}
                  className="inline-flex items-center gap-1.5 border border-gold/35 bg-gold/10 px-3 py-1.5 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-gold transition-colors hover:border-gold hover:bg-gold/20 hover:text-gold-bright"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {openLabel}
                </button>
              ) : null}
              {actions}
            </div>
          ) : null}
        </div>

        {/* Vote */}
        <div className="flex shrink-0 items-center">
          <DnaVoteButton
            count={vote.count}
            voted={vote.voted}
            disabled={voteDisabled}
            readOnly={voteReadOnly}
            onToggle={onVote}
            labels={voteLabels}
          />
        </div>
      </div>
    </DnaPanel>
  );
}

function IconChip({ item }: { item: IconRef }) {
  return (
    <span
      title={item.name}
      className="grid h-7 w-7 place-items-center border border-white/8 bg-black/25"
    >
      {item.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.icon} alt={item.name ?? ""} width={28} height={28} className="h-[80%] w-[80%] object-contain" />
      ) : (
        <span className="text-xs text-muted-2">◇</span>
      )}
    </span>
  );
}
