import { cn } from "./cn";

/** Séparateur ornemental ◇. */
export function DnaDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-gold-deep", className)} aria-hidden>
      <span className="text-[0.6rem] text-gold">◇</span>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-line/25 to-transparent" />
      <span className="text-[0.6rem] text-gold">◇</span>
    </div>
  );
}
