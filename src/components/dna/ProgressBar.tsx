import { cn } from "./cn";

/** Barre de progression dorée. */
export function DnaProgress({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("relative h-1 w-full bg-white/6", className)} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-deep to-gold-bright shadow-[0_0_6px_#c2a86a]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
