import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type DnaButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** `gold` = action primaire (liseré doré), `ghost` = secondaire. */
  variant?: "gold" | "ghost";
  icon?: ReactNode;
};

/**
 * Bouton du design system — calé sur le jeu : rectangle arrondi, fond sombre,
 * liseré fin, texte sans en casse normale. Le primaire ajoute un liseré doré.
 */
export function DnaButton({ variant = "ghost", icon, children, className, ...rest }: DnaButtonProps) {
  return (
    <button
      className={cn(
        "dna-shine inline-flex items-center justify-center gap-2 rounded-md px-6 py-2.5 font-sans text-sm tracking-wide transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "gold"
          ? "border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 text-gold-bright shadow-[inset_0_1px_0_rgba(227,205,149,0.22)] hover:-translate-y-px hover:border-gold-bright hover:text-[#fff6e6]"
          : "border border-white/20 bg-gradient-to-b from-panel/70 to-ink/70 text-parch hover:-translate-y-px hover:border-white/45 hover:text-white",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
