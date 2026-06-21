import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type DnaFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode;
  wrapClassName?: string;
};

/** Champ de saisie / recherche — fond sombre, liseré fin, focus doré. */
export function DnaField({ icon, wrapClassName, className, ...rest }: DnaFieldProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-white/20 bg-gradient-to-b from-panel/60 to-ink/70 px-3 py-2 text-muted transition-colors focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/50",
        wrapClassName,
      )}
    >
      <span aria-hidden className="text-muted">{icon ?? "⌕"}</span>
      <input
        className={cn(
          "min-w-0 flex-1 bg-transparent font-sans text-sm text-parch outline-none placeholder:text-muted-2",
          className,
        )}
        {...rest}
      />
    </label>
  );
}
