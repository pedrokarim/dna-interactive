"use client";
import { cn } from "./cn";
import type { DnaPickerItem } from "./ItemPicker";
import {
  TrackShiftToggle,
  WEDGE_DIMS,
  WedgeSlotCell,
  canTrackShift,
  useWedgeSwap,
  hexToRgb,
  type WedgeScale,
  type WedgeSlotData,
} from "./_wedge";

export type { WedgeSlotData } from "./_wedge";

/**
 * Éditeur de Demon Wedges, avec la disposition du jeu et de la carte de build
 * (`QuickBuildModal`) : 8 cases en parallélogrammes penchés vers le centre et un
 * sceau rond au milieu.
 *
 * Les 8 cases extérieures s'échangent par glisser-déposer, un clic ouvre le picker
 * de la case. Le centre ne bouge pas et ne reçoit jamais de drop, mais un clic
 * change son MOD (il porte l'élément du perso). Il reçoit un Track-Shift comme
 * les autres : c'est le slot 09 de l'armurerie.
 *
 * Drag HTML5 natif, donc souris seulement. Pour le tactile il faudra passer à
 * @dnd-kit (pointeur, touch, clavier), onChange restera le même.
 */

// Disposition des positions, miroir de QuickBuildModal.
const LEFT_ROWS = [[1, 2], [5, 6]];
const RIGHT_ROWS = [[3, 4], [7, 8]];

export type DnaDemonWedgeEditorProps = {
  slots: WedgeSlotData[];
  centerItem: DnaPickerItem | null;
  /** Couleur d'accent (élément du perso), pour le dégradé et le halo. */
  accentHex?: string;
  scale?: WedgeScale;
  /** Lecture seule : pas de drag ni d'édition. */
  readOnly?: boolean;
  /** Appelé après un swap par drag, avec la nouvelle liste de slots. */
  onChange?: (slots: WedgeSlotData[]) => void;
  /** Clic sur une case extérieure (édition du MOD de cet emplacement). */
  onSlotClick?: (position: number) => void;
  /** Active ou retire le Track-Shift d'une case. Sa valeur est toujours la
   *  polarité du Wedge posé, on ne la choisit pas. */
  onToggleTrack?: (position: number) => void;
  trackLabel?: string;
  /** Clic sur le centre, pour changer le MOD central (la case reste fixe). */
  onCenterClick?: () => void;
  /** Piste du centre : la polarité de la pièce centrale, ou null sans module. */
  centerTrack?: number | null;
  /** Pose ou retire le Track-Shift du centre. */
  onToggleCenterTrack?: () => void;
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
  onToggleTrack,
  trackLabel,
  onCenterClick,
  centerTrack = null,
  onToggleCenterTrack,
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
          onToggleTrack={readOnly || !onToggleTrack ? undefined : () => onToggleTrack(pos)}
          trackLabel={trackLabel}
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

      <div className="relative shrink-0" style={{ height: d.centerH, width: d.centerH }}>
      <button
        type="button"
        onClick={readOnly ? undefined : () => onCenterClick?.()}
        // Fixe : ni draggable, ni cible de drop.
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
          <img src={centerItem.icon} alt="" width={96} height={96} className="h-[72%] w-[72%] object-contain drop-shadow-lg" draggable={false} />
        ) : (
          <span className="text-sm text-parch/50">◆</span>
        )}
      </button>
        <TrackShiftToggle
          active={centerTrack != null}
          onToggle={!readOnly && onToggleCenterTrack && canTrackShift(centerItem) ? onToggleCenterTrack : undefined}
          label={trackLabel ?? "Track-Shift"}
          // Sur le bord du cercle, à 45°, comme le badge de polarité du jeu.
          className="bottom-2 right-2"
        />
      </div>

      <div className={cn("flex flex-col", d.gapRows)}>
        {RIGHT_ROWS.map((row, i) => (
          <div key={i}>{renderRow(row, "right")}</div>
        ))}
      </div>
    </div>
  );
}
