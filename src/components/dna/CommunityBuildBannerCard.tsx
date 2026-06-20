"use client";
import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import { cn } from "./cn";
import { ELEMENTS, type ElementKey } from "./elements";
import { DnaPanel } from "./Panel";
import { DnaAvatar } from "./Avatar";
import { DnaPill } from "./Pill";
import { DnaTag } from "./Tag";
import { DnaElementBadge } from "./ElementBadge";
import { DnaVoteButton } from "./VoteButton";

/**
 * Carte de build communauté « complète » (grille du hub) — inspirée d'Endfield
 * Tools, avec les données DNA : bannière (art du perso) + line-up de la team,
 * arme principale, élément, tags, compteur de vues, auteur et vote.
 */

type Portrait = { avatar?: string | null; name: string };

export type DnaCommunityBuildBannerCardProps = {
  title: string;
  author: { name: string; avatar?: string | null };
  date?: string;
  element?: ElementKey | null;
  rank?: number;
  bannerImage?: string | null;
  characterName?: string;
  /** Line-up (perso principal + équipe) affiché en mini-avatars sur la bannière. */
  lineup?: Portrait[];
  /** Arme principale du build (icône à côté du titre). */
  mainWeapon?: { icon?: string | null; name?: string };
  /** Tags/catégories déjà localisés (le DS reste pur). */
  tags?: string[];
  views?: number;
  official?: boolean;
  vote: { count: number; voted?: boolean };
  onVote?: (next: boolean) => void;
  voteDisabled?: boolean;
  voteReadOnly?: boolean;
  voteLabels?: { vote?: string; remove?: string; login?: string };
  viewsLabel?: string;
  onOpen?: () => void;
  officialLabel?: string;
  communityLabel?: string;
  actions?: ReactNode;
  className?: string;
};

export function DnaCommunityBuildBannerCard({
  title,
  author,
  date,
  element,
  rank,
  bannerImage,
  characterName,
  lineup = [],
  mainWeapon,
  tags = [],
  views,
  official = false,
  vote,
  onVote,
  voteDisabled,
  voteReadOnly,
  voteLabels,
  viewsLabel,
  onOpen,
  officialLabel = "Officiel",
  communityLabel = "Communauté",
  actions,
  className,
}: DnaCommunityBuildBannerCardProps) {
  const accent = element ? ELEMENTS[element].hex : "#c2a86a";

  return (
    <DnaPanel className={cn("flex flex-col overflow-hidden", className)}>
      {/* Bannière */}
      <button
        type="button"
        onClick={onOpen}
        className={cn("group relative block h-36 w-full overflow-hidden text-left", onOpen ? "cursor-pointer" : "cursor-default")}
        title={onOpen ? title : undefined}
      >
        {bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[50%_16%] transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 20%, ${accent}33, rgba(8,10,14,0.95))` }} />
        )}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent" />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px" style={{ backgroundColor: accent }} />

        {/* Élément (haut-gauche) */}
        {element ? <span className="absolute left-2 top-2">{<DnaElementBadge element={element} size={24} />}</span> : null}

        {/* Rang + tier (haut-droite) */}
        <span className="absolute right-2 top-2 flex items-center gap-1.5">
          {rank != null && (
            <span
              className="flex h-6 min-w-6 items-center justify-center rounded-sm border px-1.5 font-caps text-[0.62rem] leading-none"
              style={{ borderColor: accent, color: accent, backgroundColor: "rgba(8,10,14,0.7)" }}
            >
              #{rank}
            </span>
          )}
          <DnaTag tone={official ? "gold" : "crimson"}>{official ? officialLabel : communityLabel}</DnaTag>
        </span>

        {/* Line-up de la team (bas-gauche) */}
        {lineup.length > 0 ? (
          <span className="absolute bottom-2 left-2 flex items-center gap-1">
            {lineup.slice(0, 4).map((member, index) => (
              <span
                key={`${member.name}-${index}`}
                title={member.name}
                className="grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-white/40 bg-ink/70 shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
              >
                {member.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.avatar} alt={member.name} className="h-full w-full object-cover object-[50%_15%]" />
                ) : (
                  <span className="font-caps text-[0.6rem] text-parch">{member.name.charAt(0)}</span>
                )}
              </span>
            ))}
          </span>
        ) : null}
      </button>

      {/* Corps */}
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="flex items-start gap-2.5">
          {mainWeapon ? (
            <span title={mainWeapon.name} className="grid h-10 w-10 shrink-0 place-items-center border border-white/10 bg-black/30">
              {mainWeapon.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mainWeapon.icon} alt={mainWeapon.name ?? ""} className="h-[82%] w-[82%] object-contain" />
              ) : (
                <span className="text-sm text-muted-2">⚔</span>
              )}
            </span>
          ) : null}
          <div className="min-w-0">
            <button
              type="button"
              onClick={onOpen}
              className={cn("block w-full truncate text-left font-display text-base leading-tight text-parch", onOpen && "hover:text-gold-bright")}
              title={title}
            >
              {title}
            </button>
            {characterName ? (
              <span className="mt-0.5 block truncate font-caps text-[0.55rem] uppercase tracking-[0.16em] text-muted">{characterName}</span>
            ) : null}
          </div>
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="border border-white/12 bg-white/5 px-1.5 py-0.5 font-caps text-[0.5rem] uppercase tracking-[0.12em] text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center gap-2 border-t border-white/8 pt-2.5">
          <DnaAvatar src={author.avatar ?? undefined} fallback={author.name.charAt(0).toUpperCase()} round size={22} />
          <span className="min-w-0 flex-1 truncate font-sans text-xs text-muted">{author.name}</span>
          {typeof views === "number" ? (
            <span className="inline-flex items-center gap-1 font-sans text-[0.7rem] text-muted-2" title={viewsLabel} aria-label={viewsLabel}>
              <Eye className="h-3.5 w-3.5" />
              {views}
            </span>
          ) : null}
          {date && <DnaPill>{date}</DnaPill>}
          <DnaVoteButton
            count={vote.count}
            voted={vote.voted}
            disabled={voteDisabled}
            readOnly={voteReadOnly}
            onToggle={onVote}
            labels={voteLabels}
            size="sm"
          />
        </div>

        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </DnaPanel>
  );
}
