"use client";

import { cn } from "./cn";

/**
 * Choix des **Traits** greffés sur un Géniemon.
 *
 * Présentatif : le parent fournit le pool et l'état. Le composant ne connaît
 * ni le catalogue ni la locale, ce qui le rend racontable en story.
 *
 * L'ordre de sélection est conservé : il se lit comme une priorité de farm, et
 * non comme un emplacement – le jeu ne fixe pas quel Trait va dans quelle
 * sphère.
 */

export interface DnaTraitOption {
  key: string;
  name: string;
  effect: string;
  /** Catégorie du jeu : battle, base, speed, world. */
  category: string;
  /** Rareté la plus haute à laquelle le Trait existe. */
  rarity: number;
  /** Glyphe du jeu, déjà teinté par la rareté. */
  icon: string | null;
}

export interface DnaTraitCategoryGroup {
  category: string;
  label: string;
  /** Glyphe neutre de la catégorie. */
  icon: string | null;
  traits: DnaTraitOption[];
}

type Props = {
  groups: DnaTraitCategoryGroup[];
  /** Clés sélectionnées, dans l'ordre de choix. */
  selected: string[];
  /** Emplacements ouverts par la créature : 3, ou 4 si elle est scintillante. */
  max: number;
  onChange: (keys: string[]) => void;
  /** « 2 / 4 », déjà composé par le parent qui sait formater les nombres. */
  countLabel: string;
  /** Phrase affichée quand la limite est atteinte. */
  fullHint?: string;
  className?: string;
};

export function DnaGenimonTraitEditor({
  groups,
  selected,
  max,
  onChange,
  countLabel,
  fullHint,
  className,
}: Props) {
  const isFull = selected.length >= max;

  function toggle(key: string) {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
      return;
    }
    // Atteindre la limite ne doit pas bloquer sans rien dire : on remplace le
    // plus ancien choix, comme le fait le jeu quand on greffe sur un plein.
    if (isFull) {
      onChange([...selected.slice(1), key]);
      return;
    }
    onChange([...selected, key]);
  }

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-caps text-[0.62rem] uppercase tracking-[0.2em] text-muted">{countLabel}</span>
        {isFull && fullHint ? <span className="text-xs text-muted-2">{fullHint}</span> : null}
      </div>

      {groups.map((group) => (
        <section key={group.category}>
          <h3 className="flex items-center gap-2 font-display text-base text-parch">
            {group.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.icon} alt="" width={22} height={22} className="h-[22px] w-[22px] opacity-90" />
            ) : null}
            {group.label}
          </h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {group.traits.map((trait) => {
              const rank = selected.indexOf(trait.key);
              const active = rank !== -1;
              return (
                <button
                  key={trait.key}
                  type="button"
                  onClick={() => toggle(trait.key)}
                  aria-pressed={active}
                  title={trait.effect}
                  className={cn(
                    "flex items-start gap-2.5 border px-3 py-2 text-left transition-colors",
                    active
                      ? "border-gold/50 bg-gold/10"
                      : "border-white/10 bg-panel/45 hover:border-white/25",
                  )}
                >
                  {trait.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={trait.icon} alt="" width={24} height={24} loading="lazy" className="mt-0.5 h-6 w-6 shrink-0" />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-parch">{trait.name}</span>
                    <span className="mt-0.5 block line-clamp-2 text-[0.7rem] leading-snug text-muted">{trait.effect}</span>
                  </span>
                  {active ? (
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/85 font-mono text-[0.62rem] leading-none text-ink">
                      {rank + 1}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
