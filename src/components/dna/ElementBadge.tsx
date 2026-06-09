import { cn } from "./cn";
import { ELEMENTS, type ElementKey } from "./elements";

export type DnaElementBadgeProps = {
  element: ElementKey;
  size?: number;
  showLabel?: boolean;
  /** Utiliser l'icône du jeu plutôt que le glyphe. */
  useIcon?: boolean;
  className?: string;
};

/** Pastille élémentaire circulaire (glyphe ou icône du jeu, halo coloré). */
export function DnaElementBadge({ element, size = 26, showLabel = false, useIcon = false, className }: DnaElementBadgeProps) {
  const el = ELEMENTS[element];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        style={{ color: el.hex, width: size, height: size }}
        className="inline-grid shrink-0 place-items-center rounded-full border border-current bg-ink/55 text-[0.8rem] shadow-[0_0_10px_-3px_currentColor]"
      >
        {useIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={el.icon} alt={el.label} className="h-[64%] w-[64%] object-contain" />
        ) : (
          el.glyph
        )}
      </span>
      {showLabel ? (
        <span style={{ color: el.hex }} className="font-sans text-sm">
          {el.label}
        </span>
      ) : null}
    </span>
  );
}
