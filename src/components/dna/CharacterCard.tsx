import { cn } from "./cn";
import { ELEMENTS, type ElementKey } from "./elements";
import { DnaElementBadge } from "./ElementBadge";
import { DnaStars } from "./RarityStars";

export type DnaCharacterCardProps = {
  name: string;
  subtitle?: string;
  element: ElementKey;
  rarity?: number;
  weapons?: string[];
  portrait?: string | null;
  className?: string;
};

/**
 * Carte de personnage (grille) — portrait, lueur teintée par élément, badge
 * élément, étoiles, tags d'armes. Réutilisable dans la liste des personnages.
 */
export function DnaCharacterCard({ name, subtitle, element, rarity = 5, weapons = [], portrait, className }: DnaCharacterCardProps) {
  const el = ELEMENTS[element];
  return (
    <div
      className={cn(
        "group relative aspect-[3/4] cursor-pointer overflow-hidden border border-line/25 bg-gradient-to-br from-[rgba(30,26,30,0.6)] to-[rgba(12,11,10,0.9)] transition-all duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-[0_10px_30px_-8px_rgba(0,0,0,0.7)]",
        className,
      )}
    >
      {portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={portrait}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover object-[50%_12%] transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center font-caps text-5xl text-[rgba(236,228,210,0.18)]">{name[0]}</div>
      )}
      {/* lueur teintée par l'élément */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[45%] opacity-50"
        style={{ background: `linear-gradient(180deg, ${el.hex}, transparent 70%)` }}
      />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      <div className="absolute inset-x-2 top-2 z-[2] flex items-center justify-between">
        <DnaElementBadge element={element} size={28} />
        <DnaStars value={rarity} />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-[2] p-3.5">
        <div className="font-display text-[1.32rem] leading-tight text-parch transition-colors group-hover:text-gold-bright">{name}</div>
        {subtitle ? <div className="truncate font-sans text-[0.68rem] text-muted">{subtitle}</div> : null}
        {weapons.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {weapons.map((w) => (
              <span key={w} className="rounded-[3px] border border-white/6 bg-black/30 px-1.5 py-0.5 font-sans text-[0.58rem] text-muted">
                {w}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
