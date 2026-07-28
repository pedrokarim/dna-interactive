"use client";
import { useTranslations } from "next-intl";
import { cn } from "./cn";

/**
 * Indicateur d'état de brouillon du builder. Reflète la persistance hybride
 * (localStorage + serveur) : modifié, enregistrement en cours, enregistré, ou
 * erreur. `savedAt` est fourni déjà formaté (pas de calcul de date ici).
 */

export type DraftState = "idle" | "dirty" | "saving" | "saved" | "error";

/** Le libellé vient des messages (`builder.draft*`) ; ici seuls glyphe et teinte. */
const META: Record<DraftState, { glyph: string; labelKey: string; tone: string }> = {
  idle: { glyph: "○", labelKey: "draftIdle", tone: "text-muted-2 border-white/15" },
  dirty: { glyph: "•", labelKey: "draftDirty", tone: "text-gold border-gold/40" },
  saving: { glyph: "⟳", labelKey: "draftSaving", tone: "text-muted border-white/20" },
  saved: { glyph: "✓", labelKey: "draftSaved", tone: "text-anemo border-anemo/40" },
  error: { glyph: "⚠", labelKey: "draftError", tone: "text-[#ffb3a6] border-crimson-bright/50" },
};

export type DnaDraftStatusProps = {
  state: DraftState;
  /** Horodatage déjà formaté (ex. « 14:32 »), affiché en état "saved". */
  savedAt?: string;
  className?: string;
};

export function DnaDraftStatus({ state, savedAt, className }: DnaDraftStatusProps) {
  const t = useTranslations("builder");
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
      <span>{t(m.labelKey)}</span>
      {state === "saved" && savedAt && <span className="text-muted-2 normal-case tracking-normal">· {savedAt}</span>}
    </span>
  );
}
