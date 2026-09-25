"use client";

import { useTranslations } from "next-intl";
import { useAtom, useSetAtom } from "jotai";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, LocateFixed, MapPinned, Minus } from "lucide-react";
import type { NormalizedMap } from "@/lib/map/taxonomy";
import { railCollapsedAtom, refitAtom } from "@/lib/map/state";
import { useMapLabels } from "./useMapLabels";

/** Courbe commune des animations de la carte : départ vif, arrivée douce. */
export const MAP_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Colonne accolée au panneau : bouton « recentrer », puis le rail des types
 * affichés. Comme sur HoYoLAB, le rail se rétracte en un seul bouton portant
 * le nombre de types affichés, pour ne pas empiler des icônes sur la carte ;
 * déplié, une flèche en tête le replie. Au survol d'un type, une pastille
 * « – » le retire.
 *
 * Animation : la colonne se déroule vers le bas depuis le bouton (masque
 * `clip-path`, les icônes arrivent en cascade) et remonte au repli. Le
 * `MotionConfig reducedMotion="user"` global coupe tout pour qui le demande.
 */
export function ActiveTypesRail({
  map,
  activeTypes,
  onRemove,
}: {
  map: NormalizedMap;
  activeTypes: ReadonlySet<string>;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations("map");
  const { typeName } = useMapLabels();
  const [collapsed, setCollapsed] = useAtom(railCollapsedAtom);
  const refit = useSetAtom(refitAtom);
  const shown = map.types.filter((g) => activeTypes.has(g.id));

  const square =
    "pointer-events-auto grid h-11 w-11 place-items-center border border-line/25 bg-ink/85 text-parch/85 backdrop-blur-sm transition-colors hover:border-gold/50 hover:text-gold-bright";

  return (
    <div className="flex min-h-0 flex-col items-start gap-2">
      <button type="button" onClick={() => refit((n) => n + 1)} aria-label={t("recenter")} title={t("recenter")} className={square}>
        <LocateFixed className="h-[18px] w-[18px]" />
      </button>

      {/* Les deux états se superposent le temps de la transition : le bouton
          compact reste en place pendant que la colonne se déroule par-dessus. */}
      <div className="relative flex min-h-0 flex-col">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.length > 0 && collapsed && (
            <motion.button
              key="collapsed"
              type="button"
              onClick={() => setCollapsed(false)}
              aria-expanded={false}
              aria-label={t("shownExpand", { count: shown.length })}
              title={t("shownExpand", { count: shown.length })}
              className={`relative ${square}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.18, ease: MAP_EASE }}
            >
              <MapPinned className="h-[18px] w-[18px]" />
              <motion.span
                key={shown.length}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 22 }}
                className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-crimson-bright px-1 font-mono text-[0.58rem] leading-none text-white"
              >
                {shown.length}
              </motion.span>
            </motion.button>
          )}

          {shown.length > 0 && !collapsed && (
            <motion.div
              key="expanded"
              className="pointer-events-auto flex min-h-0 w-11 flex-col items-center border border-line/25 bg-ink/85 backdrop-blur-sm"
              initial={{ clipPath: "inset(0 0 100% 0)", opacity: 0.6 }}
              animate={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
              exit={{ clipPath: "inset(0 0 100% 0)", opacity: 0.6 }}
              transition={{ duration: 0.28, ease: MAP_EASE }}
            >
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-expanded
                aria-label={t("shownCollapse")}
                title={t("shownCollapse")}
                className="grid h-7 w-full shrink-0 place-items-center border-b border-line/15 text-muted transition-colors hover:text-gold-bright"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <motion.ul
                aria-label={t("shownList")}
                className="flex min-h-0 flex-col items-center gap-1.5 overflow-y-auto py-2 [scrollbar-width:none]"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.025, delayChildren: 0.05 } } }}
              >
                <AnimatePresence initial={false}>
                  {shown.map((g) => {
                    const label = typeName(g);
                    return (
                      <motion.li
                        key={g.id}
                        layout
                        variants={{ hidden: { opacity: 0, y: -6 }, visible: { opacity: 1, y: 0 } }}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.2, ease: MAP_EASE }}
                      >
                        <button
                          type="button"
                          onClick={() => onRemove(g.id)}
                          title={t("hideType", { name: label })}
                          aria-label={t("hideType", { name: label })}
                          className="group relative grid h-8 w-8 place-items-center rounded-full border border-line/25 bg-ink-2 transition-colors hover:border-crimson-bright/70"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={g.icon} alt="" className="h-5 w-5 object-contain" />
                          <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-crimson-bright text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                            <Minus className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden />
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
