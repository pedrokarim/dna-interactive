"use client";
import { cn } from "./cn";

export type DnaSwitchProps = {
  checked: boolean;
  onChange?: (value: boolean) => void;
  className?: string;
  "aria-label"?: string;
};

/** Interrupteur on/off doré. */
export function DnaSwitch({ checked, onChange, className, ...rest }: DnaSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative h-[22px] w-[46px] shrink-0 rounded-full border border-line/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-1 focus-visible:ring-offset-ink",
        checked ? "bg-gold/45" : "bg-white/10",
        className,
      )}
      {...rest}
    >
      <span
        className={cn(
          "absolute top-px h-[18px] w-[18px] rounded-full transition-[left,background-color]",
          checked ? "left-[25px] bg-gold-bright shadow-[0_0_8px_#c2a86a]" : "left-px bg-muted",
        )}
      />
    </button>
  );
}
