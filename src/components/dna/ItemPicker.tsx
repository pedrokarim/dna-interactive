"use client";
import { useMemo, useState } from "react";
import { cn } from "./cn";
import { DnaField } from "./Field";
import { DnaChip } from "./Chip";
import { DnaStars } from "./RarityStars";
import { ELEMENTS, type ElementKey } from "./elements";

/**
 * Forme « résolue » légère d'un item, miroir de ce que produit
 * `resolveItemRef` côté lib (nom/icône/rareté/élément/polarité). Le picker ne
 * dépend volontairement PAS du JSON brut : il se nourrit de cette projection,
 * ce qui le rend prototypable en Storybook avec des fixtures.
 */
export type DnaPickerItem = {
  id: string;
  name: string;
  icon?: string | null;
  rarity?: number | null;
  element?: ElementKey | null;
  /** Track de polarité (1–4) pour les MOD ; null pour armes/génimons. */
  polarity?: number | null;
};

/** Libellés de track de polarité (MOD). Réf data : Polarity_<n>_Name. */
const POLARITY_LABELS: Record<number, string> = {
  1: "Assaut",
  2: "Soin",
  3: "Capacité",
  4: "Spécialisation",
};

export type DnaItemPickerProps = {
  items: DnaPickerItem[];
  /** Item couramment retenu pour l'emplacement édité (mise en avant). */
  selectedId?: string | null;
  /** Items déjà placés ailleurs (grisés + coche), pour éviter les doublons. */
  usedIds?: string[];
  onSelect?: (item: DnaPickerItem) => void;
  placeholder?: string;
  /** Nb de colonnes de la grille (défaut 4). */
  columns?: number;
  className?: string;
  emptyLabel?: string;
};

/**
 * Sélecteur d'item filtrable (recherche + rareté + élément + polarité).
 * Brique de base du builder (armes / génimons / MOD-Demon Wedges / consonances).
 * Les filtres élément/polarité ne s'affichent que si au moins un item les porte.
 */
export function DnaItemPicker({
  items,
  selectedId,
  usedIds,
  onSelect,
  placeholder = "Rechercher…",
  columns = 4,
  className,
  emptyLabel = "Aucun item ne correspond.",
}: DnaItemPickerProps) {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<number | null>(null);
  const [element, setElement] = useState<ElementKey | null>(null);
  const [polarity, setPolarity] = useState<number | null>(null);

  const used = useMemo(() => new Set(usedIds ?? []), [usedIds]);

  // Facettes disponibles, déduites des items fournis.
  const facets = useMemo(() => {
    const rarities = new Set<number>();
    const elements = new Set<ElementKey>();
    const polarities = new Set<number>();
    for (const it of items) {
      if (it.rarity != null) rarities.add(it.rarity);
      if (it.element) elements.add(it.element);
      if (it.polarity != null) polarities.add(it.polarity);
    }
    return {
      rarities: [...rarities].sort((a, b) => b - a),
      elements: [...elements],
      polarities: [...polarities].sort((a, b) => a - b),
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (q && !it.name.toLowerCase().includes(q)) return false;
      if (rarity != null && it.rarity !== rarity) return false;
      if (element != null && it.element !== element) return false;
      if (polarity != null && it.polarity !== polarity) return false;
      return true;
    });
  }, [items, query, rarity, element, polarity]);

  const hasFilters = query || rarity != null || element != null || polarity != null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Barre de recherche */}
      <div className="flex items-center gap-2">
        <DnaField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          wrapClassName="flex-1"
        />
        <span className="shrink-0 font-caps text-[0.6rem] uppercase tracking-[0.16em] text-muted-2">
          {filtered.length}/{items.length}
        </span>
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-2">
        {facets.rarities.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {facets.rarities.map((r) => (
              <DnaChip key={r} selected={rarity === r} onClick={() => setRarity(rarity === r ? null : r)}>
                {r}★
              </DnaChip>
            ))}
          </div>
        )}
        {facets.elements.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {facets.elements.map((el) => (
              <DnaChip
                key={el}
                color={ELEMENTS[el].hex}
                selected={element === el}
                onClick={() => setElement(element === el ? null : el)}
              >
                {ELEMENTS[el].label}
              </DnaChip>
            ))}
          </div>
        )}
        {facets.polarities.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {facets.polarities.map((p) => (
              <DnaChip key={p} selected={polarity === p} onClick={() => setPolarity(polarity === p ? null : p)}>
                {POLARITY_LABELS[p] ?? `Track ${p}`}
              </DnaChip>
            ))}
          </div>
        )}
      </div>

      {/* Grille d'items */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center font-sans text-sm text-muted-2">
          {hasFilters ? emptyLabel : "Liste vide."}
        </p>
      ) : (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {filtered.map((it) => (
            <ItemCell
              key={it.id}
              item={it}
              selected={it.id === selectedId}
              used={used.has(it.id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCell({
  item,
  selected,
  used,
  onSelect,
}: {
  item: DnaPickerItem;
  selected: boolean;
  used: boolean;
  onSelect?: (item: DnaPickerItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      title={item.name}
      className={cn(
        "group relative flex flex-col items-center gap-1.5 overflow-hidden border bg-gradient-to-b from-[rgba(34,29,21,0.55)] to-[rgba(14,12,9,0.8)] p-2.5 text-center transition-all hover:-translate-y-0.5 hover:border-gold",
        selected ? "border-gold shadow-[0_0_0_1px_var(--color-gold,#c2a86a)]" : "border-white/8",
        used && "opacity-45 grayscale",
      )}
    >
      {/* Barre supérieure : pastille d'élément + coche « déjà utilisé », alignées. */}
      <div className="absolute inset-x-1 top-1 z-[3] flex h-4 items-center justify-between">
        {item.element ? (
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: ELEMENTS[item.element].hex }} />
        ) : (
          <span aria-hidden className="h-2 w-2" />
        )}
        {used && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[0.6rem] leading-none text-[#1a1206]">
            ✓
          </span>
        )}
      </div>
      <span className="relative grid aspect-square w-full place-items-center bg-black/25">
        {item.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.icon} alt={item.name} className="h-[82%] w-[82%] object-contain" loading="lazy" />
        ) : (
          <span className="font-display text-2xl text-muted-2">◇</span>
        )}
      </span>
      <span className="line-clamp-2 min-h-[2.1em] font-sans text-[0.72rem] leading-tight text-parch group-hover:text-gold-bright">
        {item.name}
      </span>
      {item.rarity != null && <DnaStars value={item.rarity} />}
    </button>
  );
}
