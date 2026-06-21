"use client";
import { cn } from "./cn";

export type DnaStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  /** Suffixe affiché en gris (ex. "/ 99"). */
  suffix?: string;
  className?: string;
};

/** Incrémenteur (manche, palier…). */
export function DnaStepper({ value, min = 0, max = 99, onChange, suffix, className }: DnaStepperProps) {
  return (
    <div className={cn("inline-flex items-center border border-line/30 bg-white/2", className)}>
      <button
        type="button"
        aria-label="Diminuer"
        onClick={() => onChange?.(Math.max(min, value - 1))}
        className="h-[38px] w-[38px] text-gold transition-colors hover:bg-gold/10 hover:text-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60"
      >
        ▼
      </button>
      <span className="min-w-[78px] px-3 text-center font-caps tabular-nums tracking-[0.06em] text-parch">
        <b className="font-semibold">{value}</b>
        {suffix ? <small className="text-muted-2"> {suffix}</small> : null}
      </span>
      <button
        type="button"
        aria-label="Augmenter"
        onClick={() => onChange?.(Math.min(max, value + 1))}
        className="h-[38px] w-[38px] text-gold transition-colors hover:bg-gold/10 hover:text-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60"
      >
        ▲
      </button>
    </div>
  );
}
