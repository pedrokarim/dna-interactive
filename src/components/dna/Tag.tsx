import { Children, type ReactNode } from "react";
import { cn } from "./cn";

export type DnaTagProps = {
  children: ReactNode;
  tone?: "gold" | "crimson";
  className?: string;
};

/** Vrai si l'étiquette ne contient que du texte (une ou plusieurs chaînes, nombres). */
function isPlainText(children: ReactNode): boolean {
  const parts = Children.toArray(children);
  return parts.length > 0 && parts.every((part) => typeof part === "string" || typeof part === "number");
}

/** Étiquette compacte (rôle, mot-clé, statut). */
export function DnaTag({ children, tone = "gold", className }: DnaTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2.5 py-1 font-caps text-[0.58rem] uppercase tracking-[0.16em]",
        tone === "crimson"
          ? "border-crimson-bright/50 bg-crimson/15 text-crimson-soft"
          : "border-line/30 bg-gold/6 text-gold",
        className,
      )}
    >
      {/* Texte seul : il descend dans le cadre (`.dna-boxed-caps`). Avec une
          icône, on ne touche à rien, sinon l'icône descendrait aussi. */}
      {isPlainText(children) ? (
        <span className="dna-boxed-caps">{children}</span>
      ) : (
        children
      )}
    </span>
  );
}
