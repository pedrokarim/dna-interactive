"use client";
import { useState } from "react";
import { cn } from "./cn";
import { DnaChip } from "./Chip";

/**
 * Liste de priorités ordonnée et réordonnable au drag (priorités de stats ou de
 * compétences du build). Le rang = la position (1 = plus prioritaire). On peut
 * retirer un item et, si un `pool` est fourni, en ajouter depuis le reste.
 *
 * NB prototype : drag natif HTML5 (souris). Prod tactile → @dnd-kit.
 */

export type PriorityItem = {
  id: string;
  label: string;
  sublabel?: string;
  icon?: string | null;
};

export type DnaPriorityListProps = {
  items: PriorityItem[];
  /** Ensemble sélectionnable ; les items absents de `items` deviennent ajoutables. */
  pool?: PriorityItem[];
  max?: number;
  addLabel?: string;
  readOnly?: boolean;
  /** Notifie tout changement (réordonnancement, ajout, retrait). */
  onChange?: (items: PriorityItem[]) => void;
  className?: string;
};

export function DnaPriorityList({
  items,
  pool,
  max,
  addLabel = "Ajouter",
  readOnly = false,
  onChange,
  className,
}: DnaPriorityListProps) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const remaining = (pool ?? []).filter((p) => !items.some((it) => it.id === p.id));
  const canAdd = !readOnly && pool != null && remaining.length > 0 && (max == null || items.length < max);

  function move(from: number, to: number) {
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange?.(next);
  }

  function reset() {
    setDragFrom(null);
    setDragOver(null);
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {items.map((it, i) => (
        <div
          key={it.id}
          draggable={!readOnly}
          onDragStart={readOnly ? undefined : () => setDragFrom(i)}
          onDragEnter={readOnly ? undefined : () => setDragOver(i)}
          onDragOver={readOnly ? undefined : (e) => e.preventDefault()}
          onDrop={readOnly ? undefined : (e) => { e.preventDefault(); if (dragFrom != null) move(dragFrom, i); reset(); }}
          onDragEnd={reset}
          className={cn(
            "flex items-center gap-2.5 border bg-gradient-to-b from-[rgba(34,29,21,0.55)] to-[rgba(14,12,9,0.8)] px-2.5 py-2 transition-[transform,border-color]",
            !readOnly && "cursor-grab active:cursor-grabbing",
            dragFrom === i && "opacity-40",
            dragOver === i && dragFrom !== i ? "border-gold" : "border-white/8",
          )}
        >
          {/* Rang */}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-caps text-[0.6rem] leading-none text-gold">
            {i + 1}
          </span>
          {it.icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={it.icon} alt="" className="h-6 w-6 shrink-0 object-contain" draggable={false} />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-sm text-parch">{it.label}</p>
            {it.sublabel && <p className="truncate font-sans text-[0.7rem] text-muted-2">{it.sublabel}</p>}
          </div>
          {!readOnly && (
            <>
              <span aria-hidden className="shrink-0 select-none text-muted-2" title="Glisser pour réordonner">
                ⠿
              </span>
              <button
                type="button"
                onClick={() => onChange?.(items.filter((_, idx) => idx !== i))}
                aria-label="Retirer"
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/20 bg-ink/80 text-[0.7rem] leading-none text-muted hover:border-crimson-bright hover:text-[#ffb3a6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-bright/70"
              >
                ×
              </button>
            </>
          )}
        </div>
      ))}

      {items.length === 0 && (
        <p className="py-3 text-center font-sans text-xs text-muted-2">Aucune priorité définie.</p>
      )}

      {canAdd &&
        (adding ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {remaining.map((p) => (
              <DnaChip
                key={p.id}
                onClick={() => {
                  onChange?.([...items, p]);
                  if (remaining.length <= 1) setAdding(false);
                }}
              >
                + {p.label}
              </DnaChip>
            ))}
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-sm font-caps text-[0.55rem] uppercase tracking-[0.16em] text-muted-2 hover:text-parch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              Fermer
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-0.5 flex items-center justify-center gap-1 border border-dashed border-white/20 bg-white/2 py-1.5 font-caps text-[0.55rem] uppercase tracking-[0.16em] text-muted-2 transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <span aria-hidden className="text-sm leading-none">＋</span> {addLabel}
          </button>
        ))}
    </div>
  );
}
