import { cn } from "@/components/dna/cn";

const SIZES = {
  sm: { disc: "h-8 w-8", icon: "h-5 w-5" },
  md: { disc: "h-11 w-11", icon: "h-7 w-7" },
} as const;

/**
 * Une icône du jeu sur son disque sombre.
 *
 * Les pictogrammes du jeu sont blancs sur fond transparent : le disque reste
 * sombre dans les deux thèmes, sinon ils disparaissent sur le thème clair.
 */
export function GameGlyph({
  src,
  size = "md",
  className,
}: {
  src: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full border border-gold/45 bg-[#14110d]", SIZES[size].disc, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" aria-hidden="true" width={56} height={56} loading="lazy" className={cn("object-contain", SIZES[size].icon)} />
    </span>
  );
}
