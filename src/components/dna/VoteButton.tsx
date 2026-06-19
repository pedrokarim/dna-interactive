"use client";
import { cn } from "./cn";

/**
 * Bouton de vote (upvote) — 1 vote par utilisateur, retirable. Sert au
 * classement des builds communauté. L'état `voted` est piloté par le parent
 * (optimistic UI + appel API côté builder).
 */

export type DnaVoteButtonProps = {
  count: number;
  voted?: boolean;
  /** Désactivé (ex. utilisateur non connecté). */
  disabled?: boolean;
  /** Lecture seule : affiche le compteur sans interaction. */
  readOnly?: boolean;
  size?: "sm" | "md";
  onToggle?: (next: boolean) => void;
  /** Libellés (i18n via l'appelant — le DS reste pur). Défauts FR. */
  labels?: { vote?: string; remove?: string; login?: string };
  className?: string;
};

export function DnaVoteButton({
  count,
  voted = false,
  disabled = false,
  readOnly = false,
  size = "md",
  onToggle,
  labels,
  className,
}: DnaVoteButtonProps) {
  const interactive = !readOnly && !disabled;
  const voteLabel = labels?.vote ?? "Voter";
  const removeLabel = labels?.remove ?? "Retirer mon vote";
  const loginLabel = labels?.login ?? "Connecte-toi pour voter";
  const pad = size === "sm" ? "px-1.5 py-1" : "px-2 py-1.5";
  const num = size === "sm" ? "text-[0.7rem]" : "text-sm";

  return (
    <button
      type="button"
      disabled={disabled || readOnly}
      onClick={interactive ? () => onToggle?.(!voted) : undefined}
      aria-pressed={voted}
      aria-label={voted ? `${removeLabel} (${count})` : `${voteLabel} (${count})`}
      title={disabled ? loginLabel : voted ? removeLabel : voteLabel}
      className={cn(
        "inline-flex flex-col items-center justify-center gap-0.5 rounded-md border font-caps leading-none transition-colors",
        pad,
        voted
          ? "border-gold bg-gradient-to-b from-gold-bright to-gold text-[#1a1206]"
          : "border-white/20 bg-gradient-to-b from-panel/70 to-ink/70 text-parch",
        interactive ? "hover:border-gold hover:text-gold-bright" : "cursor-default",
        disabled && "opacity-50",
        // Quand voté, le hover ne doit pas re-teinter le texte sombre.
        voted && interactive && "hover:text-[#1a1206]",
        className,
      )}
    >
      <span aria-hidden className={cn("leading-none", size === "sm" ? "text-[0.7rem]" : "text-sm")}>▲</span>
      <span className={cn("tabular-nums", num)}>{count}</span>
    </button>
  );
}
