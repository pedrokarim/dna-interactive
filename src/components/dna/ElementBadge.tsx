import { cn } from "./cn";
import { ELEMENTS, type ElementKey } from "./elements";

export type DnaElementBadgeProps = {
  element: ElementKey;
  size?: number;
  showLabel?: boolean;
  className?: string;
};

/**
 * Pastille élémentaire — utilise la VRAIE icône du jeu (T_Armory_*), anneau
 * teinté par l'élément. (Le glyphe d'`elements.ts` n'est qu'un repli de data.)
 */
export function DnaElementBadge({ element, size = 26, showLabel = false, className }: DnaElementBadgeProps) {
  const el = ELEMENTS[element];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        style={{ color: el.hex, width: size, height: size }}
        className="inline-grid shrink-0 place-items-center rounded-full border border-white/15 bg-ink/70 shadow-[0_0_10px_-3px_currentColor] backdrop-blur-sm"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={el.icon} alt={el.label} className="h-[68%] w-[68%] object-contain" />
      </span>
      {showLabel ? (
        <span style={{ color: el.hex }} className="font-sans text-sm">
          {el.label}
        </span>
      ) : null}
    </span>
  );
}
