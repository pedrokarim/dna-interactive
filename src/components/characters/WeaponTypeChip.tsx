import { cn } from "@/components/dna/cn";
import type { WeaponTypeInfo } from "@/lib/characters/weapon-proficiency";

export type WeaponTypeChipTone = "base" | "extra" | "suggested";

const DISC_TONE: Record<WeaponTypeChipTone, string> = {
  base: "border-gold/60",
  // Pointillés : un type qu'on peut débloquer, pas encore une maîtrise acquise.
  extra: "border-dashed border-[rgba(255,255,255,0.4)]",
  suggested: "border-gold-bright",
};

/**
 * Un type d'arme : son icône du jeu sur un disque sombre, et son nom.
 *
 * Les icônes du jeu sont blanches sur fond transparent : le disque est sombre
 * dans les deux thèmes, sinon elles disparaissent sur le thème clair.
 */
export function WeaponTypeChip({
  type,
  name,
  tone = "base",
  size = "md",
  className,
}: {
  type: Pick<WeaponTypeInfo, "icon">;
  /** Nom déjà traduit ; omis, la puce ne montre que l'icône. */
  name?: string;
  tone?: WeaponTypeChipTone;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full border bg-[#14110d]",
          size === "sm" ? "h-10 w-10" : "h-14 w-14",
          DISC_TONE[tone],
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={type.icon}
          alt=""
          aria-hidden="true"
          width={64}
          height={64}
          loading="lazy"
          className={cn("object-contain", size === "sm" ? "h-7 w-7" : "h-10 w-10", tone === "extra" && "opacity-80")}
        />
      </span>
      {name ? (
        <span className={cn("min-w-0 leading-tight", size === "sm" ? "text-sm" : "text-base", tone === "extra" ? "text-parch/80" : "text-parch")}>
          {name}
        </span>
      ) : null}
    </span>
  );
}
