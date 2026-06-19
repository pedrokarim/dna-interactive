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
 * Carte de build communauté « à bannière » (grille du hub) : visuel du
 * personnage en bannière teintée par l'élément, titre en overlay, puis auteur /
 * aperçu d'items / vote. Variante riche de DnaCommunityBuildCard (qui reste la
 * version compacte en liste sur la fiche perso).
 */

type IconRef = { icon?: string | null; name?: string };

export type DnaCommunityBuildBannerCardProps = {
  title: string;
  author: { name: string; avatar?: string | null };
  date?: string;
  element?: ElementKey | null;
  rank?: number;
  bannerImage?: string | null;
  characterName?: string;
  official?: boolean;
  vote: { count: number; voted?: boolean };
  onVote?: (next: boolean) => void;
  voteDisabled?: boolean;
  voteReadOnly?: boolean;
  voteLabels?: { vote?: string; remove?: string; login?: string };
  weapons?: IconRef[];
  genimons?: IconRef[];
  /** Tags/catégories déjà localisés (le DS reste pur). */
  tags?: string[];
  onOpen?: () => void;
  openLabel?: string;
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
  official = false,
  vote,
  onVote,
  voteDisabled,
  voteReadOnly,
  voteLabels,
  weapons = [],
  genimons = [],
  tags = [],
  onOpen,
  openLabel = "Voir",
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
        className={cn("group relative block h-32 w-full overflow-hidden text-left", onOpen ? "cursor-pointer" : "cursor-default")}
        title={onOpen ? title : undefined}
      >
        {bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[50%_18%] transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 20%, ${accent}33, rgba(8,10,14,0.95))` }} />
        )}
        {/* Voile dégradé + teinte élément */}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent" />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px" style={{ backgroundColor: accent }} />

        {rank != null && (
          <span
            className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-sm border px-1.5 font-caps text-[0.62rem] leading-none"
            style={{ borderColor: accent, color: accent, backgroundColor: "rgba(8,10,14,0.7)" }}
          >
            #{rank}
          </span>
        )}
        <span className="absolute right-2 top-2 flex items-center gap-1.5">
          {element ? <DnaElementBadge element={element} size={22} /> : null}
          <DnaTag tone={official ? "gold" : "crimson"}>{official ? officialLabel : communityLabel}</DnaTag>
        </span>

        <span className="absolute inset-x-0 bottom-0 p-3">
          {characterName ? (
            <span className="block truncate font-caps text-[0.55rem] uppercase tracking-[0.18em] text-parch/70 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {characterName}
            </span>
          ) : null}
          <span className="block truncate font-display text-lg leading-tight text-parch drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] group-hover:text-gold-bright">
            {title}
          </span>
        </span>
      </button>

      {/* Corps */}
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="flex items-center gap-2">
          <DnaAvatar src={author.avatar ?? undefined} fallback={author.name.charAt(0).toUpperCase()} round size={22} />
          <span className="min-w-0 truncate font-sans text-xs text-muted">{author.name}</span>
          {date && <DnaPill className="ml-auto">{date}</DnaPill>}
        </div>

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

        <div className="mt-auto flex items-center gap-2 pt-1">
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
          <span className="ml-auto">
            <DnaVoteButton
              count={vote.count}
              voted={vote.voted}
              disabled={voteDisabled}
              readOnly={voteReadOnly}
              onToggle={onVote}
              labels={voteLabels}
              size="sm"
            />
          </span>
        </div>
      </div>
    </DnaPanel>
  );
}

function IconChip({ item }: { item: IconRef }) {
  return (
    <span title={item.name} className="grid h-7 w-7 place-items-center border border-white/8 bg-black/25">
      {item.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.icon} alt={item.name ?? ""} className="h-[80%] w-[80%] object-contain" />
      ) : (
        <span className="text-xs text-muted-2">◇</span>
      )}
    </span>
  );
}
