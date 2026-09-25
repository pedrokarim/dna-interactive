"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { MAP_EASE } from "./ActiveTypesRail";
import { Check, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/components/dna";
import type { MapTypeGroup, NormalizedMap } from "@/lib/map/taxonomy";
import { typeProgress } from "@/lib/map/progress";
import { useMapLabels } from "./useMapLabels";

/**
 * Liste des types affichés sur la carte courante (« Marqué » sur HoYoLAB) :
 * une ligne par type, plus lisible qu'une grille quand on veut savoir ce qui
 * est à l'écran. Le menu « … » porte les actions de masse sur un type.
 */
export function MarkedView({
  map,
  marked,
  activeTypes,
  onToggleType,
  onMarkType,
}: {
  map: NormalizedMap;
  marked: ReadonlySet<string>;
  activeTypes: ReadonlySet<string>;
  onToggleType: (id: string) => void;
  /** Coche (true) ou décoche (false) tous les points d'un type. */
  onMarkType: (group: MapTypeGroup, found: boolean) => void;
}) {
  const t = useTranslations("map");
  const { typeName } = useMapLabels();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const shown = map.types.filter((g) => activeTypes.has(g.id));

  if (shown.length === 0)
    return <p className="flex-1 px-4 pt-8 text-center font-sans text-sm text-muted">{t("nothingShown")}</p>;

  return (
    <ul className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-2.5 pb-3">
      <AnimatePresence initial={false}>
      {shown.map((g, index) => {
        const p = typeProgress(g, marked);
        const done = g.tracked && p.total > 0 && p.found === p.total;
        return (
          <motion.li
            key={g.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: MAP_EASE, delay: Math.min(index, 12) * 0.02 } }}
            exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
            className="group relative flex items-center gap-2.5 border border-line/15 bg-ink-2/60 py-1.5 pl-2 pr-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.icon} alt="" className="h-7 w-7 shrink-0 object-contain" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-sans text-[0.82rem] text-parch">{typeName(g)}</span>
              <span className={cn("font-mono text-[0.62rem]", done ? "text-ok" : "text-muted")}>
                {g.tracked ? t("foundCount", { found: p.found, total: p.total }) : t("pointCount", { count: p.total })}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onToggleType(g.id)}
              aria-label={t("hideType", { name: typeName(g) })}
              title={t("hideType", { name: typeName(g) })}
              className="grid h-7 w-7 place-items-center text-muted opacity-0 transition hover:text-crimson-soft focus-visible:opacity-100 group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {g.tracked && (
              <button
                type="button"
                onClick={() => setMenuFor(menuFor === g.id ? null : g.id)}
                aria-expanded={menuFor === g.id}
                aria-label={t("typeActions")}
                className="grid h-7 w-7 place-items-center text-muted transition-colors hover:text-gold"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            )}
            <AnimatePresence>
            {menuFor === g.id && (
              <motion.div
                className="absolute right-1 top-full z-10 mt-1 w-56 origin-top-right border border-line/30 bg-ink py-1 shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.14, ease: MAP_EASE }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onMarkType(g, true);
                    setMenuFor(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[0.8rem] text-parch hover:bg-white/5"
                >
                  <Check className="h-3.5 w-3.5 text-ok" /> {t("markAllFound")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onMarkType(g, false);
                    setMenuFor(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[0.8rem] text-parch hover:bg-white/5"
                >
                  <X className="h-3.5 w-3.5 text-crimson-soft" /> {t("resetTypeProgress")}
                </button>
              </motion.div>
            )}
            </AnimatePresence>
          </motion.li>
        );
      })}
      </AnimatePresence>
    </ul>
  );
}
