import { cn } from "./cn";

/** Frise de filigrane dorée (ornement central au sommet d'un panneau). */
export function DnaCrest({ width = 200, className }: { width?: number; className?: string }) {
  return (
    <svg
      width={width}
      height={(width / 220) * 22}
      viewBox="0 0 220 22"
      fill="none"
      stroke="#c2a86a"
      strokeWidth={1}
      className={cn("opacity-90", className)}
      aria-hidden
    >
      <path d="M110 4 l5 5 -5 5 -5 -5 z" fill="#c2a86a" stroke="none" />
      <path d="M115 9 h26" />
      <path d="M141 9 c10 0 8 -7 16 -7 6 0 8 5 3 7 -4 2 -8 -1 -5 -4" />
      <path d="M160 9 h40" />
      <circle cx="205" cy="9" r="2.2" fill="#c2a86a" stroke="none" />
      <path d="M105 9 h-26" />
      <path d="M79 9 c-10 0 -8 -7 -16 -7 -6 0 -8 5 -3 7 4 2 8 -1 5 -4" />
      <path d="M60 9 h-40" />
      <circle cx="15" cy="9" r="2.2" fill="#c2a86a" stroke="none" />
    </svg>
  );
}
