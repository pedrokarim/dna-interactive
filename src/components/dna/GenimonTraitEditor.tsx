"use client";

import { cn } from "./cn";

/**
 * Choix des **Traits** greffés sur un Géniemon.
 *
 * L'agencement n'est pas inventé : le jeu dispose les emplacements en couronne
 * autour de la créature, et c'est cette forme qu'on reprend. Une sphère pleine
 * porte le glyphe de son Trait, une sphère vide attend ; cliquer une sphère
 * pleine la libère. Le catalogue, dessous, se parcourt par catégorie.
 *
 * Présentatif : le parent fournit le pool et l'état. Le composant ne connaît ni
 * le catalogue ni la locale, ce qui le rend racontable en story.
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
  /** La créature, au centre de la couronne. */
  portrait?: { name: string; icon: string | null };
  /** « 2 sur 4 emplacements », déjà composé par le parent. */
  countLabel: string;
  /** Phrase affichée quand la couronne est pleine. */
  fullHint?: string;
  /** Intitulé accessible d'une sphère vide. */
  emptySlotLabel?: string;
  className?: string;
};

/**
 * Position d'une sphère sur la couronne, en pourcentage du conteneur.
 *
 * On démarre en haut et on tourne dans le sens horaire : à trois emplacements
 * la figure est un triangle, à quatre un losange – ce que montre le jeu.
 */
function slotPosition(index: number, total: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    left: `${50 + Math.cos(angle) * 38}%`,
    top: `${50 + Math.sin(angle) * 38}%`,
  };
}

export function DnaGenimonTraitEditor({
  groups,
  selected,
  max,
  onChange,
  portrait,
  countLabel,
  fullHint,
  emptySlotLabel,
  className,
}: Props) {
  const isFull = selected.length >= max;
  const byKey = new Map(groups.flatMap((g) => g.traits).map((t) => [t.key, t]));

  function toggle(key: string) {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
      return;
    }
    // Atteindre la limite ne doit pas bloquer sans rien dire : on libère le
    // plus ancien choix, ce qui laisse toujours une issue au clic.
    if (isFull) {
      onChange([...selected.slice(1), key]);
      return;
    }
    onChange([...selected, key]);
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* ------------------------------------------------- la couronne */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative aspect-square w-full max-w-[17rem]">
          {/* Le cercle de liaison, tracé en CSS : jamais un glyphe. */}
          <span
            aria-hidden
            className="absolute inset-[12%] rounded-full border border-dashed border-white/12"
          />
          {portrait?.icon ? (
            <span className="absolute left-1/2 top-1/2 grid h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 place-items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portrait.icon} alt={portrait.name} className="h-full w-full object-contain" />
            </span>
          ) : null}

          {Array.from({ length: max }, (_, i) => {
            const key = selected[i];
            const trait = key ? byKey.get(key) : null;
            const style = { ...slotPosition(i, max), transform: "translate(-50%, -50%)" };
            return trait ? (
              <button
                key={i}
                type="button"
                onClick={() => toggle(trait.key)}
                title={`${trait.name} — ${trait.effect}`}
                aria-label={trait.name}
                style={style}
                className="absolute grid h-14 w-14 place-items-center rounded-full border border-gold/45 bg-gold/10 transition-colors hover:border-crimson-bright/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                {trait.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={trait.icon} alt="" width={30} height={30} className="h-[30px] w-[30px]" />
                ) : (
                  <span className="text-[0.62rem] text-parch">{trait.name.slice(0, 3)}</span>
                )}
              </button>
            ) : (
              <span
                key={i}
                aria-label={emptySlotLabel}
                style={style}
                className="absolute grid h-14 w-14 place-items-center rounded-full border border-dashed border-white/25 bg-ink/40 text-lg leading-none text-muted-2"
              >
                ＋
              </span>
            );
          })}
        </div>

        <p className="font-caps text-[0.62rem] uppercase tracking-[0.2em] text-muted">{countLabel}</p>
        {isFull && fullHint ? <p className="text-center text-xs text-muted-2">{fullHint}</p> : null}
      </div>

      {/* ------------------------------------------------ le catalogue */}
      <div className="space-y-4 border-t border-white/10 pt-5">
        {groups.map((group) => (
          <section key={group.category}>
            <h3 className="flex items-center gap-2 font-caps text-[0.6rem] uppercase tracking-[0.2em] text-muted">
              {group.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={group.icon} alt="" width={18} height={18} className="h-[18px] w-[18px] opacity-80" />
              ) : null}
              {group.label}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
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
                      "inline-flex items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-3 text-left transition-colors",
                      active
                        ? "border-gold/55 bg-gold/12 text-parch"
                        : "border-white/10 bg-panel/45 text-parch/85 hover:border-white/30",
                    )}
                  >
                    {trait.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={trait.icon} alt="" width={20} height={20} loading="lazy" className="h-5 w-5 shrink-0" />
                    ) : null}
                    <span className="text-[0.78rem] leading-none">{trait.name}</span>
                    {active ? (
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-gold/85 font-mono text-[0.58rem] leading-none text-ink">
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
    </div>
  );
}
