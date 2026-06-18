"use client";
import { useState } from "react";
import { cn } from "./cn";
import { ELEMENTS } from "./elements";
import type { DnaPickerItem } from "./ItemPicker";

/**
 * Briques internes partagées par les éditeurs en « pétales » qui imitent le jeu
 * (Demon Wedges, arme de consonance) : cases en parallélogrammes penchées vers
 * le centre + mécanique de drag-and-drop (drop = swap). Non exporté dans le
 * barrel — détail d'implémentation.
 */

export type WedgeSlotData = {
  position: number;
  item: DnaPickerItem | null;
  track?: number | null;
};

export type WedgeScale = "xl" | "lg" | "md" | "sm";

export const CLIP_LEFT = "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)";
export const CLIP_RIGHT = "polygon(0% 0%, 80% 0%, 100% 100%, 20% 100%)";

export const WEDGE_DIMS: Record<WedgeScale, {
  slotH: number; slotW: number; centerH: number;
  gapSlots: string; gapRows: string; gapCols: string;
}> = {
  xl: { slotH: 124, slotW: 94, centerH: 116, gapSlots: "gap-3", gapRows: "gap-4", gapCols: "gap-5" },
  lg: { slotH: 108, slotW: 82, centerH: 100, gapSlots: "gap-2", gapRows: "gap-3", gapCols: "gap-4" },
  md: { slotH: 88, slotW: 66, centerH: 84, gapSlots: "gap-1.5", gapRows: "gap-2.5", gapCols: "gap-3" },
  sm: { slotH: 72, slotW: 56, centerH: 72, gapSlots: "gap-1.5", gapRows: "gap-2", gapCols: "gap-3" },
};

export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/**
 * État + logique de réorganisation par drag d'un ensemble de slots positionnés.
 * Le swap échange item + track entre deux positions et notifie via onChange.
 */
export function useWedgeSwap(slots: WedgeSlotData[], onChange?: (slots: WedgeSlotData[]) => void) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const at = (pos: number): WedgeSlotData =>
    slots.find((s) => s.position === pos) ?? { position: pos, item: null, track: null };

  function swap(from: number, to: number) {
    if (from === to) return;
    const a = at(from);
    const b = at(to);
    const next = slots
      .filter((s) => s.position !== from && s.position !== to)
      .concat({ ...a, position: to }, { ...b, position: from })
      .sort((x, y) => x.position - y.position);
    onChange?.(next);
  }

  function reset() {
    setDragFrom(null);
    setDragOver(null);
  }

  return { at, dragFrom, dragOver, setDragFrom, setDragOver, swap, reset };
}

/** Une case en parallélogramme (drag + clic). Le centre est géré à part. */
export function WedgeSlotCell({
  slot,
  side,
  rgb,
  dims,
  readOnly,
  isDragging,
  isOver,
  kindLabel = "Demon Wedge",
  onPick,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragEnd,
}: {
  slot: WedgeSlotData;
  side: "left" | "right";
  rgb: string;
  dims: typeof WEDGE_DIMS[WedgeScale];
  readOnly: boolean;
  isDragging: boolean;
  isOver: boolean;
  kindLabel?: string;
  onPick: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const clip = side === "left" ? CLIP_LEFT : CLIP_RIGHT;
  const cornerSide = side === "left" ? "right-1" : "left-1";
  const icon = slot.item?.icon;
  const draggable = !readOnly && Boolean(slot.item);

  return (
    <button
      type="button"
      draggable={draggable}
      onClick={readOnly ? undefined : onPick}
      onDragStart={draggable ? onDragStart : undefined}
      onDragEnter={readOnly ? undefined : onDragEnter}
      onDragOver={readOnly ? undefined : (e) => e.preventDefault()}
      onDrop={readOnly ? undefined : (e) => { e.preventDefault(); onDrop(); }}
      onDragEnd={onDragEnd}
      aria-label={slot.item ? `${kindLabel} ${slot.position} : ${slot.item.name}` : `Emplacement ${slot.position} vide`}
      className={cn(
        "relative shrink-0 transition-[opacity,transform]",
        draggable ? "cursor-grab active:cursor-grabbing" : readOnly ? "cursor-default" : "cursor-pointer",
        isDragging && "opacity-40",
        isOver && "scale-105",
      )}
      style={{
        height: dims.slotH,
        width: dims.slotW,
        clipPath: clip,
        background: isOver
          ? `linear-gradient(135deg, rgba(${rgb}, 0.6) 0%, rgba(8, 14, 30, 0.9) 100%)`
          : `linear-gradient(135deg, rgba(${rgb}, 0.35) 0%, rgba(8, 14, 30, 0.9) 100%)`,
        border: isOver ? "1.5px solid #e3cd95" : "1.5px solid rgba(255, 255, 255, 0.5)",
      }}
    >
      <span className="absolute inset-0 flex items-center justify-center">
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="h-[56%] w-[56%] object-contain drop-shadow-md" draggable={false} />
        ) : (
          <span className="text-xs text-parch/40">＋</span>
        )}
      </span>
      {slot.item?.element && (
        <span
          aria-hidden
          className={cn("absolute top-1 h-2 w-2 rounded-full", cornerSide)}
          style={{ backgroundColor: ELEMENTS[slot.item.element].hex }}
        />
      )}
      {slot.track != null && (
        <span className={cn("absolute bottom-0.5 flex h-4 w-4 items-center justify-center rounded border border-gold/70 bg-black/70 text-[0.55rem] leading-none text-gold", side === "left" ? "left-1" : "right-1")}>
          {slot.track}
        </span>
      )}
    </button>
  );
}
