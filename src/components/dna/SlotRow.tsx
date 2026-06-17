"use client";
import { useState } from "react";
import { cn } from "./cn";
import { ELEMENTS } from "./elements";
import { DnaStars } from "./RarityStars";
import { DnaTag } from "./Tag";
import { DnaButton } from "./Button";
import { DnaItemPicker, type DnaPickerItem } from "./ItemPicker";

/**
 * Rangée d'emplacements (armes ou génimons) : jusqu'à `max` items, chacun avec
 * un rang best/alternative. Cliquer un emplacement (ou « + ») ouvre le
 * `DnaItemPicker` dans un overlay pour le remplir/remplacer. C'est le maillon
 * qui boucle l'intégration picker → emplacement du builder.
 */

export type SlotEntry = {
  item: DnaPickerItem;
  rank: "best" | "alternative";
};

export type DnaSlotRowProps = {
  entries: SlotEntry[];
  /** Items sélectionnables proposés dans le picker. */
  pool: DnaPickerItem[];
  /** Nb max d'emplacements (défaut 3). */
  max?: number;
  /** Titre affiché en en-tête du picker. */
  label?: string;
  /** Active les rangs best/alternative (défaut true). */
  allowRanks?: boolean;
  readOnly?: boolean;
  pickerColumns?: number;
  onChange?: (entries: SlotEntry[]) => void;
  className?: string;
};

export function DnaSlotRow({
  entries,
  pool,
  max = 3,
  label = "Choisir un item",
  allowRanks = true,
  readOnly = false,
  pickerColumns = 4,
  onChange,
  className,
}: DnaSlotRowProps) {
  // null = fermé ; -1 = ajout ; >=0 = remplacement de l'index.
  const [pickerFor, setPickerFor] = useState<number | null>(null);

  const usedIds = entries
    .filter((_, i) => i !== pickerFor)
    .map((e) => e.item.id);

  function commit(next: SlotEntry[]) {
    onChange?.(next);
  }

  function pick(item: DnaPickerItem) {
    if (pickerFor === null) return;
    if (pickerFor === -1) {
      commit([...entries, { item, rank: entries.length === 0 ? "best" : "alternative" }]);
    } else {
      commit(entries.map((e, i) => (i === pickerFor ? { ...e, item } : e)));
    }
    setPickerFor(null);
  }

  function remove(i: number) {
    const next = entries.filter((_, idx) => idx !== i);
    // Garantir qu'il reste un « best » si des entrées subsistent.
    if (allowRanks && next.length && !next.some((e) => e.rank === "best")) {
      next[0] = { ...next[0], rank: "best" };
    }
    commit(next);
  }

  function setBest(i: number) {
    commit(entries.map((e, idx) => ({ ...e, rank: idx === i ? "best" : "alternative" })));
  }

  return (
    <div className={cn("flex flex-wrap items-stretch gap-2", className)}>
      {entries.map((e, i) => (
        <SlotCard
          key={`${e.item.id}-${i}`}
          entry={e}
          allowRanks={allowRanks}
          readOnly={readOnly}
          onReplace={() => setPickerFor(i)}
          onRemove={() => remove(i)}
          onSetBest={() => setBest(i)}
        />
      ))}

      {!readOnly && entries.length < max && (
        <button
          type="button"
          onClick={() => setPickerFor(-1)}
          className="flex w-28 flex-col items-center justify-center gap-1 border border-dashed border-white/20 bg-white/2 p-2 text-muted-2 transition-colors hover:border-gold hover:text-gold"
        >
          <span className="text-2xl leading-none">＋</span>
          <span className="font-caps text-[0.55rem] uppercase tracking-[0.16em]">Ajouter</span>
        </button>
      )}

      {pickerFor !== null && (
        <PickerOverlay
          label={label}
          pool={pool}
          usedIds={usedIds}
          columns={pickerColumns}
          onSelect={pick}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  );
}

function SlotCard({
  entry,
  allowRanks,
  readOnly,
  onReplace,
  onRemove,
  onSetBest,
}: {
  entry: SlotEntry;
  allowRanks: boolean;
  readOnly: boolean;
  onReplace: () => void;
  onRemove: () => void;
  onSetBest: () => void;
}) {
  const { item, rank } = entry;
  const isBest = rank === "best";
  return (
    <div
      className={cn(
        "relative flex w-28 flex-col items-center gap-1.5 border bg-gradient-to-b from-[rgba(34,29,21,0.55)] to-[rgba(14,12,9,0.8)] p-2.5 text-center",
        isBest ? "border-gold/60" : "border-white/8",
      )}
    >
      {/* Barre supérieure : pastille d'élément + retrait, centrés sur la même ligne. */}
      <div className="absolute inset-x-1 top-1 z-[3] flex h-4 items-center justify-between">
        {item.element ? (
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: ELEMENTS[item.element].hex }} />
        ) : (
          <span aria-hidden className="h-2 w-2" />
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Retirer"
            className="flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-ink/80 text-[0.7rem] leading-none text-muted hover:border-crimson-bright hover:text-[#ffb3a6]"
          >
            ×
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={readOnly ? undefined : onReplace}
        className={cn("grid aspect-square w-full place-items-center bg-black/25", readOnly ? "cursor-default" : "cursor-pointer")}
        title={readOnly ? item.name : `${item.name} — cliquer pour remplacer`}
      >
        {item.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.icon} alt={item.name} className="h-[82%] w-[82%] object-contain" />
        ) : (
          <span className="font-display text-2xl text-muted-2">◇</span>
        )}
      </button>
      <span className="line-clamp-2 min-h-[2.1em] font-sans text-[0.72rem] leading-tight text-parch">{item.name}</span>
      {item.rarity != null && <DnaStars value={item.rarity} />}
      {allowRanks &&
        (readOnly ? (
          <DnaTag tone={isBest ? "gold" : "crimson"}>{isBest ? "Best" : "Alt"}</DnaTag>
        ) : (
          <button type="button" onClick={onSetBest} className="inline-flex" title={isBest ? "Meilleur choix" : "Définir comme meilleur"}>
            <DnaTag tone={isBest ? "gold" : "crimson"}>{isBest ? "Best" : "Alt"}</DnaTag>
          </button>
        ))}
    </div>
  );
}

function PickerOverlay({
  label,
  pool,
  usedIds,
  columns,
  onSelect,
  onClose,
}: {
  label: string;
  pool: DnaPickerItem[];
  usedIds: string[];
  columns: number;
  onSelect: (item: DnaPickerItem) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col border border-line/25 bg-panel/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-caps text-xs uppercase tracking-[0.18em] text-gold">{label}</h3>
          <DnaButton onClick={onClose} className="px-3 py-1.5 text-xs">
            Fermer
          </DnaButton>
        </div>
        <div className="min-h-0 overflow-y-auto pr-1">
          <DnaItemPicker items={pool} usedIds={usedIds} columns={columns} onSelect={onSelect} />
        </div>
      </div>
    </div>
  );
}
