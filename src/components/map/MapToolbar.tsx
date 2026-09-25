"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { MAP_EASE } from "./ActiveTypesRail";
import { useAtom } from "jotai";
import { Download, Info, MoreHorizontal, RotateCcw, Sparkles, Upload } from "lucide-react";
import { GlyphIcons } from "@/components/icons/GameGlyph";
import { cn, DnaSegmented, DnaSwitch } from "@/components/dna";
import { mapSettingsAtom, type MapSettings } from "@/lib/map/state";

export type ToolbarAction = "export" | "import" | "changelog" | "info" | "resetProgress";

/**
 * Colonne d'outils à droite de la carte (réglages, actions). Chaque bouton
 * ouvre un volet ancré à sa gauche ; un seul volet ouvert à la fois.
 */
export function MapToolbar({ onAction, extra }: { onAction: (action: ToolbarAction) => void; extra?: ReactNode }) {
  const t = useTranslations("map");
  const [open, setOpen] = useState<"settings" | "menu" | null>(null);
  const [settings, setSettings] = useAtom(mapSettingsAtom);
  const rootRef = useRef<HTMLDivElement>(null);

  // Fermeture au clic extérieur et à Échap.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const set = <K extends keyof MapSettings>(key: K, value: MapSettings[K]) => setSettings((s) => ({ ...s, [key]: value }));

  return (
    <div ref={rootRef} className="pointer-events-auto flex flex-col gap-1.5">
      <div className="relative">
        <ToolButton label={t("settings")} active={open === "settings"} onClick={() => setOpen(open === "settings" ? null : "settings")}>
          <GlyphIcons.settings className="h-[18px] w-[18px]" />
        </ToolButton>
        <AnimatePresence>
        {open === "settings" && (
          <Flyout title={t("settings")}>
            <Row label={t("hideFoundMarkers")}>
              <DnaSwitch checked={settings.hideFound} onChange={(v) => set("hideFound", v)} aria-label={t("hideFoundMarkers")} />
            </Row>
            <Row label={t("showPlaces")}>
              <DnaSwitch checked={settings.showPlaces} onChange={(v) => set("showPlaces", v)} aria-label={t("showPlaces")} />
            </Row>
            <Row label={t("markerSize")}>
              <DnaSegmented
                ariaLabel={t("markerSize")}
                value={settings.markerSize}
                onChange={(v) => set("markerSize", v)}
                options={[
                  { value: "s", label: "S" },
                  { value: "m", label: "M" },
                  { value: "l", label: "L" },
                ]}
              />
            </Row>
          </Flyout>
        )}
        </AnimatePresence>
      </div>

      {extra}

      <div className="relative">
        <ToolButton label={t("actionMenu")} active={open === "menu"} onClick={() => setOpen(open === "menu" ? null : "menu")}>
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </ToolButton>
        <AnimatePresence>
        {open === "menu" && (
          <Flyout>
            {(
              [
                ["export", <Download key="i" className="h-4 w-4 text-gold" />, t("exportMarkers")],
                ["import", <Upload key="i" className="h-4 w-4 text-gold" />, t("importMarkers")],
                ["changelog", <Sparkles key="i" className="h-4 w-4 text-electro" />, t("changelog")],
                ["info", <Info key="i" className="h-4 w-4 text-hydro" />, t("mapInfoButton")],
                ["resetProgress", <RotateCcw key="i" className="h-4 w-4 text-crimson-bright" />, t("resetAllMarkers")],
              ] as const
            ).map(([action, icon, label]) => (
              <button
                key={action}
                type="button"
                onClick={() => {
                  setOpen(null);
                  onAction(action);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left font-sans text-[0.82rem] hover:bg-white/5",
                  action === "resetProgress" ? "text-crimson-soft" : "text-parch",
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </Flyout>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-expanded={active}
      className={cn(
        "grid h-11 w-11 place-items-center border backdrop-blur-sm transition-colors",
        active ? "border-gold/60 bg-gold/20 text-gold-bright" : "border-line/25 bg-ink/85 text-parch/85 hover:border-gold/50 hover:text-gold-bright",
      )}
    >
      {children}
    </button>
  );
}

function Flyout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <motion.div
      className="absolute right-full top-0 mr-2 w-64 origin-top-right border border-line/30 bg-ink/95 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md"
      initial={{ opacity: 0, x: 8, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 8, scale: 0.97 }}
      transition={{ duration: 0.16, ease: MAP_EASE }}
    >
      {title && <p className="px-3 pb-1.5 pt-0.5 font-caps text-[0.58rem] uppercase tracking-[0.2em] text-gold/80">{title}</p>}
      {children}
    </motion.div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="font-sans text-[0.8rem] text-parch/85">{label}</span>
      {children}
    </div>
  );
}
