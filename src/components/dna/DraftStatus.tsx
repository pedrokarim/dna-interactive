"use client";
import { cn } from "./cn";

/**
 * Indicateur d'état de brouillon du builder. Reflète la persistance hybride
 * (localStorage + serveur) : modifié, enregistrement en cours, enregistré, ou
 * erreur. `savedAt` est fourni déjà formaté (pas de calcul de date ici).
 */

export type DraftState = "idle" | "dirty" | "saving" | "saved" | "error";

const META: Record<DraftState, { glyph: string; label: string; tone: string }> = {
  idle: { glyph: "○", label: "Brouillon", tone: "text-muted-2 border-white/15" },
  dirty: { glyph: "•", label: "Modifications non enregistrées", tone: "text-gold border-gold/40" },
  saving: { glyph: "⟳", label: "Enregistrement…", tone: "text-muted border-white/20" },
  saved: { glyph: "✓", label: "Brouillon enregistré", tone: "text-anemo border-anemo/40" },
  error: { glyph: "⚠", label: "Échec de l'enregistrement", tone: "text-[#ffb3a6] border-crimson-bright/50" },
};

export type DnaDraftStatusProps = {
  state: DraftState;
  /** Horodatage déjà formaté (ex. « 14:32 »), affiché en état "saved". */
  savedAt?: string;
  className?: string;
};

export function DnaDraftStatus({ state, savedAt, className }: DnaDraftStatusProps) {
  const m = META[state];
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border bg-ink/40 px-2.5 py-1 font-caps text-[0.58rem] uppercase tracking-[0.14em]",
        m.tone,
        className,
      )}
    >
      <span aria-hidden className={cn("leading-none", state === "saving" && "animate-spin")}>
        {m.glyph}
      </span>
      <span>{m.label}</span>
      {state === "saved" && savedAt && <span className="text-muted-2 normal-case tracking-normal">· {savedAt}</span>}
    </span>
  );
}
