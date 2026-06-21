import { cn } from "./cn";

export type DnaAvatarProps = {
  src?: string | null;
  alt?: string;
  /** Repli (initiale) si pas d'image. */
  fallback?: string;
  round?: boolean;
  size?: number;
  className?: string;
};

/** Avatar joueur/personnage — biseau doré ou rond. */
export function DnaAvatar({ src, alt = "", fallback, round = false, size = 54, className }: DnaAvatarProps) {
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "inline-grid place-items-center overflow-hidden border border-gold bg-[radial-gradient(circle_at_50%_35%,rgba(164,142,208,0.35),rgba(20,17,13,0.9))] font-caps text-parch",
        round ? "rounded-full" : "dna-clip-bevel",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} width={96} height={96} className="h-full w-full object-cover object-[50%_16%]" />
      ) : (
        <span className="text-lg">{fallback}</span>
      )}
    </span>
  );
}
