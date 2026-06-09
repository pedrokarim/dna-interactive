import { cn } from "./cn";

/** Étoiles de rareté (pleines dorées + creuses grisées). */
export function DnaStars({ value, max = 5, className }: { value: number; max?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex text-[0.7rem] tracking-[-1px] text-gold-bright drop-shadow-[0_1px_3px_#000]", className)}
      aria-label={`${value} sur ${max}`}
    >
      <span>{"★".repeat(Math.max(0, value))}</span>
      {value < max ? <span className="text-muted-2">{"★".repeat(max - value)}</span> : null}
    </span>
  );
}
