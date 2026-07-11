"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Copy, Flag, GitFork, Heart, Pencil, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useConfirm } from "@/components/dna/ConfirmProvider";
import { DnaChip } from "@/components/dna/Chip";
import {
  BuildTabContent,
  communityBuildToDisplayBuild,
  type CommunityBuildListItem,
} from "@/components/characters/CharacterDetailClient";
import type { CharacterRecord } from "@/lib/characters/types";
import { NAVIGATION } from "@/lib/constants";

type Props = {
  build: CommunityBuildListItem & { views: number };
  character: CharacterRecord;
  characterElement: string;
  lang: string;
};

export function BuildPageClient({ build, character, characterElement, lang }: Props) {
  const router = useRouter();
  const tcb = useTranslations("communityBuilds");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();

  const [voteCount, setVoteCount] = useState(build.voteCount);
  const [voted, setVoted] = useState(build.votedByMe);
  const [voteBusy, setVoteBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [actionBusy, setActionBusy] = useState<"delete" | "report" | null>(null);

  const displayBuild = useMemo(
    () => communityBuildToDisplayBuild(build, lang, character),
    [build, lang, character],
  );
  const tags = build.payload.tags ?? [];

  const actionButtonClass =
    "inline-flex items-center justify-center gap-1.5 border border-white/15 bg-white/[0.04] px-3 py-2 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-parch/85 transition-colors hover:border-gold/45 hover:text-gold-bright disabled:cursor-not-allowed disabled:opacity-50";
  const builderImportHref = `${NAVIGATION.builder}?importBuildId=${build.id}`;
  const builderEditHref = `${NAVIGATION.builder}?editBuildId=${build.id}`;

  async function toggleVote() {
    if (voteBusy) return;
    setVoteBusy(true);
    const next = !voted;
    const response = await fetch(`/api/builds/${build.id}/vote`, { method: next ? "POST" : "DELETE" });
    setVoteBusy(false);
    if (!response.ok) {
      setActionMessage(tcb("voteFailed"));
      return;
    }
    const data = await response.json().catch(() => null);
    setVoted(data?.voted ?? next);
    setVoteCount(data?.voteCount ?? voteCount + (next ? 1 : -1));
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setActionMessage(tcb("linkCopied"));
    } catch {
      setActionMessage(window.location.href);
    }
  }

  async function deleteBuild() {
    const confirmed = await confirm({
      title: tcb("delete"),
      message: tcb("deleteConfirm"),
      confirmLabel: tcb("delete"),
      cancelLabel: tCommon("cancel"),
      danger: true,
    });
    if (!confirmed) return;

    setActionBusy("delete");
    setActionMessage(null);
    const response = await fetch(`/api/builds/${build.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setActionBusy(null);
    if (!response.ok) {
      setActionMessage(data.error ?? "Suppression impossible.");
      return;
    }
    router.push(NAVIGATION.builds);
  }

  async function reportBuild() {
    const reason = reportReason.trim();
    if (reason.length < 3) {
      setActionMessage("Ajoute une raison un peu plus précise.");
      return;
    }
    setActionBusy("report");
    setActionMessage(null);
    const response = await fetch(`/api/builds/${build.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await response.json().catch(() => ({}));
    setActionBusy(null);
    if (!response.ok) {
      setActionMessage(data.error ?? tcb("reportFailed"));
      return;
    }
    setReportOpen(false);
    setReportReason("");
    setActionMessage(tcb("reportSent"));
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <Link
        href={NAVIGATION.builds}
        className="inline-flex items-center gap-2 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-muted transition-colors hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        {tCommon("back")}
      </Link>

      <header className="border border-gold/25 bg-panel/85 p-4 backdrop-blur-sm md:p-6">
        <p className="font-caps text-[0.62rem] uppercase tracking-[0.2em] text-gold">{tcb("modalKicker")}</p>
        <h1 className="mt-1 font-display text-2xl leading-tight text-parch md:text-3xl">{build.title}</h1>
        <p className="mt-2 text-xs text-muted">
          {tcb("byAuthor", { author: build.authorName ?? "Discord" })}
        </p>

        {build.note ? <p className="mt-3 max-w-3xl text-sm leading-relaxed text-parch/80">{build.note}</p> : null}

        {tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <DnaChip key={tag}>{tag}</DnaChip>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleVote}
            disabled={voteBusy}
            aria-pressed={voted}
            className={`inline-flex items-center justify-center gap-1.5 border px-3 py-2 font-caps text-[0.58rem] uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              voted
                ? "border-crimson-bright/50 bg-crimson-bright/15 text-crimson-bright"
                : "border-white/15 bg-white/[0.04] text-parch/85 hover:border-gold/45 hover:text-gold-bright"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${voted ? "fill-current" : ""}`} />
            {tcb("votes", { count: voteCount })}
          </button>

          <button type="button" onClick={copyLink} className={actionButtonClass}>
            <Copy className="h-3.5 w-3.5" />
            {tcb("copyLink")}
          </button>
          <Link href={builderImportHref} className={actionButtonClass}>
            <GitFork className="h-3.5 w-3.5" />
            {tcb("useAsBase")}
          </Link>
          {build.editableByMe ? (
            <>
              <Link href={builderEditHref} className={actionButtonClass}>
                <Pencil className="h-3.5 w-3.5" />
                {tcb("edit")}
              </Link>
              <button
                type="button"
                onClick={deleteBuild}
                disabled={actionBusy === "delete"}
                className="inline-flex items-center justify-center gap-1.5 border border-crimson-bright/35 bg-crimson-bright/10 px-3 py-2 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-crimson-bright transition-colors hover:border-crimson-bright hover:bg-crimson-bright/18 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {actionBusy === "delete" ? tcb("deleting") : tcb("delete")}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setReportOpen((open) => !open)} className={actionButtonClass}>
              <Flag className="h-3.5 w-3.5" />
              {tcb("report")}
            </button>
          )}
        </div>

        {reportOpen ? (
          <div className="mt-3 max-w-2xl border border-white/10 bg-black/20 p-3">
            <label className="flex flex-col gap-2">
              <span className="font-caps text-[0.58rem] uppercase tracking-[0.16em] text-muted">{tcb("reportReasonLabel")}</span>
              <textarea
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                maxLength={160}
                placeholder={tcb("reportPlaceholder")}
                className="min-h-20 w-full resize-y border border-white/15 bg-ink/80 px-3 py-2 font-sans text-sm text-parch outline-none placeholder:text-muted-2 focus:border-gold"
              />
            </label>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="font-sans text-[0.68rem] text-muted-2">{reportReason.trim().length}/160</span>
              <button
                type="button"
                onClick={reportBuild}
                disabled={actionBusy === "report" || reportReason.trim().length < 3}
                className={actionButtonClass}
              >
                <Flag className="h-3.5 w-3.5" />
                {actionBusy === "report" ? tcb("sending") : tcb("send")}
              </button>
            </div>
          </div>
        ) : null}

        {actionMessage ? <p className="mt-2 break-words font-sans text-xs text-gold">{actionMessage}</p> : null}
      </header>

      <BuildTabContent
        builds={[displayBuild]}
        character={character}
        characterElement={characterElement}
        selectedLanguage={lang}
        showCommunityBuilds={false}
        showQuickBuildCard={true}
        quickBuildCollapsible={false}
        skillIcons={character.skillIcons}
      />
    </div>
  );
}
