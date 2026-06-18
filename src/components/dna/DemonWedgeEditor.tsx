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

export type { WedgeSlotData } from "./_wedge";

/**
 * Éditeur de Demon Wedges — reproduit la disposition du jeu (8 cases en
 * parallélogrammes penchés vers le centre + sceau central rond), telle que la
 * carte de build existante (`QuickBuildModal`). On ne réinvente PAS la forme.
 *
 * Interactions :
 *  - Les 8 cases EXTÉRIEURES se réorganisent par drag-and-drop (drop = swap).
 *  - Clic sur une case extérieure → ouvre le picker pour cet emplacement.
 *  - Le CENTRE est verrouillé : il ne se déplace pas et n'est jamais une cible
 *    de drop. Son MOD reste changeable via clic (il encode l'élément du perso).
 *
 * NB prototype : drag natif HTML5 (souris/desktop). Pour la prod tactile,
 * basculer sur @dnd-kit (pointer + touch + clavier) — l'API onChange reste la
 * même.
 */

// Disposition des positions, miroir de QuickBuildModal.
const LEFT_ROWS = [[1, 2], [5, 6]];
const RIGHT_ROWS = [[3, 4], [7, 8]];

export type DnaDemonWedgeEditorProps = {
  slots: WedgeSlotData[];
  centerItem: DnaPickerItem | null;
  /** Couleur d'accent (élément du perso) — pilote le dégradé/halo. */
  accentHex?: string;
  scale?: WedgeScale;
  /** Lecture seule : pas de drag ni d'édition. */
  readOnly?: boolean;
  /** Appelé après un swap par drag, avec la nouvelle liste de slots. */
  onChange?: (slots: WedgeSlotData[]) => void;
  /** Clic sur une case extérieure (édition du MOD de cet emplacement). */
  onSlotClick?: (position: number) => void;
  /** Clic sur le centre (changement du MOD central — il reste fixe). */
  onCenterClick?: () => void;
  className?: string;
};

export function DnaDemonWedgeEditor({
  slots,
  centerItem,
  accentHex = "#c2a86a",
  scale = "md",
  readOnly = false,
  onChange,
  onSlotClick,
  onCenterClick,
  className,
}: DnaDemonWedgeEditorProps) {
  const rgb = hexToRgb(accentHex);
  const { at, dragFrom, dragOver, setDragFrom, setDragOver, swap, reset } = useWedgeSwap(slots, onChange);
  const d = WEDGE_DIMS[scale];

  const renderRow = (positions: number[], side: "left" | "right") => (
    <div className={cn("flex", d.gapSlots)}>
      {positions.map((pos) => (
        <WedgeSlotCell
          key={pos}
          slot={at(pos)}
          side={side}
          rgb={rgb}
          dims={d}
          readOnly={readOnly}
          isDragging={dragFrom === pos}
          isOver={dragOver === pos && dragFrom !== pos}
          onPick={() => onSlotClick?.(pos)}
          onDragStart={() => setDragFrom(pos)}
          onDragEnter={() => setDragOver(pos)}
          onDrop={() => { if (dragFrom != null) swap(dragFrom, pos); reset(); }}
          onDragEnd={reset}
        />
      ))}
    </div>
  );

  return (
    <div className={cn("flex items-center justify-center", d.gapCols, className)}>
      <div className={cn("flex flex-col", d.gapRows)}>
        {LEFT_ROWS.map((row, i) => (
          <div key={i}>{renderRow(row, "left")}</div>
        ))}
      </div>

      <button
        type="button"
        onClick={readOnly ? undefined : () => onCenterClick?.()}
        // Verrouillé en position : jamais draggable, jamais cible de drop.
        aria-label={centerItem ? `Demon Wedge central (fixe) : ${centerItem.name}` : "Demon Wedge central (fixe)"}
        className={cn("relative grid shrink-0 place-items-center rounded-full", readOnly ? "cursor-default" : "cursor-pointer")}
        style={{
          height: d.centerH,
          width: d.centerH,
          background: `radial-gradient(circle at center, rgba(${rgb}, 0.7), rgba(8, 14, 30, 0.95))`,
          border: "2px solid rgba(255, 255, 255, 0.55)",
          boxShadow: `0 0 24px rgba(${rgb}, 0.5), inset 0 0 12px rgba(255, 255, 255, 0.15)`,
        }}
      >
        {centerItem?.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={centerItem.icon} alt="" className="h-[72%] w-[72%] object-contain drop-shadow-lg" draggable={false} />
        ) : (
          <span className="text-sm text-parch/50">◆</span>
        )}
      </button>

      <div className={cn("flex flex-col", d.gapRows)}>
        {RIGHT_ROWS.map((row, i) => (
          <div key={i}>{renderRow(row, "right")}</div>
        ))}
      </div>
    </div>
  );
}
