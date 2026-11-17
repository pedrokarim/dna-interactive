"use client";
import { cn } from "./cn";
import type { DnaPickerItem } from "./ItemPicker";
import {
  WEDGE_DIMS,
  WedgeSlotCell,
  useWedgeSwap,
  hexToRgb,
  type WedgeScale,
  type WedgeSlotData,
} from "./_wedge";

/**
 * Éditeur d'arme de consonance, même disposition que la fiche perso : 2 MOD à
 * gauche, l'arme au centre, 2 MOD à droite.
 *
 * Les 4 MOD s'échangent par drag-and-drop et s'éditent au clic (picker).
 * L'arme du centre est celle du perso : verrouillée, ni déplaçable, ni cible de
 * drop, ni remplaçable.
 *
 * Prototype en drag natif HTML5, souris seulement. Pour le tactile, passer à
 * @dnd-kit.
 */

// Slots 1-2 à gauche, 3-4 à droite, comme sur la fiche perso.
const LEFT = [1, 2];
const RIGHT = [3, 4];

export type DnaConsonanceEditorProps = {
  slots: WedgeSlotData[];
  /** L'arme de consonance (verrouillée). */
  weapon: DnaPickerItem | null;
  /** Couleur d'accent, electro par défaut (la teinte d'origine de la consonance). */
  accentHex?: string;
  scale?: WedgeScale;
  readOnly?: boolean;
  onChange?: (slots: WedgeSlotData[]) => void;
  onSlotClick?: (position: number) => void;
  className?: string;
};

export function DnaConsonanceEditor({
  slots,
  weapon,
  accentHex = "#a48ed0",
  scale = "md",
  readOnly = false,
  onChange,
  onSlotClick,
  className,
}: DnaConsonanceEditorProps) {
  const rgb = hexToRgb(accentHex);
  const { at, dragFrom, dragOver, setDragFrom, setDragOver, swap, reset } = useWedgeSwap(slots, onChange);
  const d = WEDGE_DIMS[scale];

  const renderSlot = (pos: number, side: "left" | "right") => (
    <WedgeSlotCell
      key={pos}
      slot={at(pos)}
      side={side}
      rgb={rgb}
      dims={d}
      readOnly={readOnly}
      kindLabel="MOD de consonance"
      isDragging={dragFrom === pos}
      isOver={dragOver === pos && dragFrom !== pos}
      onPick={() => onSlotClick?.(pos)}
      onDragStart={() => setDragFrom(pos)}
      onDragEnter={() => setDragOver(pos)}
      onDrop={() => { if (dragFrom != null) swap(dragFrom, pos); reset(); }}
      onDragEnd={reset}
    />
  );

  return (
    <div className={cn("flex items-center justify-center", d.gapCols, className)}>
      <div className={cn("flex", d.gapSlots)}>{LEFT.map((p) => renderSlot(p, "left"))}</div>

      {/* Arme centrale, verrouillée : pas de drag, pas de drop. */}
      <div
        aria-label={weapon ? `Arme de consonance (verrouillée) : ${weapon.name}` : "Arme de consonance (verrouillée)"}
        className="relative grid shrink-0 cursor-default place-items-center rounded-full"
        style={{
          height: d.centerH + 16,
          width: d.centerH + 16,
          background: `radial-gradient(circle at center, rgba(${rgb}, 0.7), rgba(8, 14, 30, 0.95))`,
          border: "2px solid rgba(255, 255, 255, 0.55)",
          boxShadow: `0 0 24px rgba(${rgb}, 0.5), inset 0 0 12px rgba(255, 255, 255, 0.15)`,
        }}
      >
        {weapon?.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={weapon.icon} alt="" width={96} height={96} className="h-[58%] w-[58%] object-contain drop-shadow-lg" draggable={false} />
        ) : (
          <span className="text-lg text-parch/50">⚔</span>
        )}
        {/* Petit cadenas centré en bas pour signaler le verrouillage. */}
        <span className="absolute -bottom-1 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-white/30 bg-ink text-[0.6rem] leading-none text-gold">
          ⛌
        </span>
      </div>

      <div className={cn("flex", d.gapSlots)}>{RIGHT.map((p) => renderSlot(p, "right"))}</div>
    </div>
  );
}
