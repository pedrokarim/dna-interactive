"use client";

import { useTranslations } from "next-intl";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { DnaSwitch } from "@/components/dna";
import {
  PERSONAL_COLORS,
  editingPersonalAtom,
  personalIconSvg,
  personalMarkersAtom,
  showPersonalMarkersAtom,
} from "@/lib/map/personal";

/** Section « Mes marqueurs » en tête du panneau : visibilité + liste de la carte courante. */
export function PersonalSection({
  mapId,
  onLocate,
}: {
  mapId: string;
  onLocate: (point: { x: number; y: number }) => void;
}) {
  const t = useTranslations("map");
  const markers = useAtomValue(personalMarkersAtom).filter((m) => m.mapId === mapId);
  const [show, setShow] = useAtom(showPersonalMarkersAtom);
  const setEditing = useSetAtom(editingPersonalAtom);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-sans text-[0.72rem] text-muted">
          {t("personalCount", { count: markers.length })}
        </span>
        <DnaSwitch checked={show} onChange={setShow} aria-label={t("showPersonalMarkers")} />
      </div>
      {markers.length === 0 ? (
        <p className="border border-dashed border-line/20 px-2.5 py-2 font-sans text-[0.72rem] leading-relaxed text-muted-2">
          {t("personalEmpty")}
        </p>
      ) : (
        <ul className="max-h-44 space-y-0.5 overflow-y-auto custom-scrollbar">
          {markers.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  onLocate({ x: m.x, y: m.y });
                  setEditing(m.id);
                }}
                className="flex w-full items-center gap-2 px-1.5 py-1 text-left transition-colors hover:bg-white/5"
              >
                <span
                  aria-hidden
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full border bg-ink-2"
                  style={{ borderColor: PERSONAL_COLORS[m.color] }}
                  dangerouslySetInnerHTML={{ __html: personalIconSvg(m.icon, PERSONAL_COLORS[m.color], 13) }}
                />
                <span className="min-w-0 flex-1 truncate font-sans text-[0.78rem] text-parch/90">
                  {m.label || <span className="italic text-muted">{t("personalUntitled")}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
