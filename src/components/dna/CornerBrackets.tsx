import { cn } from "./cn";

/** Équerres ornementales aux 4 coins (à poser dans un conteneur `relative`). */
export function DnaCornerBrackets({
  size = 16,
  color = "var(--color-gold)",
  thickness = 1,
  className,
}: {
  size?: number;
  color?: string;
  thickness?: number;
  className?: string;
}) {
  const base = { width: size, height: size, borderColor: color, borderWidth: 0 } as const;
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      <span className="absolute left-0 top-0" style={{ ...base, borderLeftWidth: thickness, borderTopWidth: thickness }} />
      <span className="absolute right-0 top-0" style={{ ...base, borderRightWidth: thickness, borderTopWidth: thickness }} />
      <span className="absolute bottom-0 left-0" style={{ ...base, borderLeftWidth: thickness, borderBottomWidth: thickness }} />
      <span className="absolute bottom-0 right-0" style={{ ...base, borderRightWidth: thickness, borderBottomWidth: thickness }} />
    </div>
  );
}
