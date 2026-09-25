"use client";

import { useTranslations } from "next-intl";
import { useAtom } from "jotai";
import { AnimatePresence, motion } from "framer-motion";
import { MAP_EASE } from "./ActiveTypesRail";
import { X } from "lucide-react";
import { GlyphIcons } from "@/components/icons/GameGlyph";
import { cn, DnaCornerBrackets } from "@/components/dna";
import {
  PERSONAL_COLORS,
  PERSONAL_ICONS,
  editingPersonalAtom,
  personalIconSvg,
  personalMarkersAtom,
  type PersonalColor,
  type PersonalIcon,
  type PersonalMarker,
} from "@/lib/map/personal";

/** Fiche d'édition d'un marqueur personnel, flottante à droite de la carte. */
export function PersonalEditor() {
  const [editing] = useAtom(editingPersonalAtom);
  return (
    <AnimatePresence>
      {editing && (
        <motion.div
          key={editing}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.22, ease: MAP_EASE }}
        >
          <EditorCard />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EditorCard() {
  const t = useTranslations("map");
  const [editing, setEditing] = useAtom(editingPersonalAtom);
  const [markers, setMarkers] = useAtom(personalMarkersAtom);
  const marker = markers.find((m) => m.id === editing);
  if (!marker) return null;

  const patch = (p: Partial<PersonalMarker>) =>
    setMarkers((prev) => prev.map((m) => (m.id === marker.id ? { ...m, ...p } : m)));

  return (
    <section
      aria-label={t("personalMarker")}
      className="pointer-events-auto relative w-[300px] border border-line/30 bg-ink/95 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md"
    >
      <DnaCornerBrackets size={12} />
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-caps text-[0.55rem] uppercase tracking-[0.24em] text-gold/80">{t("personalMarker")}</h2>
        <button type="button" onClick={() => setEditing(null)} aria-label={t("close")} className="text-muted hover:text-parch">
          <X className="h-4 w-4" />
        </button>
      </div>
      <input
        // Nouveau marqueur : on tape son nom directement.
        autoFocus={!marker.label}
        value={marker.label}
        maxLength={60}
        onChange={(e) => patch({ label: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && setEditing(null)}
        placeholder={t("personalLabelPlaceholder")}
        aria-label={t("personalLabel")}
        className="h-8 w-full border border-line/25 bg-ink-2 px-2 font-sans text-sm text-parch outline-none placeholder:text-muted-2 focus:border-gold/60"
      />
      <textarea
        value={marker.note}
        maxLength={280}
        rows={2}
        onChange={(e) => patch({ note: e.target.value })}
        placeholder={t("personalNotePlaceholder")}
        aria-label={t("personalNote")}
        className="mt-2 w-full resize-none border border-line/25 bg-ink-2 px-2 py-1.5 font-sans text-[0.8rem] text-parch outline-none placeholder:text-muted-2 focus:border-gold/60"
      />
      <div role="radiogroup" aria-label={t("personalIcon")} className="mt-2 flex gap-1">
        {(Object.keys(PERSONAL_ICONS) as PersonalIcon[]).map((icon) => (
          <button
            key={icon}
            type="button"
            role="radio"
            aria-checked={marker.icon === icon}
            aria-label={t(`personalIcons.${icon}`)}
            title={t(`personalIcons.${icon}`)}
            onClick={() => patch({ icon })}
            className={cn(
              "grid h-8 w-8 place-items-center border",
              marker.icon === icon ? "border-gold/70 bg-gold/15" : "border-line/20 hover:border-line/50",
            )}
            dangerouslySetInnerHTML={{ __html: personalIconSvg(icon, PERSONAL_COLORS[marker.color], 16) }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <div role="radiogroup" aria-label={t("personalColor")} className="flex gap-1.5">
          {(Object.keys(PERSONAL_COLORS) as PersonalColor[]).map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={marker.color === color}
              aria-label={t(`personalColors.${color}`)}
              title={t(`personalColors.${color}`)}
              onClick={() => patch({ color })}
              className={cn(
                "h-5 w-5 rounded-full border-2",
                marker.color === color ? "border-parch" : "border-transparent opacity-70 hover:opacity-100",
              )}
              style={{ background: PERSONAL_COLORS[color] }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setMarkers((prev) => prev.filter((m) => m.id !== marker.id));
            setEditing(null);
          }}
          className="flex items-center gap-1.5 px-2 py-1 font-sans text-[0.75rem] text-crimson-soft hover:bg-crimson/20"
        >
          <GlyphIcons.delete className="h-3.5 w-3.5" aria-hidden />
          {t("delete")}
        </button>
      </div>
      <p className="mt-2 font-sans text-[0.62rem] text-muted-2">{t("personalDragHint")}</p>
    </section>
  );
}
